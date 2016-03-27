load("RandomAndSimJS.js");
load("Simulations.js");
load("Classes.js");
load("Algorithms.js");

function usage() {
    print("Usage: rhino Main.js [arrival_rate] [stay_length] [voting_period] [sim_length] [policy_matrix_size] [aggressiveness] [num_policies] [random_seed] [number_of_simulations]");
    print();
    print("Note: All parameters are unit agnostic. Times could be in seconds, minutes, whatever.");
    print();
    print("Further description of command line arguments:");
    print();
    print(" - Average time between arrivals : float");
    print(" - Average stay length : float");
    print(" - Time between voting periods : float");
    print(" - Simulation length : float");
    print(" - Policy matrix size : int");
    print(" - Aggressiveness : string : choice of the following: ['Low', 'Medium', 'High']");
    print(" - Number of policies implemented : int");
    print(" - Random seed : float");
    print(" - Number of simulations : int");
    quit();
}

AGGRESSIVENESS_ARRAY = ["Low", "Medium", "High"];
ARRIVAL_RATE = parseFloat(arguments[0]);
STAY_TIME = parseFloat(arguments[1]);
VOTE_PERIOD = parseFloat(arguments[2]);
SIM_LENGTH = parseFloat(arguments[3]);
POLICY_MATRIX_SIZE = parseInt(arguments[4]);
AGGRESSIVENESS = arguments[5];
NUMBER_POLICIES_IMPLEMENTED = parseInt(arguments[6]);
RANDOM_SEED = parseFloat(arguments[7]);
NUMBER_OF_SIMS = parseInt(arguments[8]);

if (arguments.length != 9) {
    usage();
} else if (isNaN(ARRIVAL_RATE) // refactor to use Array.prototype.all()
        || isNaN(STAY_TIME)
        || isNaN(VOTE_PERIOD)
        || isNaN(SIM_LENGTH)
        || isNaN(POLICY_MATRIX_SIZE)
        || AGGRESSIVENESS_ARRAY.indexOf(AGGRESSIVENESS) < 0
        || isNaN(NUMBER_POLICIES_IMPLEMENTED)
        || isNaN(RANDOM_SEED)
        || isNaN(NUMBER_OF_SIMS)) {
    usage();
}

// Helper functions.

// Returns the average of all elements in an array.
function average(arr) {
    var t = 0;
    for (var a in arr) {
        t += parseFloat(arr[a]);
    }
    return (t/arr.length);
}

function poolStdev(arr) {

}

// -----------------------------------------------------------------------------------------------------------------
// We would also like to automatically generate policies (A and B side policies) with random distributions
// to compare purely random policy implementation, fixed side policy implementation, and voting policy implementation
// utility (using the same utility function).
//
// 1. After BidTime amount of time passes, a bidding round begins. For each agent currently in the set of present agents, they are
// required to bid for their respective policies (they evenly distribute a portion of their remaining wealth to their desired
// set of policies).
// 
// 2. After everyone bids, a bidding algorithm will tally the bids for each policy, and then decide which policies to actually
// implement. We restrict this to 5 policies only.
//
// 3. Afterwards, we consider the policies to be implemented, and we log a score for each statistic in sim.stats:
//  a) Synergies (i.e. societal benefit)
//  b) Aggregate individual satisfaction
//  c) Funds bid
//  d) Wasted funds
//
// Notes: Further improvements could involve adding currency generation (which simulates the process of mining for crypto-currencies).
//
// We also need to model rush hours vs. non-rush hours. This can be done with different simulations
// with different UserArrival parameters.
// -----------------------------------------------------------------------------------------------------------------

// Inputs: int Seed, float UserArrival, float UserDeparture, float VotePeriod, function BiddingAlgorithm, float SimTime
//
// Returns: Javascript object of the following structure:
//     var conclusion = {
//          "synergies"              : [min, max, average, stdev];
//          "individualSatisfaction" : [min, max, average, stdev];
//          "fundsBid"               : [min, max, average, stdev];
//          "fundsWasted"            : [min, max, average, stdev];
//     }

var RANDOM_POLICY_MATRICES_RESULTS = [];
var SINGLE_POLICY_MATRIX_RESULTS = [];
var NO_POLICY_CHANGES_RESULTS = [];

var matrix = new PolicyMatrix(POLICY_MATRIX_SIZE);

for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    // Run simulations for random policy matrices each time.
    RANDOM_POLICY_MATRICES_RESULTS.push(
            randomPolicyMatrixSimulation(
                RANDOM_SEED,
                ARRIVAL_RATE,
                STAY_TIME,
                VOTE_PERIOD,
                top5Voted,
                SIM_LENGTH,
                POLICY_MATRIX_SIZE
            )
    )
    // Run simulations each time on the same policy matrix.
    SINGLE_POLICY_MATRIX_RESULTS.push(
            singlePolicyMatrixSimulation(
                RANDOM_SEED,
                ARRIVAL_RATE,
                STAY_TIME,
                VOTE_PERIOD,
                top5Voted,
                SIM_LENGTH,
                matrix,
                POLICY_MATRIX_SIZE
            )
    )

    // Run simulations on a random matrix each time but with no deviation
    // from a fixed set of votes.
    NO_POLICY_CHANGES_RESULTS.push( // PROBLEM IS IN HERE

            fixedPolicySimulation(
                RANDOM_SEED,
                ARRIVAL_RATE,
                STAY_TIME,
                VOTE_PERIOD,
                top5Voted,
                SIM_LENGTH,
                POLICY_MATRIX_SIZE
            )
    )
}

// We iterate over each collection of results to obtain desired results.
// 1. Comparison of synergies between fixed set of implemented policies
// and random policy matrices (i.e. when people can vote and change the
// implemented policies). Both with random policy matrices.
// 2. Same as above but on the same policy matrix.
// 3. Comparison of top5Voted vs top10Synergies on the same policy matrix.

// First we do the synergies comparison. We then serialize two arrays containing
// the synergy related data.

// Each element of the following arrays will contain an array of [min, max, average, stdev]
var synA = [];
var synB = [];
var indA = [];
var indB = [];

for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    synA.push(RANDOM_POLICY_MATRICES_RESULTS[a]["synergies"]);
    synB.push(NO_POLICY_CHANGES_RESULTS[a]["synergies"]);
    indA.push(RANDOM_POLICY_MATRICES_RESULTS[a]["individualSatisfaction"]);
    indB.push(NO_POLICY_CHANGES_RESULTS[a]["individualSatisfaction"]);
}

var aveArrSynA = [];
var aveArrSynB = [];
var stdevArrSynA = [];
var stdevArrSynB = [];


for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    aveArrSynA.push(synA[a][2]);
    aveArrSynB.push(synB[a][2]);
    stdevArrSynA.push(synA[a][3]);
    stdevArrSynB.push(synB[a][3]);
}

print("Results");
print();
print("Standard deviations for all observations WITH voting on randomized policy matrices: " + average(stdevArrSynA));
print();
print("Standard deviations for all observations WITHOUT voting on randomized policy matrices: " + average(stdevArrSynB));
print();
print("Average synergies WITH voting on randomized policy matrices: " + average(aveArrSynA));
print();
print("Average synergies WITHOUT voting on randomized policy matrices: " + average(aveArrSynB));
