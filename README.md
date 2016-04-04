Social Governance Simulation
=====

This simulation can be run in the command line using Mozilla's Rhino project.
It uses discrete event simulation (supported by SimJS) in order to model the effects of
social policy selection on groups.

Usage
=====
rhino Main.js \[arrival\_rate\] \[stay\_length\] \[voting\_period\] \[sim\_length\] \[policy\_matrix\_size\] \[aggressiveness\] \[num\_policies\] \[random\_seed\] \[number\_of\_simulations\] \[facility\_capacity\]

Note: All parameters are unit agnostic. Times could be in seconds, minutes, whatever.

Further description of command line arguments:

 - Average time between arrivals : float
 - Average stay length : float
 - Time between voting periods : float
 - Simulation length : float
 - Policy matrix size : int
 - Aggressiveness of population : string : choice of the following: ['Low', 'Medium', 'High']
 - Number of policies implemented : int
 - Random seed : float
 - Number of simulations : int
 - Facility capacity : int


Simulation Flow
=====
1. Policy matrix of size policy\_matrix\_size by policy\_matrix\_size is created. (if this is the fixed policy matrix simulation, then we use the supplied policy matrix.
2. All arrival rates and stay lengths are distributed with an exponential distribution to model the time in between arrivals that are assumed to occur with a Poisson distribution. When it is time for another arrival we create another agent. Agents are created with an innate preference for one type of policy, a random set of preferred policies that mainly consist of that type of policy, and an aggressiveness factor that influences their voting habits. These parameters are all supplied by the command line.
3. The agent is created and is stored in some facility and leaves after some period of time, determined by an exponential distribution with the parameter supplied by the command line argument corresponding to stay\_length.
4. Every voting period, the facility calls for a vote, and everyone within that facility must vote. The facility will then tally up the votes and 'implement' a certain number of policies determined by the command line argument num\_policies. Then the bidding algorithm will determine the effects of this vote on the group, tracking statistics such as synergies, funds used, funds wasted, and individual satisfaction.
5. As such, the simulation proceeds until sim\_length amount of time has passed. Then, another simulation will begin if the user has specified to do more than one simulation.
6. At the end of all simulations, a csv file containing all data will be exported that can be used for generating plots and other graphics.

Additional information
=====
We assume that policies can be separated into categories (e.g. democratic vs. republican, smoking vs. non-smoking), and that
policies that lie within the same category work well together and have synergistic effects.
Thus, the policies are modeled as an N by N matrix, where there are a total of N policies in the simulation universe, and policies
are numbered in their natural ordering up to N.

They are separated into two groups (denoted as A and B, where A = [0..N/2), B = [N/2, N)) due to our simplifying assumption that there are only two policy groups.
The synergies between any two policies is the value indexed by the two policy numbers.
(i.e. matrix\[2\]\[3\] would give the synergy achieved when both policies 2 and 3 are implemented)


Supports
-----
- Agent creation
 - Initial funds
 - Random aggressiveness factor
 - Policy preference generation
- Policy matrix generation
- Randomized agent arrival
- Space agent vote calling
- Stats output
- Multiple simulations on same policy set
- Google charts
- Update README to have a better simulation overview.
- Limited facility capacity.
- Minimum required individual satisfaction
- Refactor simulations into classes of sims.

TODO
-----
- Multithreaded simulation? Only if we want to only use Rhino.
- Fix double counting votes
