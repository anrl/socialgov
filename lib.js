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

// Double check this
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
