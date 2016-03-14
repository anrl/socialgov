load("Sim.js");
load("Random.js");

// -----------------------------------------------------------------------------------------------------------------
// We would also like to automatically generate policies (A and B side policies) with random distributions
// to compare purely random policy implementation, fixed side policy implementation, and voting policy implementation
// utility (using the same utility function).
//
// 1. Users arrive randomly to the cafe and enter. If the cafe facility is full, then the user blocks, and if they timeout
// before they are permitted to enter, they leave and record their premature departure in sim.dataseries
//
// 2. After BidTime amount of time passes, a bidding round begins. For each agent currently in the cafe facility, they are
// required to bid for their respective policies (they evenly distribute a portion of their remaining wealth to their desired
// set of policies).
// 
// 3. After everyone bids, a bidding algorithm will tally the bids for each policy, and then decide which policies to actually
// implement. We should restrict this to 5 policies only. Following are some ways the algorithm can handle bidding:
//  a) Choose the 10 highest voted policies, and then pick the 5 that maximize societal benefit (i.e. combination of policies
//  that results in the highest edge weighting).
//  Consider societal benefit (synergies), individual satisfaction, funds bid, and 'wasted' funds (i.e. funds that did not go towards a winning policy).
//  b) Just choose the 5 highest voted policies.
//  Consider societal benefit (synergies), individual satisfaction, funds bid, and 'wasted' funds (i.e. funds that did not go towards a winning policy).
//
// 4. Afterwards, we consider the policies to be implemented, and we log a score for each statistic in sim.stats:
//  a) Synergies (i.e. societal benefit)
//  b) Aggregate individual satisfaction
//  c) Funds bid
//  d) Wasted funds
//
// 5. Further improvements could involve adding currency generation (which simulates the process of mining for crypto-currencies).
//
// We also need to model rush hours vs. non-rush hours. This can be done with different simulations
// with different UserArrival parameters.
// -----------------------------------------------------------------------------------------------------------------

// Class of policy matrix that implements a randomly generated set of 20 A and B policies (10 each).
// The class weights implement a matrix that encodes the edge weights for all the policies.
// This allows us to quickly lookup the edge weights for policies.
var PolicyMatrix = function() {
    // Creates 20x20 matrix
    this.weights = [];
    for (var i = 0; i < 20; i++) {
        this.weights[i] = new Array(20);
    }
    
    // Now we iterate over the array and populate it with randomized edge weights.
    // 0 and 10 will have larger positive and negative weights associated with other policies.
    // We multiply all edge weights that are connected to 0 and 10 by some value (10), and
    // for all other edge weights we multiply by a smaller value (3).
    
    // First we build the positively correlated edges for the A policies.
    for (var a = 0; a < 10; a++) {
        for (var b = 0; b < 10; b++) {
            var multiplier = 4; // Math.random goes from 0 (inclusive) to 1 (exclusive).
            if (a == b) {
                this.weights[a][b] = 0;
            } else if (a == 0 || a == 10 || b == 0 || b == 10) {
                multiplier = 11;
                this.weights[a][b] = Math.random() * multiplier;
            } else {
                this.weights[a][b] = Math.random() * multiplier;
            }
        }
    }

    // Next we build the positively correlated edges for the B policies.
    for (var a = 10; a < 20; a++) {
        for (var b = 10; b < 20; b++) {
            var multiplier = 4; // Math.random goes from 0 (inclusive) to 1 (exclusive).
            if (a == b) {
                this.weights[a][b] = 0;
            } else if (a == 0 || a == 10 || b == 0 || b == 10) {
                multiplier = 11;
                this.weights[a][b] = Math.random() * multiplier;
            } else {
                this.weights[a][b] = Math.random() * multiplier;
            }
        }
    }
    
    // Last we build the negatively correlated edges for the A and B policies.
    for (var a = 0; a < 10; a++) {
        for (var b = 10; b < 20; b++) {
            if (a == 0 || a == 10 || b == 0 || b == 10) {
                multiplier = 11;
                this.weights[a][b] = (-1) * Math.random() * multiplier; 
                this.weights[b][a] = (-1) * Math.random() * multiplier;
            } else {
                this.weights[a][b] = (-1) * Math.random() * multiplier;
                this.weights[b][a] = (-1) * Math.random() * multiplier;
            }
        }
    }
}

var PolicySets = ["A", "B"];

