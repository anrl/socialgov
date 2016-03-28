/***************************************************************************************************
 *
 *                     Types of simulations available in this module:
 *
 *  - randomPolicyMatrixSimulation : Generates a new random policy matrix every time
 *
 *  - singlePolicyMatrixSimulation : Takes an additional parameter as its PolicyMatrix.
 *      Designed to run a simulation on the same policy matrix many times.
 *
 *  - fixedPolicySimulation : At initialization, a random set of policies is implemented.
 *      There is no voting, so the policies are fixed in place and can never change.
 *
 **************************************************************************************************/

// Helper function to build a random vote tally structure (int array of size 20
// that contains the amount bid for each policy in each respective cell).
// Returns an int array of size 20 with random integers in each cell.
function buildFixedVotes(size) {
    var fixedVotes = new Array(size);
    for (var a = 0; a < size; a++) {
        fixedVotes[a] = Math.floor(Math.random() * 100);
    }
    return fixedVotes;
}

// Inputs: int Seed, float UserArrival, float UserDeparture, float VotePeriod, function BiddingAlgorithm, float SimTime, int PolicySize
// Returns: Javascript object of the following structure:
//     var conclusion = {
//          "observations" : int
//          "synergies"              : [min, max, average, stdev];
//          "individualSatisfaction" : [min, max, average, stdev];
//          "fundsBid"               : [min, max, average, stdev];
//          "fundsWasted"            : [min, max, average, stdev];
//     }
function fixedPolicySimulation(
        Seed,
        UserArrival,
        UserDeparture,
        VotePeriod,
        BiddingAlgorithm,
        Simtime,
        PolicySize,
        Aggressiveness,
        NumberImplemented) {
    var sim = new Sim();
    var rand = new Random(Seed);
    var matrix = new PolicyMatrix(PolicySize);
    var FixedVotes = buildFixedVotes(PolicySize);

    var fundsBidSeries = new Sim.TimeSeries("Funds Used");
    var fundsWastedSeries = new Sim.TimeSeries("Wasted Funds");
    var synergiesSeries = new Sim.TimeSeries("Synergies");
    var individualSatisfactionSeries = new Sim.TimeSeries("Individual Satisfaction");

    // We need to use an additional data structure to store the Agent objects in order to 
    // maintain memory of their funds and preferences.
    var AgentCollection = {};

    // The current set of implemented policies.
    var CurrentPolicies = [];

    // The User will act as a liaison between SimJS and our collection of Agents. Successful additions
    // to the cafe facility will call callback functions that place Agents into the collection.
    
    var User = {
        removeAgent: function() {
            var identity = this.id;
            delete AgentCollection.identity;
        },
        logTime: function() {
            // Function that is used as a callback to log the time at which the customer
            // left due to a long wait, in addition to incrementing some log value of total customers left.
            //
            // With the most naive implementation of this simulation, this is most likely unaffected by differences in
            // policy implementation.
        },
        start: function() {
            // var req = this.useFacility(cafe, (rand.exponential(1.0 / StayTime))).waitUntil(CustomerWaitTime, this.logTime);
            
            // User is not notified if it finishes waiting in the queue or is directly accepted into the facility.
            
            this.agent = new Agent(PolicySize, Aggressiveness, rand);
            this.id = this.agent.id;
            var newID = this.agent.id;
            AgentCollection[newID] = this.agent;

            var stayTime = rand.exponential(1.0 / UserDeparture);
            this.setTimer(stayTime).done(this.removeAgent);

            var nextArrival = rand.exponential(1.0 / UserArrival);
            this.setTimer(nextArrival).done(this.start);
        }
    };

    var SpaceAgent = {
        start: function() {
            var implementedPolicies = this.callVote();
            var nextVote = rand.exponential(1.0 / VotePeriod);
            this.setTimer(nextVote).done(this.start);
        },

        callVote: function() {
            // In this simulation, all votes are considered fixed in order
            // to simulate when there is no possible way to change the policies.
            voteTally = FixedVotes;

            // BiddingAlgorithm input  : int[] tally, object AgentCollection, PolicyMatrix matrix, totalToImplemented int
            // BiddingAlgorithm output : var result = {
            //      synergies : numerical,
            //      fundsBid : numerical,
            //      fundsWasted : numerical
            //      policies : [int] // array of implemented policies
            // }
            
            var result = BiddingAlgorithm(voteTally, AgentCollection, matrix, NumberImplemented);
            CurrentPolicies = result.policies.slice(); 
            
            synergiesSeries.record(result.synergies, sim.time());
            // individualSatisfactionSeries.record(result.individualSatisfaction, sim.time());
            fundsBidSeries.record(result.fundsBid, sim.time());
            fundsWastedSeries.record(result.fundsWasted, sim.time());
        }
    }

    var SatisfactionLogger = {
        start : function() {
            var currentLevel = this.getSatisfaction();
            individualSatisfactionSeries.record(currentLevel, sim.time());
            this.setTimer(1).done(this.start);
        },
        getSatisfaction : function() {
            var level = 0;
            for (var i in agents) {
                var prefs = agents[i].preferences;
                for (var a = 0; a < prefs.length; a++) {
                    if (CurrentPolicies.indexOf(prefs[a]) >= 0) {
                        level += 1;
                    }
                }
            }
            return level;
        }
    }
    sim.addEntity(User);
    sim.addEntity(SpaceAgent);

    sim.simulate(Simtime);

    fundsBidSeries.finalize(sim.time());
    fundsWastedSeries.finalize(sim.time());
    synergiesSeries.finalize(sim.time());
    individualSatisfactionSeries.finalize(sim.time());

    // Build a conclusion JSON object to return of the form:
    // var conclusion = {
    //      "observations" : int
    //      "synergies" : [min, max, average, stdev];
    //      "individualSatisfaction" : [min, max, average, stdev];
    //      "fundsBid" : [min, max, average, stdev];
    //      "fundsWasted" : [min, max, average, stdev];
    // }
    var conclusion = {};
    conclusion["observations"] = synergiesSeries.count();
    conclusion["synergies"] = [synergiesSeries.min().toFixed(2), synergiesSeries.max().toFixed(2), synergiesSeries.average().toFixed(2), synergiesSeries.deviation().toFixed(2)];
    conclusion["individualSatisfaction"] = [individualSatisfactionSeries.min().toFixed(2), individualSatisfactionSeries.max().toFixed(2), individualSatisfactionSeries.average().toFixed(2), individualSatisfactionSeries.deviation().toFixed(2)];
    conclusion["fundsBid"] = [fundsBidSeries.min().toFixed(2), fundsBidSeries.max().toFixed(2), fundsBidSeries.average().toFixed(2), fundsBidSeries.deviation().toFixed(2)];
    conclusion["fundsWasted"] = [fundsWastedSeries.min().toFixed(2), fundsWastedSeries.max().toFixed(2), fundsWastedSeries.average().toFixed(2), fundsWastedSeries.deviation().toFixed(2)];

    return conclusion;
}

