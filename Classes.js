// Possible simTypes:
// 1. SingleMatrix
// 2. FixedPolicies
// 3. default - random policies each time
var Simulation = function(
            simType,
            Seed,
            UserArrival,
            UserDeparture, 
            VotePeriod, 
            BiddingAlgorithm, 
            Simtime, 
            InputMatrix, 
            PolicySize,
            Aggressiveness,
            NumberImplemented,
            FacilityCapacity) {

    // Helper function to build a random vote tally structure (int array of size 20
    // that contains the amount bid for each policy in each respective cell).
    // Returns an int array of size 20 with random integers in each cell.
    this.buildFixedVotes = function(size) {
        var fixedVotes = new Array(size);
        for (var a = 0; a < size; a++) {
            fixedVotes[a] = Math.floor(Math.random() * 1000);
        }
        return fixedVotes;
    }

    this.buildRandomCurrentPolicies = function(num, pol) {
        var helperArray = new Array(num);
        var returnArray = new Array(num);
        for (var a = 0; a < num; a++) {
            helperArray[a] = a;
        }
        for (var b = 0; b < num; b++) {
            var index = Math.floor(Math.random() * helperArray.length);
            returnArray[b] = helperArray[index];
            helperArray.splice(index, 1);
        }
        return returnArray;
    }

    this.run = function() {

    var sim = new Sim();
    var rand = new Random(Seed);
    var matrix;
    var FixedVotes = this.buildFixedVotes(PolicySize);
    var fixedBallotBox = new BallotBox();
    for (var a = 0; a < FixedVotes.length; a++) {
        var v = new Vote(a, FixedVotes[a]);
        fixedBallotBox.addVote(v);
    }

    switch (simType) {
        case "SingleMatrix":
            matrix = InputMatrix;
            break;
        default:
            matrix = new PolicyMatrix(PolicySize);
    }

    var fundsBidSeries = new Sim.TimeSeries("Funds Used");
    var fundsWastedSeries = new Sim.TimeSeries("Wasted Funds");
    var synergiesSeries = new Sim.TimeSeries("Synergies");
    var individualSatisfactionSeries = new Sim.TimeSeries("Individual Satisfaction");

    // We need to use an additional data structure to store the Agent objects in order to 
    // maintain memory of their funds and preferences.
    var AgentCollection = {};

    // The current set of implemented policies, randomly initialized.

    var CurrentPolicies = this.buildRandomCurrentPolicies(NumberImplemented, PolicySize);

    // List of satisfaction measures to be used for plotting satisfaction over time.
    var SatisfactionOverTime = [];
    
    var User = {
        removeAgent: function() {
            var identity = this.id;
            delete AgentCollection[identity];
        },
        start: function() {
            this.agent = new Agent(PolicySize, Aggressiveness, rand);

            //if (Object.keys(AgentCollection).length < FacilityCapacity && this.agent.hasSufficientSatisfaction(CurrentPolicies)) {
            if (Object.keys(AgentCollection).length < FacilityCapacity) {
                this.id = this.agent.id;
                var newID = this.agent.id;
                AgentCollection[newID] = this.agent;
                var stayTime = rand.exponential(1.0 / UserDeparture);
                this.setTimer(stayTime).done(this.removeAgent);
            }

            var nextArrival = rand.exponential(1.0 / UserArrival);
            this.setTimer(nextArrival).done(this.start);
        }
    };

    var SpaceAgent = {
        start: function() {
            this.setTimer(VotePeriod).done(this.callVote);
        },

        callVote: function() {
            // Finish debugging problem with infinite loop.
            // Apparently callVote is only called once?
            var result;

            switch (simType) {
                case "FixedPolicies":
                    result = BiddingAlgorithm(fixedBallotBox, AgentCollection, matrix, NumberImplemented);
                    break;
                default: 
                    var box = new BallotBox();

                    for (var agent in AgentCollection) {
                        var votes = AgentCollection[agent].vote();
                        for (var e = 0; e < (votes.length); e++) {
                            var agentVote = votes[e];
                            box.addVote(agentVote);
                        }
                    }

                    result = BiddingAlgorithm(box, AgentCollection, matrix, NumberImplemented);
            }

            print("Before voting policies: " + CurrentPolicies);
            CurrentPolicies = result.policies.slice(); 
            box.prettyPrint();
            print("Actually implemented: " + CurrentPolicies);
            
            synergiesSeries.record(result.synergies, sim.time());
            fundsBidSeries.record(result.fundsBid, sim.time());
            fundsWastedSeries.record(result.fundsWasted, sim.time());

            this.start();
        }
    }

    var SatisfactionLogger = {
        start : function() {
            var currentLevel = this.getSatisfaction();
            individualSatisfactionSeries.record(currentLevel, sim.time());
            SatisfactionOverTime.push(currentLevel);
            this.setTimer(1).done(this.start);
        },
        getSatisfaction : function() {
            var level = 0;
            for (var i in AgentCollection) {
                var agent = AgentCollection[i];
                level += agent.getSatisfactionLevel(CurrentPolicies);
            }
            return level;
        }
    }
    sim.addEntity(User);
    sim.addEntity(SpaceAgent);
    sim.addEntity(SatisfactionLogger);

    sim.simulate(Simtime);

    fundsBidSeries.finalize(sim.time());
    fundsWastedSeries.finalize(sim.time());
    synergiesSeries.finalize(sim.time());
    individualSatisfactionSeries.finalize(sim.time());

    var conclusion = {};

    conclusion["observations"] = synergiesSeries.count();

    conclusion["synergies"] = [
        synergiesSeries.min().toFixed(2), 
        synergiesSeries.max().toFixed(2), 
        synergiesSeries.average().toFixed(2), 
        synergiesSeries.deviation().toFixed(2)];

    conclusion["individualSatisfaction"] = [
        individualSatisfactionSeries.min().toFixed(2), 
        individualSatisfactionSeries.max().toFixed(2), 
        individualSatisfactionSeries.average().toFixed(2), 
        individualSatisfactionSeries.deviation().toFixed(2)];

    conclusion["fundsBid"] = [
        fundsBidSeries.min().toFixed(2), 
        fundsBidSeries.max().toFixed(2), 
        fundsBidSeries.average().toFixed(2), 
        fundsBidSeries.deviation().toFixed(2)];

    conclusion["fundsWasted"] = [
        fundsWastedSeries.min().toFixed(2), 
        fundsWastedSeries.max().toFixed(2), 
        fundsWastedSeries.average().toFixed(2), 
        fundsWastedSeries.deviation().toFixed(2)];

    conclusion["satisfactionOverTime"] = SatisfactionOverTime;

    return conclusion;
    }
}