// Agent class. Instantiates an 'Agent' with starting funds, random aggressiveness factor out of 100,
// vote method, and random set of policy preferences (but generally weighted on A or B (i.e. generally clustered within
// 0-9 or 10-19)).
var Agent = function() {
    // Requires a unique ID in order to effectively add/remove from the Agent collection.
    // Random integer between 0 and 999999 to string, and then append milliseconds to epoch as a good-enough form of UID.
    this.id = String(Math.floor(Math.random() * 1000000)) + String(Math.round(new Date().getTime()));
    // Assume everyone starts with same amount of currency.
    this.funds = 100;
    this.aggressiveness = Math.floor(Math.random() * 91) + 5; // Random aggressiveness between 5 and 95 (inclusive).

    this.preferenceSize = Math.floor(Math.random() * 10) + 1; // Size of preference array of random size between 1 and 10, inclusive.
    this.preferences = new Array(this.preferenceSize);

    // Select one of the policy sets (i.e. A or B).
    this.preferredSet = PolicySets[Math.floor(Math.random() * 2)];

    // First half of preference array is guaranteed to be in preferred policy set.
    for (var i = 0; i < Math.floor(this.preferenceSize/2); i++) {
        switch (this.preferredSet) {
            case "A":
                this.preferences[i] = Math.floor(Math.random() * 10); // If we prefer policy set A, then pick policies guaranteed to be in A (0-9 inclusive).
                break;
            case "B":
                this.preferences[i] = Math.floor(Math.random() * 10) + 10; // If we prefer policy set B, then pick policies guaranteed to be in B (10-19 inclusive).
        }
    }

    for (var i = Math.floor(this.preferenceSize/2) + 1; i < this.preferenceSize; i++) {
        this.preferences[i] = Math.floor(Math.random() * 20); // Last half will contain policies from either group.
    }

    // Because the first elements of the policy preferences array are guaranteed to be in the preferred policy set, and we vote starting from the 
    // beginning of the array, it is much more likely to get actually desired policies.

    // Voting has a minimum expenditure per policy voted.
    //
    // We assume that people will consume all of their votes in one round. Aggressiveness will denote how much they will spend
    // on each policy up until they run out of currency (i.e. higher aggressiveness means that voters will choose to spend more on
    // policies higher on their priority list, at the risk of not being able to vote for policies lower on their list).
    //
    // Vote function should return amount spent on each preferred policy in a JSON object, associating
    // votes to amounts. If the Agent has insufficient funds, it will return an empty object.
    this.vote = function() {
        votes = {};
        // Builds the 'votes' object starting from the first element in the preferences array and bidding the aggressiveness amount
        // for each until they have bid on all their preferred policies or run out of funds.
        for (var policy in this.preferences) {
            if (this.funds == 0) {
                break;
            }
            var decreaseAmount = Math.min(this.funds, this.aggressiveness);
            votes[policy] = decreaseAmount;
            this.funds -= decreaseAmount; 
        }
        return votes;
    }
}

// Tally is an integer array of size 20. Indices represent the policy number, and the integer is the number of votes for that policy.

// top5Voted calculates the effect of just taking the top 5 voted policies.
function top5Voted(tally, agents, policyMatrix) {
    var matrix = policyMatrix.weights;
    var result = {};
    var oldTally = tally.slice(); tally.sort(function(a, b) {return (b - a);});
    var maxTally = tally.slice(0, 5); // Take first 5 elements of sorted tally.
    var wastedTally = tally.slice(5, 20); // Take last 15 elements of sorted tally for waste.

    // First we calculate funds wasted.
    var waste = 0;
    for (var v in wastedTally) {
        if (wastedTally[v] > 0) { waste += wastedTally[v]; }
    }
    result.fundsWasted = waste;

    // Then we calculate total funds bid.
    var f = 0;
    for (var bid in maxTally) {
        if (maxTally[bid] > 0) { f += maxTally[bid]; }
    }
    f += waste;
    result.fundsBid = f;

    // Then we calculate the total synergies achieved using the policy matrix.
    // (Handle potential duplicate amounts)
    var s = 0;
    for (var i = 0; i < 5; i++) {
        for (var j = i; j < 5; j++) {
            var a = oldTally.indexOf(maxTally[i]);
            var b = oldTally.indexOf(maxTally[j]);
            if (a >= 0 && b >= 0) { 
                s += matrix[a][b];
            }
        }
    }
    result.synergies = s;

    // Finally we calculate the amount of individual satisfaction achieved.
    var ind = 0;
    for (var i = 0; i < 5; i++) {
        var chosenPolicy = oldTally.indexOf(maxTally[i]);
        for (agentIndex in agents) {
            var agentPreferences = agents[agentIndex].preferences;
            if (agentPreferences.indexOf(chosenPolicy) >= 0) {
                ind += 1;
            }
        }
    }

    result.individualSatisfaction = ind;

    return result;
}

// top10SocialWelfare takes the top 10 voted and picks the 5 of them that maximize social welfare.
function top10SocialWelfare(tally, agents) {

}

// Finish implementing Algorithm prototype when second algorithm is built.
var Algorithm = function(type) {
    switch (type) {
        case "A":
            return top5Voted;
            break;
        case "B":

    }
}

// UserArrival parameter can be adjusted in order to simulate rush hours.

function socialGovernanceSimulation(Seed, UserArrival, UserDeparture, VotePeriod, BiddingAlgorithm, Simtime) {
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

// socialGovernanceSimulation(Seed, UserArrival, UserDeparture, VotePeriod, BiddingAlgorithm, Simtime)

SIMULATION_TIME = 4800;

var SimulationResults = socialGovernanceSimulation(00, 1, 25, 100, top5Voted, SIMULATION_TIME);
print("Name of field | Minimum | Maximum | Average | Standard Deviation");
print("Total synergies: " + SimulationResults["synergies"]);
print("Individual satisfaction: " + SimulationResults["individualSatisfaction"]);
print("Funds bid: " + SimulationResults["fundsBid"]);
print("Funds wasted: " + SimulationResults["fundsWasted"]);
