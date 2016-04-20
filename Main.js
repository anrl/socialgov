load("RandomAndSimJS.js");
load("Classes.js");
load("Algorithms.js");
load("lib.js");
importPackage(java.io);

function usage() {
    print("Usage: rhino Main.js [arrival_rate] [stay_length] [voting_period] [sim_length] [policy_matrix_size] [aggressiveness] [num_policies] [random_seed] [number_of_simulations] [facility_capacity]");
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
    print(" - Facility capacity : int");
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
FACILITY_CAPACITY = parseInt(arguments[9]);

if (arguments.length != 10) {
    usage();
} else if (isNaN(ARRIVAL_RATE) // refactor to use Array.prototype.all()
        || isNaN(STAY_TIME)
        || isNaN(VOTE_PERIOD)
        || isNaN(SIM_LENGTH)
        || isNaN(POLICY_MATRIX_SIZE)
        || AGGRESSIVENESS_ARRAY.indexOf(AGGRESSIVENESS) < 0
        || isNaN(NUMBER_POLICIES_IMPLEMENTED)
        || isNaN(RANDOM_SEED)
        || isNaN(NUMBER_OF_SIMS)
        || isNaN(FACILITY_CAPACITY)) {
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

// Pool standard deviations given a list of stdevs.
function poolStdev(arr) {
}

// These arrays store the results from each iteration of simulation.
var RANDOM_POLICY_MATRICES_RESULTS = [];
var SINGLE_POLICY_MATRIX_RESULTS = [];
var NO_POLICY_CHANGES_RESULTS = [];

// This matrix is used for the fixed policy set simulation.
var matrix = new PolicyMatrix(POLICY_MATRIX_SIZE);

var RandomMatrixSim = new Simulation(
        "RandomMatrix", 
        RANDOM_SEED, 
        ARRIVAL_RATE, 
        STAY_TIME, 
        VOTE_PERIOD, 
        top5Voted, 
        SIM_LENGTH, 
        matrix, 
        POLICY_MATRIX_SIZE, 
        AGGRESSIVENESS, 
        NUMBER_POLICIES_IMPLEMENTED, 
        FACILITY_CAPACITY);

var SingleMatrixSim = new Simulation(
        "SingleMatrix", 
        RANDOM_SEED, 
        ARRIVAL_RATE, 
        STAY_TIME, 
        VOTE_PERIOD, 
        top5Voted, 
        SIM_LENGTH, 
        matrix, 
        POLICY_MATRIX_SIZE, 
        AGGRESSIVENESS, 
        NUMBER_POLICIES_IMPLEMENTED, 
        FACILITY_CAPACITY);

var FixedPoliciesSim = new Simulation(
        "FixedPolicies", 
        RANDOM_SEED, 
        ARRIVAL_RATE, 
        STAY_TIME, 
        VOTE_PERIOD, 
        top5Voted, 
        SIM_LENGTH, 
        matrix, 
        POLICY_MATRIX_SIZE, 
        AGGRESSIVENESS, 
        NUMBER_POLICIES_IMPLEMENTED, 
        FACILITY_CAPACITY);

for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    // Run simulations for random policy matrices each time.
    RANDOM_POLICY_MATRICES_RESULTS.push(RandomMatrixSim.run());

    // Run simulations each time on the same policy matrix.
    SINGLE_POLICY_MATRIX_RESULTS.push(SingleMatrixSim.run());

    // Run simulations on a random matrix each time but with no deviation
    // from a fixed set of votes.
    NO_POLICY_CHANGES_RESULTS.push(FixedPoliciesSim.run());
}

// Structure of the result of each simulation :
//     var conclusion = {
//          "observations" : int
//          "synergies"              : [min, max, average, stdev];
//          "individualSatisfaction" : [min, max, average, stdev];
//          "fundsBid"               : [min, max, average, stdev];
//          "fundsWasted"            : [min, max, average, stdev];
//          "satisfactionOverTime"   : [array of observations];
//          "synergiesOverTime"      : [array of observations];
//     }
//
// We currently have arrays of these results:
// - RANDOM_POLICY_MATRICES_RESULTS
// - SINGLE_POLICY_MATRIX_RESULTS
// - NO_POLICY_CHANGES_RESULTS

var resultsSet = {
    "results/random_policy_matrices" : RANDOM_POLICY_MATRICES_RESULTS,
    "results/single_policy_matrix" : SINGLE_POLICY_MATRIX_RESULTS,
    "results/no_policy_changes" : NO_POLICY_CHANGES_RESULTS
};

var randomSat = satisfactionZip(RANDOM_POLICY_MATRICES_RESULTS);
var singleSat = satisfactionZip(SINGLE_POLICY_MATRIX_RESULTS);
var noPolicyChangesSat = satisfactionZip(NO_POLICY_CHANGES_RESULTS);

var randomSyn = synergiesZip(RANDOM_POLICY_MATRICES_RESULTS);
var singleSyn = synergiesZip(SINGLE_POLICY_MATRIX_RESULTS);
var noPolicyChangesSyn = synergiesZip(NO_POLICY_CHANGES_RESULTS);

var randomBid = bidZip(RANDOM_POLICY_MATRICES_RESULTS);
var singleBid = bidZip(SINGLE_POLICY_MATRIX_RESULTS);
var noPolicyChangesBid = bidZip(NO_POLICY_CHANGES_RESULTS);

var randomWaste = wasteZip(RANDOM_POLICY_MATRICES_RESULTS);
var singleWaste = wasteZip(SINGLE_POLICY_MATRIX_RESULTS);
var noPolicyChangesWaste = wasteZip(NO_POLICY_CHANGES_RESULTS);

var fundsBidSet = {
    "results/random_policy_matrices" : randomBid,
    "results/single_policy_matrix" : singleBid,
    "results/no_policy_changes" : noPolicyChangesBid
}

var fundsWastedSet = {
    "results/random_policy_matrices" : randomWaste,
    "results/single_policy_matrix" : singleWaste,
    "results/no_policy_changes" : noPolicyChangesWaste
}

var satisfactionSet = {
    "results/random_policy_matrices" : randomSat,
    "results/single_policy_matrix" : singleSat,
    "results/no_policy_changes" : noPolicyChangesSat
}

var synergiesSet  = {
    "results/random_policy_matrices" : randomSyn,
    "results/single_policy_matrix" : singleSyn,
    "results/no_policy_changes" : noPolicyChangesSyn
}

for (var res in resultsSet) {
    var satCSVString = satisfactionSet[res].join();
    var synCSVString = synergiesSet[res].join();
    var bidCSVString = fundsBidSet[res].join();
    var wasteCSVString = fundsWastedSet[res].join();
    var f = new File(res + "_satisfaction.csv");
    var ff = new File(res + "_synergies.csv");
    var fff = new File(res + "_fundsBid.csv");
    var ffff = new File(res + "_fundsWasted.csv");
    var pw = new PrintWriter(f);
    var pww = new PrintWriter(ff);
    var pwww = new PrintWriter(fff);
    var pwwww = new PrintWriter(ffff);
    pw.print(satCSVString);
    pww.print(synCSVString);
    pwww.print(bidCSVString);
    pwwww.print(wasteCSVString);
    pw.close();
    pww.close();
    pwww.close();
    pwwww.close();
}
