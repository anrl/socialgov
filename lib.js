function satisfactionZip(results) {
    var ret = [];
    var maxLength = results[0]["satisfactionOverTime"].length;
    for (var a = 0; a < maxLength; a++) {
        var element = 0;
        for (var b = 0; b < results.length; b++) {
            element += results[b]["satisfactionOverTime"][a];
        }
        ret.push(element/b);
    }
    return ret;
}

function synergiesZip(results) {
    var ret = [];
    var maxLength = results[0]["synergiesOverTime"].length;
    for (var a = 0; a < maxLength; a++) {
        var element = 0;
        for (var b = 0; b < results.length; b++) {
            element += results[b]["synergiesOverTime"][a];
        }
        ret.push(element/b);
    }
    return ret;
}

function bidZip(results) {
    var ret = [];
    var maxLength = results[0]["fundsBidOverTime"].length;
    for (var a = 0; a < maxLength; a++) {
        var element = 0;
        for (var b = 0; b < results.length; b++) {
            element += results[b]["fundsBidOverTime"][a];
        }
        ret.push(element/b);
    }
    return ret;
}

function wasteZip(results) {
    var ret = [];
    var maxLength = results[0]["fundsWastedOverTime"].length;
    for (var a = 0; a < maxLength; a++) {
        var element = 0;
        for (var b = 0; b < results.length; b++) {
            element += results[b]["fundsWastedOverTime"][a];
        }
        ret.push(element/b);
    }
    return ret;
}