// Inputs: int Seed, float UserArrival, float UserDeparture, float VotePeriod, function BiddingAlgorithm, float SimTime, PolicyMatrix InputMatrix, int PolicySize
// Returns: Javascript object of the following structure:
//     var conclusion = {
    //      "observations" : int
//          "synergies"              : [min, max, average, stdev];
//          "individualSatisfaction" : [min, max, average, stdev];
//          "fundsBid"               : [min, max, average, stdev];
//          "fundsWasted"            : [min, max, average, stdev];
//     }
function singlePolicyMatrixSimulation(
        Seed, 
        UserArrival, 
        UserDeparture, 
        VotePeriod, 
        BiddingAlgorithm, 
        Simtime, 
        InputMatrix, 
        PolicySize,
        Aggressiveness,
        NumberImplemented) {
    var sim = new Sim();
    var rand = new Random(Seed);
    var matrix = InputMatrix;

    var fundsBidSeries = new Sim.TimeSeries("Funds Used");
    var fundsWastedSeries = new Sim.TimeSeries("Wasted Funds");
    var synergiesSeries = new Sim.TimeSeries("Synergies");
    var individualSatisfactionSeries = new Sim.TimeSeries("Individual Satisfaction");

    // We need to use an additional data structure to store the Agent objects in order to 
    // maintain memory of their funds and preferences.
    var AgentCollection = {};

    // The User will act as a liaison between SimJS and our collection of Agents. Successful additions
    // to the cafe facility will call callback functions that place Agents into the collection.
    
    var User = {
        removeAgent: function() {
            var identity = this.id;
            delete AgentCollection.identity;
        },
        start: function() {
            // var req = this.useFacility(cafe, (rand.exponential(1.0 / StayTime))).waitUntil(CustomerWaitTime, this.logTime);
            
            // User is not notified if it finishes waiting in the queue or is directly accepted into the facility.
            
            this.agent = new Agent(PolicySize, Aggressiveness, rand);
            this.id = this.agent.id;
            var newID = this.agent.id;
            AgentCollection[newID] = this.agent;

            var stayTime = rand.exponential(1.0 / UserDeparture);
            this.setTimer(stayTime).done(this.removeAgent);

            var nextArrival = rand.exponential(1.0 / UserArrival);
            this.setTimer(nextArrival).done(this.start);
        }
    };

    var SpaceAgent = {
        start: function() {
            this.callVote();
            var nextVote = rand.exponential(1.0 / VotePeriod);
            this.setTimer(nextVote).done(this.start);
        },

        callVote: function() {
            voteTally = new Array(PolicySize);
            // Initialize to zero.
            for (var a = 0; a < PolicySize; a++) {voteTally[a] = 0; }

            for (var agent in AgentCollection) {
                ballot = AgentCollection[agent].vote();
                for (var policy in ballot) {
                    if (ballot.hasOwnProperty(policy)) {
                        voteTally[policy] += ballot[policy];
                    }
                }
            }

            // BiddingAlgorithm should return a JSON object of the following form (but
            // not necessarily in this order):
            //
            // var result = {
            //      synergies : numerical,
            //      fundsBid : numerical,
            //      fundsWasted : numerical
            //      policies : [int] // policies that are implemented.
            // }
            
            var result = BiddingAlgorithm(voteTally, AgentCollection, matrix, NumberImplemented);
            
            synergiesSeries.record(result.synergies, sim.time());
            individualSatisfactionSeries.record(result.individualSatisfaction, sim.time());
            fundsBidSeries.record(result.fundsBid, sim.time());
            fundsWastedSeries.record(result.fundsWasted, sim.time());
        }
    }
    sim.addEntity(User);
    sim.addEntity(SpaceAgent);

    sim.simulate(Simtime);

    fundsBidSeries.finalize(sim.time());
    fundsWastedSeries.finalize(sim.time());
    synergiesSeries.finalize(sim.time());
    individualSatisfactionSeries.finalize(sim.time());

    // Build a conclusion JSON object to return of the form:
    // var conclusion = {
    //      "synergies" : [min, max, average, stdev];
    //      "individualSatisfaction" : [min, max, average, stdev];
    //      "fundsBid" : [min, max, average, stdev];
    //      "fundsWasted" : [min, max, average, stdev];
    // }
    var conclusion = {};
    conclusion["observations"] = synergiesSeries.count();
    conclusion["synergies"] = [synergiesSeries.min().toFixed(2), synergiesSeries.max().toFixed(2), synergiesSeries.average().toFixed(2), synergiesSeries.deviation().toFixed(2)];
    conclusion["individualSatisfaction"] = [individualSatisfactionSeries.min().toFixed(2), individualSatisfactionSeries.max().toFixed(2), individualSatisfactionSeries.average().toFixed(2), individualSatisfactionSeries.deviation().toFixed(2)];
    conclusion["fundsBid"] = [fundsBidSeries.min().toFixed(2), fundsBidSeries.max().toFixed(2), fundsBidSeries.average().toFixed(2), fundsBidSeries.deviation().toFixed(2)];
    conclusion["fundsWasted"] = [fundsWastedSeries.min().toFixed(2), fundsWastedSeries.max().toFixed(2), fundsWastedSeries.average().toFixed(2), fundsWastedSeries.deviation().toFixed(2)];

    return conclusion;
}

