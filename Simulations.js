// Inputs: int Seed, float UserArrival, float UserDeparture, float VotePeriod, function BiddingAlgorithm, float SimTime
// Returns: Javascript object of the following structure:
//     var conclusion = {
//          "synergies"              : [min, max, average, stdev];
//          "individualSatisfaction" : [min, max, average, stdev];
//          "fundsBid"               : [min, max, average, stdev];
//          "fundsWasted"            : [min, max, average, stdev];
//     }
function randomPolicyMatrixAndAgentsSimulation(Seed, UserArrival, UserDeparture, VotePeriod, BiddingAlgorithm, Simtime) {
    var sim = new Sim();
    var rand = new Random(Seed);
    var matrix = new PolicyMatrix(); // Generate new random policy matrix.

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
            
            this.agent = new Agent();
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
            voteTally = new Array(20);
            // Initialize to zero.
            for (var a = 0; a < 20; a++) {voteTally[a] = 0; }

            for (var agent in AgentCollection) {
                ballot = AgentCollection[agent].vote();
                for (var policy in ballot) {
                    if (ballot.hasOwnProperty(policy)) {
                        voteTally[policy] += ballot[policy];
                    }
                }
            }

            // BiddingAlgorithm should be a function that expects an array of size 20 where indices represent the policy numbers and contain the amount of currency bid on them.
            // It should return a JSON object of the following form (but
            // not necessarily in this order):
            //
            // var result = {
            //      synergies : numerical,
            //      individualSatisfaction : numerical,
            //      fundsBid : numerical,
            //      fundsWasted : numerical
            // }
            
            var result = BiddingAlgorithm(voteTally, AgentCollection, matrix);
            
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
    conclusion["synergies"] = [synergiesSeries.min().toFixed(2), synergiesSeries.max().toFixed(2), synergiesSeries.average().toFixed(2), synergiesSeries.deviation().toFixed(2)];
    conclusion["individualSatisfaction"] = [individualSatisfactionSeries.min().toFixed(2), individualSatisfactionSeries.max().toFixed(2), individualSatisfactionSeries.average().toFixed(2), individualSatisfactionSeries.deviation().toFixed(2)];
    conclusion["fundsBid"] = [fundsBidSeries.min().toFixed(2), fundsBidSeries.max().toFixed(2), fundsBidSeries.average().toFixed(2), fundsBidSeries.deviation().toFixed(2)];
    conclusion["fundsWasted"] = [fundsWastedSeries.min().toFixed(2), fundsWastedSeries.max().toFixed(2), fundsWastedSeries.average().toFixed(2), fundsWastedSeries.deviation().toFixed(2)];

    return conclusion;
}
