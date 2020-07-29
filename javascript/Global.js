let DATA_PATH = []

//the data will be processed
DATA_PATH = [
    './data/demo.json', // the teaser (default paremater)
    // './data/demo2.json', // the order compare (cType=mean; thickness = max; length threhold value is 1/12 or smaller;)
    // './data/demo3.json', // the process of hc ordering (default paremater)
    // './data/demo4.json', // the baseline compare (default paremater)
    // './data/case_1.json', // the case 1 (cType=median; thickness = mean; length threhold value is 1/5;)
    // './data/case_2.json', // the case 2 (default paremater)
    // './data/case_3.json', // the case 3 (default paremater)
]

let initialLayers = [], //存储所有的数据
    currentLayers = []; //存储当前的数据

let whetherUseThicknessWeight = true;
let whetherUseLengthWeight = true;

let allCtype = ['mean','median','geometric','harmonic']
let useAllCtype = [false,true,false,false]

let allThicknessType = ['max','arithmetic','geometric','harmonic']
let useAllThicknessType = [true,false,false,false]

let lengthWeightThresholdValue = 9

let maxTotalSize;

let YTop = Infinity,
    YBottom = -Infinity;

// the pixels width of streamgraph
let div_width

let margin_k = 0.95
//the radion of streamgraph
let radio = 0.5

var margin = {
        top: 30,
        bottom: 60,
        left: 60,
        right: 40
    },
    width = 320,
    height = 160;

let linearX, linearY;

//画label会用到的参数
let max_Label_FontSize = 100
let min_Label_FontSize = 2

// the layer drawer
let LayersArea = d3.area()
    .curve(d3.curveBasis)
    .x(function (d) {
        return linearX(d.time);
    })
    .y0(function (d) {
        return linearY(d[0]);
    })
    .y1(function (d) {
        return linearY(d[1]);
    });


let StreamGraphLength = -1;
let LayerID = 0;

//class of every layer
class Layer {
    constructor(name, size, fillcolor) {
        this.name = name
        this.id = LayerID++;
        this.fillcolor = fillcolor === undefined ? getRandomColorRGB() : fillcolor;
        size.forEach(function (d) {
            if (d < 0) {
                console.log(name);
                console.log(size);

            }
        })
        this.size = size.map(d => d);
        if (StreamGraphLength === -1) {
            StreamGraphLength = size.length;
        } else if (size.length !== StreamGraphLength) {
            throw "the length of layers is not the same"
        }
    }
}