// Inputs: int Seed, float UserArrival, float UserDeparture, float VotePeriod, function BiddingAlgorithm, float SimTime, int PolicySize
// Returns: Javascript object of the following structure:
//     var conclusion = {
//          "synergies"              : [min, max, average, stdev];
//          "individualSatisfaction" : [min, max, average, stdev];
//          "fundsBid"               : [min, max, average, stdev];
//          "fundsWasted"            : [min, max, average, stdev];
//     }
function randomPolicyMatrixSimulation(
        Seed, 
        UserArrival, 
        UserDeparture, 
        VotePeriod, 
        BiddingAlgorithm, 
        Simtime, 
        PolicySize,
        Aggressiveness,
        NumberImplemented) {
    var sim = new Sim();
    var rand = new Random(Seed);
    var matrix = new PolicyMatrix(PolicySize); // Generate new random policy matrix.

    var fundsBidSeries = new Sim.TimeSeries("Funds Used");
    var fundsWastedSeries = new Sim.TimeSeries("Wasted Funds");
    var synergiesSeries = new Sim.TimeSeries("Synergies");
    var individualSatisfactionSeries = new Sim.TimeSeries("Individual Satisfaction");

    // We need to use an additional data structure to store the Agent objects in order to 
    // maintain memory of their funds and preferences.
    var AgentCollection = {};

    // The User will act as a liaison between SimJS and our collection of Agents. Successful additions
    // to the cafe facility will call callback functions that place Agents into the collection.
    
    var User = {
        removeAgent: function() {
            var identity = this.id;
            delete AgentCollection.identity;
        },
        logTime: function() {
            // Function that is used as a callback to log the time at which the customer
            // left due to a long wait, in addition to incrementing some log value of total customers left.
            //
            // With the most naive implementation of this simulation, this is most likely unaffected by differences in
            // policy implementation.
        },
        start: function() {
            // var req = this.useFacility(cafe, (rand.exponential(1.0 / StayTime))).waitUntil(CustomerWaitTime, this.logTime);
            
            // User is not notified if it finishes waiting in the queue or is directly accepted into the facility.
            
            this.agent = new Agent(PolicySize, Aggressiveness, rand);
            this.id = this.agent.id;
            var newID = this.agent.id;
            AgentCollection[newID] = this.agent;

            var stayTime = rand.exponential(1.0 / UserDeparture);
            this.setTimer(stayTime).done(this.removeAgent);

            var nextArrival = rand.exponential(1.0 / UserArrival);
            this.setTimer(nextArrival).done(this.start);
        }
    };

    var SpaceAgent = {
        start: function() {
            this.callVote();
            var nextVote = rand.exponential(1.0 / VotePeriod);
            this.setTimer(nextVote).done(this.start);
        },

        callVote: function() {
            voteTally = new Array(PolicySize);
            // Initialize to zero.
            for (var a = 0; a < PolicySize; a++) {voteTally[a] = 0; }

            for (var agent in AgentCollection) {
                ballot = AgentCollection[agent].vote();
                for (var policy in ballot) {
                    if (ballot.hasOwnProperty(policy)) {
                        voteTally[policy] += ballot[policy];
                    }
                }
            }

            // BiddingAlgorithm should return a JSON object of the following form (but
            // not necessarily in this order):
            //
            // var result = {
            //      synergies : numerical,
            //      fundsBid : numerical,
            //      fundsWasted : numerical,
            //      policies : [int] // policies that are implemented.
            // }
            
            var result = BiddingAlgorithm(voteTally, AgentCollection, matrix, NumberImplemented);
            
            synergiesSeries.record(result.synergies, sim.time());
            // individualSatisfactionSeries.record(result.individualSatisfaction, sim.time());
            fundsBidSeries.record(result.fundsBid, sim.time());
            fundsWastedSeries.record(result.fundsWasted, sim.time());
        }
    }
    sim.addEntity(User);
    sim.addEntity(SpaceAgent);

    sim.simulate(Simtime);

    fundsBidSeries.finalize(sim.time());
    fundsWastedSeries.finalize(sim.time());
    synergiesSeries.finalize(sim.time());
    individualSatisfactionSeries.finalize(sim.time());

    // Build a conclusion JSON object to return of the form:
    // var conclusion = {
    //      "observations" : int
    //      "synergies" : [min, max, average, stdev];
    //      "individualSatisfaction" : [min, max, average, stdev];
    //      "fundsBid" : [min, max, average, stdev];
    //      "fundsWasted" : [min, max, average, stdev];
    // }
    var conclusion = {};
    conclusion["observations"] = synergiesSeries.count();
    conclusion["synergies"] = [synergiesSeries.min().toFixed(2), synergiesSeries.max().toFixed(2), synergiesSeries.average().toFixed(2), synergiesSeries.deviation().toFixed(2)];
    conclusion["individualSatisfaction"] = [individualSatisfactionSeries.min().toFixed(2), individualSatisfactionSeries.max().toFixed(2), individualSatisfactionSeries.average().toFixed(2), individualSatisfactionSeries.deviation().toFixed(2)];
    conclusion["fundsBid"] = [fundsBidSeries.min().toFixed(2), fundsBidSeries.max().toFixed(2), fundsBidSeries.average().toFixed(2), fundsBidSeries.deviation().toFixed(2)];
    conclusion["fundsWasted"] = [fundsWastedSeries.min().toFixed(2), fundsWastedSeries.max().toFixed(2), fundsWastedSeries.average().toFixed(2), fundsWastedSeries.deviation().toFixed(2)];

    return conclusion;
}