// Agent class. Instantiates an 'Agent' with starting funds, random aggressiveness factor out of 100,
// vote method, and random set of policy preferences (but generally weighted on A or B (i.e. generally clustered within
// 0-9 or 10-19)).
var Agent = function(policyMatrixSize, aggressiveness, rng) {
    // Requires a unique ID in order to effectively add/remove from the Agent collection.
    // Random integer between 0 and 999999 to string, and then append milliseconds to epoch as a good-enough form of UID.
    this.id = String(Math.floor(Math.random() * 1000000)) + String(Math.round(new Date().getTime()));
    // Assume everyone starts with same amount of currency.
    this.funds = 100;

    this.preferenceSize = Math.floor(Math.random() * Math.floor(policyMatrixSize/2)) + 1; // Size of preference array of random size between 1 and 10, inclusive.
    this.preferences = new Array(this.preferenceSize);

    this.getMaxSatisfactionLevel = function() {
        return this.preferences.length;
    }

    switch (aggressiveness) {
        case "Low":
            this.aggressiveness = rng.normal(25, 5);
            this.satisfactionThreshold = rng.normal(this.getMaxSatisfactionLevel()*0.25, this.getMaxSatisfactionLevel()*0.05);
            break;
        case "Medium":
            this.aggressiveness = rng.normal(50, 5);
            this.satisfactionThreshold = rng.normal(this.getMaxSatisfactionLevel()*0.5, this.getMaxSatisfactionLevel()*0.05);
            break;
        case "High":
            this.aggressiveness = rng.normal(75, 5);
            this.satisfactionThreshold = rng.normal(this.getMaxSatisfactionLevel()*0.75, this.getMaxSatisfactionLevel()*0.05);
    }

    // Select one of the policy sets (i.e. A or B).
    var PolicySets = ["A", "B"];
    this.preferredSet = PolicySets[Math.floor(Math.random() * 2)];

    // First half of preference array is guaranteed to be in preferred policy set.
    for (var i = 0; i < Math.floor(this.preferenceSize/2); i++) {
        switch (this.preferredSet) {
            case "A":
                this.preferences[i] = Math.floor(Math.random() * Math.floor(policyMatrixSize/2));
                break;
            case "B":
                this.preferences[i] = Math.floor(Math.random() * (policyMatrixSize/2) + (policyMatrixSize/2));
        }
    }

    for (var i = Math.floor(this.preferenceSize/2); i < this.preferenceSize; i++) {
        this.preferences[i] = Math.floor(Math.random() * policyMatrixSize); // Last half will contain policies from either group.
    }
    // Vote function should return amount spent on each preferred policy in a Vote array, associating
    // votes to amounts. If the Agent has insufficient funds, it will return an empty object.
    this.vote = function() {
        votes = [];
        // Builds the 'votes' object starting from the first element in the preferences array and bidding the aggressiveness amount
        // for each until they have bid on all their preferred policies or run out of funds.
        for (var a = 0; a < this.preferences.length; a++) {
            if (this.funds == 0) {
                break;
            }
            var decreaseAmount = Math.min(this.funds, this.aggressiveness);
            var newVote = new Vote(this.preferences[a], decreaseAmount);
            this.funds -= decreaseAmount; 
            votes.push(newVote);
        }
        return votes;
    }

    this.getSatisfactionLevel = function(implementedPolicies) {
        var a = 0;
        for (var i = 0; i < this.preferences.length; i++) {
            if (implementedPolicies.indexOf(this.preferences[i]) >= 0) {
                a++;
            }
        }
        return a;
    }

    this.hasSufficientSatisfaction = function(implementedPolicies) {
        if (this.getSatisfactionLevel(implementedPolicies) >= this.satisfactionThreshold) {
            return true;
        } else {
            return false;
        }
    }
}

