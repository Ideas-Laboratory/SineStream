// the thickness of a layer at a timepoint
function getSize(layers, layerIndex, time) {
    if (layerIndex < layers.length && time < layers[0].size.length && layerIndex >= 0 && time >= 0) {
        if (layers[layerIndex].size[time] < 0.000001) {
            return 0;
        }
        return layers[layerIndex].size[time];
    } else {
        return 0;
    }
}

/**
 * get the layout data according to the order and baseline
 * @param layers
 * @param baseline
 * @returns {*}
 */
function stackOnBaseline(layers, baseline) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        layer.yBottom = baseline.slice(0);
        for (var j = 0; j < baseline.length; j++)
            // baseline[j] -= layer.size[j];
            baseline[j] += layer.size[j];
        layer.yTop = baseline.slice(0);
    }
    // console.log(layers);
    return layers;
}


/**
 * get the data for streamgraph drawing
 * @param Layers
 * @param option
 * @returns {[]}
 */
function getLayersData(Layers, option = {
    updateAxisScale: true
}) {
    let data = []
    let YBottom = Infinity,
        YTop = -Infinity;
    for (let i = 0; i < Layers.length; i++) {
        data.push([]);
    }
    for (let i = 0; i < Layers.length; i++) {
        data[i].name = Layers[i].name;
        data[i].id = Layers[i].id;
        data[i].fillcolor = Layers[i].fillcolor;

        let curveBottom = d3.interpolateBasis(Layers[i].yBottom);
        let curveTop = d3.interpolateBasis(Layers[i].yTop);

        for (let j = 0; j < Layers[i].size.length; j++) {
            data[i].push([Layers[i].yBottom[j], Layers[i].yTop[j]])
            data[i][j].time = j;

            YBottom = Math.min(YBottom, curveBottom(j / (Layers[i].size.length - 1)));
            YTop = Math.max(YTop, curveTop(j / (Layers[i].size.length - 1)));
        }
    }
    //whether update the LinearX and LinearY
    if (option.updateAxisScale) {
        linearX = d3.scaleLinear()
            .domain([0, currentLayers[0].size.length])
            .range([0, width])
        updateLinearY(YBottom, YTop)
    }
    return data;
}


/**
 * update linearY
 * @param curYBottom
 * @param curYTop
 */
function updateLinearY(curYBottom, curYTop) {
    linearY = d3.scaleLinear()
        .domain([curYBottom, curYTop])
        // .domain([curYBottom * 1.2, curYTop * 1.2])
        .range([height, 0]);
}