load("RandomAndSimJS.js");
load("Simulations.js");
load("Classes.js");
load("Algorithms.js");

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

// Units are all in minutes
RANDOM_SEED = 12345;
ONE_DAY = 600;
ARRIVAL_RATE = 5;
STAY_TIME = 15;
VOTE_PERIOD = 30;
NUMBER_OF_SIMS = 100;

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

var matrix = new PolicyMatrix();

for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    // Run simulations for random policy matrices each time.
    RANDOM_POLICY_MATRICES_RESULTS.push(
            randomPolicyMatrixSimulation(
                RANDOM_SEED,
                ARRIVAL_RATE,
                STAY_TIME,
                VOTE_PERIOD,
                top5Voted,
                ONE_DAY
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
                ONE_DAY,
                matrix
            )
    )

    // Run simulations on a random matrix each time but with no deviation
    // from a fixed set of votes.
    NO_POLICY_CHANGES_RESULTS.push(
            fixedPolicySimulation(
                RANDOM_SEED,
                ARRIVAL_RATE,
                STAY_TIME,
                VOTE_PERIOD,
                top5Voted,
                ONE_DAY
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
}

var aveSynA = [];
var aveSynB = [];
var stdevSynA = [];
var stdevSynB = [];

for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    aveSynA.push(synA[a][2]);
    aveSynB.push(synB[a][2]);
    stdevSynA.push(synA[a][3]);
    stdevSynB.push(synB[a][3]);
}

// Now we need to get the variances to obtain the stdev of all samples.
var varArrSynA = stdevSynA.map( function(val, ind, arr) { return (val*val); });
var varArrSynB = stdevSynB.map( function(val, ind, arr) { return (val*val); });
var stdevSynA = Math.sqrt(varArrSynA.reduce(function(pv, cv) { return pv + cv; }, 0));
var stdevSynB = Math.sqrt(varArrSynB.reduce(function(pv, cv) { return pv + cv; }, 0));

print(aveSynA);
print();
print(aveSynB);
print();
print(stdevSynA);
print();
print(stdevSynB);
