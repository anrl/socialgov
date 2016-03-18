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
function top10SocialWelfare(tally, agents) {

}

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
