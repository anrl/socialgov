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
    var PolicySets = ["A", "B"];
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
