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
function top5Voted(tally, agents, policyMatrix, total) {
    var matrix = policyMatrix.weights;
    var result = {};
    result.policies = [];
    var oldTally = tally.slice();
    tally.sort(function(a, b) {return (b - a);});
    var maxTally = tally.slice(0, total); // Take first elements of sorted tally.
    var wastedTally = tally.slice(total, 20); // Take last elements of sorted tally for waste.

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
    // (Handle potential duplicate amounts), simultaneously telling us the policies
    // that were implemented.
    var s = 0;
    for (var i = 0; i < total; i++) {
        var a = oldTally.indexOf(maxTally[i]);

        if (a >= 0) { result.policies.push(a); } // Add the policy number to the policies implemented.

        for (var j = i; j < total; j++) {
            var b = oldTally.indexOf(maxTally[j]);
            if (a >= 0 && b >= 0) { 
                s += matrix[a][b];
            }
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
