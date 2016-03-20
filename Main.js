load("RandomAndSimJS.js");
load("Simulations.js");
load("Classes.js");
load("Algorithms.js");

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

SIMULATION_TIME = 4800;

var SimulationResults = randomPolicyMatrixAndAgentsSimulation(00, 1, 25, 100, top5Voted, SIMULATION_TIME);
print(SimulationResults["synergies"]);
serialize(SimulationResults, "results/results.json");
