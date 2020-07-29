/**
 * get the label layout data of a streamgraph
 * @param layers
 * @param graphIndex
 * @returns {[]}
 */
function getLabelsData(layers, graphIndex) {
    layers = A_Copy_Of(layers)
    let layer_length = layers[0].size.length;

    layers.forEach(function (layer) {

        //图上的bottom，top坐标（这里要考虑图上的坐标系，零点是位于左上角的）
        layer.yBottom_Graph = layer.yBottom.map(d => linearY(d));
        layer.yTop_Graph = layer.yTop.map(d => linearY(d));

        let curveBottom = d3.interpolateBasis(layer.yBottom_Graph);
        let curveTop = d3.interpolateBasis(layer.yTop_Graph);

        //将这个曲线函数保存下来
        layer.interpolateBasis_Bottom = curveBottom
        layer.interpolateBasis_Top = curveTop
        //只包含整点的曲线坐标
        layer.yBottom_Graph_Curve = []
        layer.yTop_Graph_Curve = []
        //只包含整点之间半点的曲线坐标
        layer.yBottom_Graph_Curve_Midpoints = []
        layer.yTop_Graph_Curve_MidPoints = []
        //包含整点和整点之间半点的曲线坐标
        layer.yBottom_Graph_Curve_All = []
        layer.yTop_Graph_Curve_All = []

        for (let i = 0; i < layer_length; i++) {
            layer.yBottom_Graph_Curve.push(curveBottom(i / (layer_length - 1)))
            layer.yTop_Graph_Curve.push(curveTop(i / (layer_length - 1)))

            layer.yBottom_Graph_Curve_All.push(curveBottom(i / (layer_length - 1)))
            layer.yTop_Graph_Curve_All.push(curveTop(i / (layer_length - 1)))

            if (i < layer_length - 1) {
                layer.yBottom_Graph_Curve_Midpoints.push(curveBottom((i + 0.5) / (layer_length - 1)))
                layer.yTop_Graph_Curve_MidPoints.push(curveTop((i + 0.5) / (layer_length - 1)))

                layer.yBottom_Graph_Curve_All.push(curveBottom((i + 0.5) / (layer_length - 1)))
                layer.yTop_Graph_Curve_All.push(curveTop((i + 0.5) / (layer_length - 1)))
            }
        }
        //交换bottom和top，方便后面的计算理解
        // [layer.yBottom_Graph_Curve, layer.yTop_Graph_Curve] = [layer.yTop_Graph_Curve, layer.yBottom_Graph_Curve]

        // console.log(layer);
    })

    let LabelData = [];

    // max_Label_FontSize = 130;
    // min_Label_FontSize = 5;

    // let label_g = d3.select("#" + "myGraph_svg_" + graphIndex)
    //     .append("g")
    //     .attr("id", "cur_myLabels_g_" + graphIndex)
    //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    let label_g = d3.select("#" + "div_streamgraph")
        .append("svg")
        .attr("id", "test_svg")
        .attr("width", div_width)
        .attr("height", div_width * radio)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", "1.1")
    // .append("g")
    // .attr("id", "cur_myLabels_g_" + graphIndex)
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    for (let i = 0; i < layers.length; i++) {
        let layerName = layers[i].name;
        let layerID = layers[i].id;

        label_g.append("text")
            .attr("id", "cur_myLabels_g_" + graphIndex + "_" + layerID)
            .style("font-family", "黑体")
            .style("font-size", max_Label_FontSize + "px")
            .style("fill", "black")
            .text(layerName)
            .attr("transform", "translate(" + margin.left + "," + margin.top * 2 + ")") //这里加上transform只是为了更加直观的观察算法过程

        let thisFontSize = max_Label_FontSize;

        let final_X = 0,
            final_Y = 0,
            final_FontSize = 0;

        let thisLabelWidth_Graph,
            thisLabelHeight_Graph;


        while (thisFontSize > min_Label_FontSize) {
            label_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + layerID)
                .style("font-size", thisFontSize + "px")

            thisLabelWidth_Graph = document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBoundingClientRect().width
            thisLabelHeight_Graph = document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBoundingClientRect().height


            let availabeSpace = getSildeWindow(layers[i], thisLabelWidth_Graph)

            let maxAvailabeSpace = -Infinity,
                maxAvailabeSpace_ceiling = undefined,
                maxAvailabeSpace_floor = undefined,
                maxAvailabeSpace_i = undefined


            // let curResult = {
            //     maxSpace: space,
            //     ceiling: ceiling,
            //     floor: floor,
            //     index: i
            // }
            for (let i = 0; i < availabeSpace.length; i++) {
                if (availabeSpace[i].maxSpace > maxAvailabeSpace) {
                    maxAvailabeSpace = availabeSpace[i].maxSpace
                    maxAvailabeSpace_ceiling = availabeSpace[i].ceiling
                    maxAvailabeSpace_floor = availabeSpace[i].floor
                    maxAvailabeSpace_i = availabeSpace[i].index
                }
            }
            if (maxAvailabeSpace >= thisLabelHeight_Graph) {
                final_X = linearX(maxAvailabeSpace_i)
                final_Y = (maxAvailabeSpace_ceiling + maxAvailabeSpace_floor) / 2
                final_FontSize = thisFontSize;

                label_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + layerID)
                    .attr("transform", "translate(" + final_X + "," + final_Y + ")")
                    .style("font-size", thisFontSize + "px")
                    .attr("dominant-baseline", "middle")

                break;
            } else {
                // thisFontSize -= Math.max(1, 0.1 * thisFontSize);
                thisFontSize = downFont_Size(thisFontSize)
            }
        }

        if (thisFontSize < min_Label_FontSize) {
            // final_X = width / 2
            // final_Y = linearY(layers[i].yTop[Math.round(layers[i].yTop.length / 2)])
            final_X = 0
            final_Y = 0
            final_FontSize = 0;
            thisLabelWidth_Graph = 0
            thisLabelHeight_Graph = 0
        }


        let thisLabelData = {};
        thisLabelData.id = layers[i].id;
        thisLabelData.name = layerName;
        thisLabelData.x = final_X;
        thisLabelData.y = final_Y;
        thisLabelData.fontsize = final_FontSize;
        thisLabelData.width = thisLabelWidth_Graph;
        thisLabelData.height = thisLabelHeight_Graph;

        var color = layers[i].fillcolor;
        var values = color.substring(4, color.length - 1).split(",");
        var red = parseInt(values[0]) / 255,
            green = parseInt(values[1]) / 255,
            blue = parseInt(values[2]) / 255,
            gamma = 2.2;
        //灰度
        var intensity =
            .2126 * Math.pow(red, gamma) +
            .7152 * Math.pow(green, gamma) +
            .0722 * Math.pow(blue, gamma);
        thisLabelData.lableColor = (intensity > 0.3 ? "black" : "white");
        // thisLabelData.opacity = (intensity > 0.3 ? 0.5 : 0.7);
        thisLabelData.opacity = 1;

        LabelData.push(thisLabelData);

        label_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + layerID).remove()
    }


    label_g.remove()
    return LabelData;

    /**
     * 得到：某一个layer，在放置某个字号的label的时候，使用滑动窗口方法，在每一个可能的timepoint位置(label的中心就在这个timepoint上)可以放置的最大高度
     * @param {这个label在这个字号下在图上宽度} width_graph
     * @param {这个layer的top-border数组} yT
     * @param {这个layer的bottom-border数组} yB
     */
    function getSildeWindow(thisLayer, width_graph) {

        // let yT = thisLayer.yTop_Graph_Curve
        // let yB = thisLayer.yBottom_Graph_Curve

        let layer_length = thisLayer.size.length;

        let start_Window_Index = Math.ceil(linearX.invert(width_graph / 2)),
            end_Window_Index = Math.floor(linearX.invert(linearX(layer_length - 1) - width_graph / 2));
        let res = [] //存储这个window的最大空间、天花板、地板、当前时间

        //如果这个layer的全部长度都放不下这个label，返回
        if (start_Window_Index > end_Window_Index) {
            return res;
        }


        //这里的0.5是最核心的参数
        for (let i = start_Window_Index; i <= end_Window_Index; i += linearX.invert(width / 100)) {

            //如果这个layer在当前时间点厚度为0的话，就跳过
            if (thisLayer.interpolateBasis_Top(i / layer_length) === thisLayer.interpolateBasis_Bottom(i / layer_length)) {
                continue
            }

            let start = linearX.invert(linearX(i) - width_graph / 2)
            let end = linearX.invert(linearX(i) + width_graph / 2)

            let curT;
            let curB;

            // if (layer_length < 50) {
            //     curT = thisLayer.yTop_Graph_Curve_All.slice(Math.ceil(start) * 2, (Math.floor(end) + 1) * 2 - 1)
            //     curB = thisLayer.yBottom_Graph_Curve_All.slice(Math.ceil(start) * 2, (Math.floor(end) + 1) * 2 - 1)
            // } else {
            //     curT = yT.slice(Math.ceil(start), Math.floor(end) + 1)
            //     curB = yB.slice(Math.ceil(start), Math.floor(end) + 1)
            // }

            curT = thisLayer.yTop_Graph_Curve_All.slice(Math.ceil(start) * 2, (Math.floor(end) + 1) * 2 - 1)
            curB = thisLayer.yBottom_Graph_Curve_All.slice(Math.ceil(start) * 2, (Math.floor(end) + 1) * 2 - 1)


            if (isFloat(start)) {
                curT.unshift(thisLayer.interpolateBasis_Top(start / (layer_length - 1)))
                curB.unshift(thisLayer.interpolateBasis_Bottom(start / (layer_length - 1)))
            }
            if (isFloat(end)) {
                curT.push(thisLayer.interpolateBasis_Top(end / (layer_length - 1)))
                curB.push(thisLayer.interpolateBasis_Bottom(end / (layer_length - 1)))
            }

            //实际上，curT是在下面，curB是在上面的
            let ceiling = curT.reduce((a, b) => (Math.max(a, b)))
            let floor = curB.reduce((a, b) => (Math.min(a, b)))

            //  // let cur_g = d3.select("#" + "myGraph_svg_" + graphIndex)
            //     .append("g")
            // let cur_g = label_g.append("g")
            //     .attr("id", "cur_g")
            //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            //     .attr("width", width + margin.left + margin.right)
            //     .attr("height", height + margin.top + margin.bottom)

            //     let pointsT = curT.map((d,i)=>[start+i,d])
            //     let pointsB = curB.map((d,i)=>[start+i,d])

            // cur_g.selectAll("circle")
            //     .data(pointsT.concat(pointsB))
            //     .append("circle")
            //     .attr("cx", d=>linearX(d[0]))
            //     .attr("cy", d=>d[1])
            //     .attr("r", 1)
            //     .style("fill", "black")
            //     .style("stroke", "red")
            //     .style("stroke-width", 1)


            // //画出这个点
            // cur_g.append("circle")
            //     .attr("cx", linearX(start))
            //     .attr("cy", (ceiling))
            //     .attr("r", 1)
            //     .style("fill", "black")
            //     .style("stroke", "red")
            //     .style("stroke-width", 1)
            // cur_g.append("circle")
            //     .attr("cx", linearX(start))
            //     .attr("cy", (floor))
            //     .attr("r", 1)
            //     .style("fill", "black")
            //     .style("stroke", "red")
            //     .style("stroke-width", 1)
            // cur_g.append("circle")
            //     .attr("cx", linearX(end))
            //     .attr("cy", (ceiling))
            //     .attr("r", 1)
            //     .style("fill", "black")
            //     .style("stroke", "red")
            //     .style("stroke-width", 1)
            // cur_g.append("circle")
            //     .attr("cx", linearX(end))
            //     .attr("cy", (floor))
            //     .attr("r", 1)
            //     .style("fill", "black")
            //     .style("stroke", "green")
            //     .style("stroke-width", 1)

            // cur_g.append("rect")
            //     .attr("x", linearX(start))
            //     .attr("y", (ceiling))
            //     .attr("width", width_graph)
            //     .attr("height", (floor - ceiling) > 0 ? (floor - ceiling) : 1)
            //     .style("fill", "black")
            //     .style("stroke", "red")
            //     .style("stroke-width", 1)
            // cur_g.remove()

            let space = floor - ceiling;
            if (space > 0) {
                let curResult = {
                    maxSpace: space,
                    ceiling: ceiling,
                    floor: floor,
                    index: i
                }
                // res.push([maxSpace, ceiling, floor, i]);
                res.push(curResult);
            }
        }
        return res;
    }
}

/**
 * judge a value is a float value or not
 * @param n
 * @returns {boolean}
 */
function isFloat(n) {
    return n + ".0" != n;
}

/**
 * decrease the font size
 * @param pre
 * @returns {number}
 */
function downFont_Size(pre) {
    // return Math.min(pre*0.9,pre-1)
    return Math.min(pre * 0.9, pre - 1)
    // return pre-1
}