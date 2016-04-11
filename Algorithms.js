// Finish implementing Algorithm prototype when second algorithm is built.
var Algorithm = function(type) {
    switch (type) {
        case "A":
            return top5Voted;
            break;
        case "B":

    }
}

// top10SocialWelfare takes the top 10 voted and picks the 5 of them that maximize social welfare.
function top10Synergies(tally, agents, policyMatrix) {
}

// top5Voted calculates the effect of just taking the top [total] voted policies.
// ballot
function top5Voted(ballotBox, agents, policyMatrix, total) {
    ballotBox.sortByBid();

    var matrix = policyMatrix.weights;
    var result = {};
    result.policies = new BallotBox();

    // First we calculate funds wasted.
    var waste = 0;
    if (total < ballotBox.votes.length) {
        for (var a = total; a < ballotBox.votes.length; a++) {
            waste += ballotBox.votes[a].bid;
        }
    }
    result.fundsWasted = waste;

    // Then we calculate total funds bid.
    var f = 0;
    for (var i = 0; i < ballotBox.votes.length; i++) {
        f += ballotBox.votes[i].bid;
    }
    result.fundsBid = f;

    // Then we calculate the total synergies achieved using the policy matrix.
    // (Handle potential duplicate amounts), simultaneously telling us the policies
    // that were implemented.
    var s = 0;
    for (var a = 0; a < Math.min(total, ballotBox.votes.length); a++) {
        var policy1 = ballotBox.votes[a].policy;
        result.policies.addVote(ballotBox.votes[a]);
        for (var b = a; b < Math.min(total, ballotBox.votes.length); b++) {
            var policy2 = ballotBox.votes[b].policy;
            s += matrix[policy1][policy2];
        }
    }
    result.synergies = s;

    // Finally, we calculate the amount of individual satisfaction achieved.
    // var ind = 0;
    // for (var i = 0; i < total; i++) {
    //     var chosenPolicy = oldTally.indexOf(maxTally[i]);
    //     for (agentIndex in agents) {
    //         var agentPreferences = agents[agentIndex].preferences;
    //         if (agentPreferences.indexOf(chosenPolicy) >= 0) {
    //             ind += 1;
    //         }
    //     }
    // }

    // result.individualSatisfaction = ind;

    return result;
}
