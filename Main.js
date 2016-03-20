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

var synergiesWithVoting = [];
var synergiesWithoutVoting = [];

for (var a = 0; a < NUMBER_OF_SIMS; a++) {
    synergiesWithVoting.push(RANDOM_POLICY_MATRICES_RESULTS[a]["synergies"]);
    synergiesWithoutVoting.push(NO_POLICY_CHANGES_RESULTS[a]["synergies"]);
}

print(synergiesWithVoting);
print(synergiesWithoutVoting);