var Vote = function(p, v) {
    this.policy = p;
    this.bid = v;
}

var BallotBox = function() {
    this.votes = []; // array of Votes
    this.addVote = function(voteObject) {
        if (this.hasPolicy(voteObject)) {
            var i = 0;
            while (this.votes[i].policy != voteObject.policy) {
                i++;
            }
            this.votes[i].bid += voteObject.bid;
        } else {
            this.votes.push(voteObject);
        }
    }

    // Sorts by bid sizes in descending order.
    this.sortByBid = function() {
        this.votes.sort( function(a, b) { return (b.bid - a.bid); });
    }

    // Sorts by policy number in ascending order.
    this.sortByPolicy = function() {
        this.votes.sort(
                function(a, b) {
                    return (a.policy - b.policy);
                }
        );
    }

    this.hasPolicy = function(vote) {
        for (var a = 0; a < this.votes.length; a++) {
            if (this.votes[a].policy == vote.policy) {
                return true;
            }
        }
        return false;
    }

    this.prettyPrint = function() {
        var s = "";
        for (var a = 0; a < this.votes.length; a++) {
            s += (this.votes[a].policy + ", ");
        }
        s.slice(s.length-2, 2);
        print("Policies being voted on: " + s);
    }
}

// Class of policy matrix that implements a randomly generated set of [SIZE] A and B policies ([SIZE/2] each).
// The class weights implement a matrix that encodes the edge weights for all the policies.
// This allows us to quickly lookup the edge weights for policies.
var PolicyMatrix = function(size) {
    // Creates size x size matrix
    this.weights = [];
    for (var i = 0; i < size; i++) {
        this.weights[i] = new Array(size);
    }
    
    // Now we iterate over the array and populate it with randomized edge weights.
    // 0 and SIZE/2 will have larger positive and negative weights associated with other policies.
    // We multiply all edge weights that are connected to 0 and 10 by some value (10), and
    // for all other edge weights we multiply by a smaller value (3).
    
    // First we build the positively correlated edges for the A policies.
    for (var a = 0; a < Math.floor(size/2); a++) {
        for (var b = 0; b < Math.floor(size/2); b++) {
            var multiplier = 0.2*size; // Math.random goes from 0 (inclusive) to 1 (exclusive).
            if (a == b) {
                this.weights[a][b] = 0;
            } else if (a == 0 || a == Math.floor(size/2) || b == 0 || b == Math.floor(size/2)) {
                multiplier = 0.5*size;
                this.weights[a][b] = Math.random() * multiplier;
            } else {
                this.weights[a][b] = Math.random() * multiplier;
            }
        }
    }

    // Next we build the positively correlated edges for the B policies.
    for (var a = Math.floor(size/2)+1; a < size; a++) {
        for (var b = Math.floor(size/2)+1; b < size; b++) {
            var multiplier = 0.2*size; // Math.random goes from 0 (inclusive) to 1 (exclusive).
            if (a == b) {
                this.weights[a][b] = 0;
            } else if (a == 0 || a == Math.floor(size/2) || b == 0 || b == Math.floor(size/2)) {
                multiplier = 0.5*size;
                this.weights[a][b] = Math.random() * multiplier;
            } else {
                this.weights[a][b] = Math.random() * multiplier;
            }
        }
    }
    
    // Last we build the negatively correlated edges for the A and B policies.
    for (var a = 0; a < Math.floor(size/2); a++) {
        for (var b = Math.floor(size/2)+1; b < size; b++) {
            var multiplier = 0.2*size; // Math.random goes from 0 (inclusive) to 1 (exclusive).
            if (a == 0 || a == Math.floor(size/2) || b == 0 || b == Math.floor(size/2)) {
                multiplier = 0.5*size;
                this.weights[a][b] = (-1) * Math.random() * multiplier; 
                this.weights[b][a] = (-1) * Math.random() * multiplier;
            } else {
                this.weights[a][b] = (-1) * Math.random() * multiplier;
                this.weights[b][a] = (-1) * Math.random() * multiplier;
            }
        }
    }
}
