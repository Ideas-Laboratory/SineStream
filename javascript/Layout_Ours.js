/*
the functions of sinestream layout
 */

/**
 * function of baseline optimization
 * @param layers
 * @param cType : the ctype
 * @param options : some extra options for future interaction
 * @returns {*}
 * @constructor
 */
function StreamLayout_2norm_Gauss(layers, cType = "median", options = {doFlat: false}) {
    var baseline = getArray(layers[0].size.length, 0);

    for (let i = 0; i < layers[0].size.length; i++) {
        let totalSize = 0;
        for (let j = 0; j < layers.length; j++) {
            totalSize += layers[j].size[i];
        }
        if (i == 0) {
            baseline[i] = (0 - totalSize * 0.5);
            // baseline[i] =0;
            continue;

        }
        let C = getC_2norm_Gauss(layers, i, cType);
        let deltaG = getDeltaG_2norm_Gauss(layers, C, i)

        baseline[i] = baseline[i - 1] + deltaG;
    }
    // console.log("baseline");
    // console.log(baseline);

    if (options.doFlat) {
        baseline = baseline.map(d => 0)
    }

    layers = stackOnBaseline(layers, baseline);

    return layers;
}

/**
 * get C based on the ctype
 * @param curLayers
 * @param timePoint
 * @param cType
 * @returns {number}
 */
function getC_2norm_Gauss(curLayers, timePoint, cType = "median") {
    let totalDFi = []; //这里是fi'
    let curC = 1;
    //计算dFi[],得到所有layer在这个时间点的dF
    for (let j = 0; j < curLayers.length; j++) {
        let cur1 = getSize(curLayers, j, timePoint);
        let cur2 = getSize(curLayers, j, timePoint - 1);
        totalDFi.push(Math.abs(cur1 - cur2));
    }

    let curCount = 0;
    switch (cType) {
        case "median":
            // 中值
            totalDFi.sort(function (a, b) {
                return a - b
            });
            if (totalDFi.length % 2 !== 0) {
                curC = totalDFi[(totalDFi.length - 1) / 2];
            } else {
                curC = (totalDFi[totalDFi.length / 2] + totalDFi[totalDFi.length / 2 - 1]) / 2;
            }
            break;
        case "geometric":
            //totalDFi的几何平均
            for (let i = 0; i < totalDFi.length; i++) {
                if (totalDFi[i] !== 0) {
                    curCount++;
                }
            }
            for (let i = 0; i < totalDFi.length; i++) {
                if (totalDFi[i] !== 0) {
                    curC *= Math.pow(totalDFi[i], 1 / curCount)
                }
            }
            break;
        case "harmonic":
            curCount = 0
            curC = 0
            //totalDFi的调和平均
            for (let i = 0; i < totalDFi.length; i++) {
                if (totalDFi[i] !== 0) {
                    curC += 1 / totalDFi[i];
                    curCount++;
                }
            }
            curC = curCount / curC;
            break;
        case "mean":
            //totalDFi的调和平均
            for (let i = 0; i < totalDFi.length; i++) {
                if (totalDFi[i] !== 0) {
                    curC += totalDFi[i];
                }
            }
            curC = curC / totalDFi.length;
            break;
        default:
            break;
    }
    return curC;
}

/**
 * calculate the g'_0
 * @param layers
 * @param c
 * @param i
 * @returns {number}
 */
function getDeltaG_2norm_Gauss(layers, c, i) {
    let deltaG = 0;
    // console.log(layers);
    let dFi = []; //这里是fi'
    let Fi = [];
    let Qi = [];
    for (let j = 0; j < layers.length; j++) {
        let cur1 = getSize(layers, j, i);
        let cur2 = getSize(layers, j, i - 1);
        Fi.push(cur1);
        dFi.push(cur1 - cur2); //这里不用担心dFi会添加进错误的值，因为传入的i最小为1，cur1和cur2都是有效的值
    }
    for (let j = 0; j < layers.length; j++) {
        let p = 0;
        for (let k = 0; k <= j; k++) {
            p += 2 * dFi[k];
        }
        Qi.push((p - dFi[j]) / 2);
    }
    let numerator = 0;
    let denominator = 0;

    for (let j = 0; j < layers.length; j++) {
        let gaussParameter = 1;
        if (c !== 0) {
            gaussParameter = Math.pow(Math.E, (0 - (dFi[j] * dFi[j]) / (2 * c * c)));
            // gaussParameter = 1;
        }
        let cur = gaussParameter * Fi[j];
        denominator += cur; //分母
        numerator += cur * Qi[j]; //分子
    }
    if (denominator === 0) {
        let totalSize = 0;
        for (let j = 0; j < layers.length; j++) {
            totalSize += layers[j].size[i - 1];
        }
        return totalSize / 2;
        // return 0;
    }
    deltaG = -(numerator / denominator);
    return deltaG;
}

/**
 * Hierarchical Clustering Ordering
 * @param layers
 * @param weightType : the thickness weight type
 * @returns {any}
 * @constructor
 */
function HierarchicalClusteringOrder(layers, weightType = "max") {

    let layerNodes = [];
    layers = JSON.parse(JSON.stringify(layers));
    layers = shuffle(layers)
    let curIndex = 0;
    for (let i = 0; i < layers.length; i++) {
        //这个地方index的作用就是直接找到这个layerNode在distanceMatrix中的索引，没有其他的含义。
        layerNodes.push(new LayerNode(curIndex, layers[i]));
        layers[i].index = curIndex;
        curIndex++;
    }
    let finalLayersOrder = []
    // run the hierarchical clustering
    if (layers.length > 1) {
        let distanceMatrix = getArray2D(layerNodes.length * 2 - 1, layerNodes.length * 2 - 1, -1); //有2n-1*2n-1的矩阵，存储所有叶节点和内部节点
        for (let i = 0; i < layers.length * 2 - 1; i++) {
            distanceMatrix[i][i] = 0;
        }
        while (layerNodes.length > 1) {
            let layerToPick_A, layerToPick_B;
            let minLayerDistance = Infinity;
            let minSum = Infinity;
            for (let j = 0; j < layerNodes.length - 1; j++) {
                for (let k = j + 1; k < layerNodes.length; k++) {
                    let cur = 0;
                    if (distanceMatrix[layerNodes[j].index][layerNodes[k].index] === -1) {
                        cur = getDistance_LayerNode(layerNodes[j], layerNodes[k], weightType)
                        distanceMatrix[layerNodes[j].index][layerNodes[k].index] = cur;
                        distanceMatrix[layerNodes[k].index][layerNodes[j].index] = cur;
                    } else {
                        cur = distanceMatrix[layerNodes[j].index][layerNodes[k].index]
                    }
                    if (cur < minLayerDistance) {
                        minLayerDistance = cur;
                        minSum = layerNodes[j].arithmeticSum + layerNodes[k].arithmeticSum;
                        layerToPick_A = j;
                        layerToPick_B = k;
                    }
                }
            }

            layerNodes.push(new LayerNode(curIndex, layerNodes[layerToPick_A], layerNodes[layerToPick_B]))
            curIndex++;

            layerNodes.splice(layerToPick_B, 1)
            layerNodes.splice(layerToPick_A, 1)

        }
        // run the leaf nodes ordering
        /*
        a rought example of mMatrix
        mMatrix[
            Map[
                {key:value}:["1_2",[value,order]],
                {key:value}:["1_3",[value,order]],
            ],
            Map[
                {key:value}:["4_5",[value,order]],
                {key:value}:["4_5",[value,order]],
            ],
        ]
        */
        let mMatrix = []; // length: 2n-1。
        for (let i = 0; i < layers.length * 2 - 1; i++) {
            mMatrix.push(new Map());
        }
        mMatrix = getOrder_HierarchicalClustering(layerNodes[0], distanceMatrix, mMatrix);

        finalLayersOrder = []
        let curValue = Infinity;

        for (var [key, value] of mMatrix[layers.length * 2 - 1 - 1]) {
            if (value[0] < curValue) {
                curValue = value[0];
                finalLayersOrder = value[1];
            }
        }

    } else if (layers.length === 1) {
        finalLayersOrder = [0]
    }

    layers.sort(function (a, b) {
        return finalLayersOrder.indexOf(a.index) - finalLayersOrder.indexOf(b.index)
    })

    let HClusterTree = sortHierarchicalClusteringTree(layerNodes[0], finalLayersOrder)

    // console.log("final order");
    // console.log(finalLayersOrder);


    function delAttrs(curNode) {
        delete curNode.dFi
        delete curNode.deviation
        delete curNode.maxSize
        delete curNode.leftChild
        delete curNode.rightChild
        delete curNode.size
        // delete curNode.name
        if (curNode.leave === undefined) {
            delAttrs(curNode.children[0])
            delAttrs(curNode.children[1])
        }
        delete curNode.leave
    }

    console.log("聚类以及排序后结果");
    console.log(HClusterTree);

    // the HCtree can be used to draw the hierarchical clustering tree, but not in used now
    layers.HCtree = HClusterTree;

    return layers;
}

function getDistance_LayerNode(layerA, layerB, weightType = "max") {
    let timePoint_start = 0, timePoint_end = layerA.size.length - 1;// spare for future interaction
    let countD = timePoint_end - timePoint_start;
    //计算distance
    let distance = 0
    for (let i = timePoint_start; i < timePoint_end; i++) {
        //如果那种[0-0,0-0]得到的dFi对，要删除
        if (Math.abs(layerA.dFi[i]) + Math.abs(layerB.dFi[i]) === 0 &&
            (layerA.size[i + 1] + layerB.size[i + 1] === 0) &&
            (layerA.size[i] + layerB.size[i] === 0)) {
            countD--;
            continue;
        } else if (Math.abs(layerA.dFi[i]) + Math.abs(layerB.dFi[i]) === 0) {
            distance += 0;
        } else {
            distance += Math.abs(layerA.dFi[i] + layerB.dFi[i]) / (Math.abs(layerA.dFi[i]) + Math.abs(layerB.dFi[i]))
        }
    }

    let sizeWeight = 0;
    if (countD !== 0) {
        distance /= countD;
        let countW = 0
        // let curMaxSize = -Infinity;
        switch (weightType.toLowerCase()) {
            case "arithmetic":
                sizeWeight = 0;
                countW = 0
                let arithmeticSum = 0;
                for (let i = timePoint_start; i <= timePoint_end; i++) {
                    if (layerA.size[i] + layerB.size[i] !== 0) {
                        arithmeticSum += (layerA.size[i] + layerB.size[i])
                        countW++;
                    }
                }
                if (countW !== 0) {
                    sizeWeight = arithmeticSum / countW;
                } else {
                    sizeWeight = 0;
                }
                break;
            case "geometric":
                sizeWeight = 1;
                countW = 0
                for (let i = timePoint_start; i <= timePoint_end; i++) {
                    if (layerA.size[i] + layerB.size[i] !== 0) {
                        countW++;
                    }
                }
                if (countW !== 0) {
                    for (let i = timePoint_start; i <= timePoint_end; i++) {
                        if (layerA.size[i] + layerB.size[i] !== 0) {
                            sizeWeight *= Math.pow(layerA.size[i] + layerB.size[i], 1 / countW);
                        }
                    }
                } else {
                    sizeWeight = 0;
                }
                break;
            case "harmonic":
                sizeWeight = 0;
                countW = 0;
                let harmonicSum = 0;
                for (let i = timePoint_start; i <= timePoint_end; i++) {
                    if (layerA.size[i] + layerB.size[i] !== 0) {
                        countW++;
                        harmonicSum += 1 / (layerA.size[i] + layerB.size[i])
                    }
                }
                if (harmonicSum !== 0) {
                    sizeWeight = (countW / harmonicSum);
                } else {
                    sizeWeight = 0;
                }
                break;
            case "max":
                let curMaxSize = -Infinity;
                for (let i = timePoint_start; i <= timePoint_end; i++) {
                    curMaxSize = Math.max(curMaxSize, layerA.size[i] + layerB.size[i]);
                }
                // sizeWeight = (layerA.maxSize * layerB.maxSize);
                sizeWeight = curMaxSize;
                break;
            case "median":
                let newSize = []
                for (let i = timePoint_start; i <= timePoint_end; i++) {
                    newSize.push(layerA.size[i] + layerB.size[i])
                }
                sizeWeight = getMedian(newSize)
                break;
            default:
                // let curMaxSize = -Infinity;
                // for (let i = timePoint_start; i <= timePoint_end; i++) {
                //     curMaxSize = Math.max(curMaxSize, layerA.size[i] + layerB.size[i]);
                // }
                // // sizeWeight = (layerA.maxSize * layerB.maxSize);
                // sizeWeight = curMaxSize;
                break;
        }

        // 这里做的工作是要对比较短的layer进行惩罚
        let lengthWeight = 0;
        let length_ASize = 0,
            length_BSize = 0;

        // 这里做的工作是要对1,1,20,20,11这样的layer进行惩罚
        length_ASize = 0;
        length_BSize = 0;
        let maxSizeA = layerA.size.reduce((a, b) => Math.max(a, b));
        let maxSizeB = layerB.size.reduce((a, b) => Math.max(a, b));

        let minTimes = lengthWeightThresholdValue

        for (let i = timePoint_start; i <= timePoint_end; i++) {
            if (layerA.size[i] > maxSizeA / minTimes) {
                length_ASize++;
            }
            if (layerB.size[i] > maxSizeB / minTimes) {
                length_BSize++;
            }
        }
        if (length_ASize === 0 || length_BSize === 0) {
            lengthWeight = 1
        } else {
            lengthWeight = Math.max((layerA.size.length / length_ASize), (layerA.size.length / length_BSize));
        }
        distance *= whetherUseThicknessWeight ? sizeWeight : 1;
        distance *= whetherUseLengthWeight ? lengthWeight : 1;
        return distance;
    } else {
        return 0;
    }
}


/**
 * the function of Hierarchical Clustering Tree Leaf Nodes Ordering
 * @param thisNode: the root node of input tree
 * @param distanceMatrix: the matrix which stores the distance between layer nodes
 * @param mMatrix: the matrix which stores the leaf node ordering (contains the order and corresonding sum value)
 * @returns
 */
function getOrder_HierarchicalClustering(thisNode, distanceMatrix, mMatrix) {
    if (thisNode.leave !== undefined) {
        // mMatrix(v, u, u) = 0;
        mMatrix[thisNode.index].set(thisNode.index + "_" + thisNode.index, [0, [thisNode.index]]); //丑陋的数据结构
        return mMatrix;
    } else {
        //recursive
        mMatrix = getOrder_HierarchicalClustering(thisNode.leftChild, distanceMatrix, mMatrix);
        mMatrix = getOrder_HierarchicalClustering(thisNode.rightChild, distanceMatrix, mMatrix);
        let nodesLeftLeft = [], // the left ChildNodes of leftChild
            nodesLeftRight = [],// the left ChildNodes of rightChild
            nodesRightLeft = [],// the right ChildNodes of leftChild
            nodesRightRight = [];// the right ChildNodes of rightChild
        if (thisNode.leftChild.leave !== undefined) { //if the leftChild Node is a leaf node
            nodesLeftLeft.push(thisNode.leftChild.index);
            nodesLeftRight.push(thisNode.leftChild.index);
        } else {
            nodesLeftLeft = getAllLeaves_InternalNode(thisNode.leftChild.leftChild);
            nodesLeftRight = getAllLeaves_InternalNode(thisNode.leftChild.rightChild);
        }
        if (thisNode.rightChild.leave !== undefined) { //if the rightChild Node is a leaf node
            nodesRightLeft.push(thisNode.rightChild.index);
            nodesRightRight.push(thisNode.rightChild.index);
        } else {
            nodesRightLeft = getAllLeaves_InternalNode(thisNode.rightChild.leftChild);
            nodesRightRight = getAllLeaves_InternalNode(thisNode.rightChild.rightChild);
        }

        let nodesLeft = [nodesLeftLeft, nodesLeftRight];
        let nodesRight = [nodesRightLeft, nodesRightRight];
        // enum all combination of the childNode of leftChild and rightChild
        let enumNodes = [
            [0, 0, 1, 1],
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 0, 0]
        ];
        // refer to the paper 'fast optimal ordering algorithm of hierarchical clustering'
        for (let e = 0; e < enumNodes.length; e++) {
            let nodesLL = nodesLeft[enumNodes[e][0]];
            let nodesRR = nodesRight[enumNodes[e][1]];
            let nodesLR = nodesLeft[enumNodes[e][2]];
            let nodesRL = nodesRight[enumNodes[e][3]];
            for (let u = 0; u < nodesLL.length; u++) {
                for (let w = 0; w < nodesRR.length; w++) {
                    // mMatrix(v, u, w) = Infinity
                    let curMin = Infinity
                    for (let m = 0; m < nodesLR.length; m++) {
                        for (let k = 0; k < nodesRL.length; k++) {
                            // mMatrix(v, u, w) = Math.max(mMatrix(v, u, w), mMatrix(v.leftChild, u, m) + mMatrix(v.rightChild, k, w) + S(m, k));
                            let cur = mMatrix[thisNode.leftChild.index].get(nodesLL[u] + "_" + nodesLR[m])[0] +
                                mMatrix[thisNode.rightChild.index].get(nodesRL[k] + "_" + nodesRR[w])[0] +
                                distanceMatrix[nodesLR[m]][nodesRL[k]];
                            if (cur < curMin) {
                                curMin = cur;
                                let curOrder = mMatrix[thisNode.leftChild.index].get(nodesLL[u] + "_" + nodesLR[m])[1]
                                    .concat(mMatrix[thisNode.rightChild.index].get(nodesRL[k] + "_" + nodesRR[w])[1]);
                                mMatrix[thisNode.index].set(nodesLL[u] + "_" + nodesRR[w], [cur, curOrder]);
                                mMatrix[thisNode.index].set(nodesRR[w] + "_" + nodesLL[u], [cur, curOrder.slice().reverse()]);
                            }
                        }
                    }
                }
            }
        }
    }
    return mMatrix; //在得到这个之后，还需要进行回溯得到最优的排序。
}

/**
 * get allChinlNodes of a node
 * @param thisNode
 * @returns {*[]|(number|((name: string) => IDBIndex)|(function(*=): number))[]}
 */
function getAllLeaves_InternalNode(thisNode) {
    if (thisNode.leave !== undefined) {
        return [thisNode.index];
    } else {
        return getAllLeaves_InternalNode(thisNode.leftChild).concat(getAllLeaves_InternalNode(thisNode.rightChild));
    }
}

/*
函数:按照得到的最终排序，将聚类得到的二叉树进行排序
参数:
备注:默认node.children[0]为左字数，children[1]为右子树
*/
function sortHierarchicalClusteringTree(curNode, finalLayersOrder) {
    if (curNode.leave !== undefined) {
        return;
    } else {
        sortHierarchicalClusteringTree(curNode.children[0], finalLayersOrder)
        sortHierarchicalClusteringTree(curNode.children[1], finalLayersOrder)
        let leftMostLeaveIndex_LeftChild = getLeftMostLeave_InternalNode(curNode.children[0]);
        let leftMostLeaveIndex_RightChild = getLeftMostLeave_InternalNode(curNode.children[1]);
        if (finalLayersOrder.indexOf(leftMostLeaveIndex_LeftChild) > finalLayersOrder.indexOf(leftMostLeaveIndex_RightChild)) {
            [curNode.children[0], curNode.children[1]] = [curNode.children[1], curNode.children[0]]
        }
    }
    return curNode;
}

/*
函数:得到一个节点的最左侧的叶节点（就是顺着children数组一路0-0-...-0走下去最终得到的叶节点）
参数:
备注:
*/
/**
 * get the most left and most deep childnode of a node
 * @param thisNode
 * @returns {number|((name: string) => IDBIndex)|(function(*=): number)|*}
 */
function getLeftMostLeave_InternalNode(thisNode) {
    if (thisNode.leave !== undefined) {
        return thisNode.index;
    } else {
        return getLeftMostLeave_InternalNode(thisNode.children[0])
    }
}


/**
 * the class used in hierarchical clustering
 */
class LayerNode {
    constructor(index, nodeA, nodeB = undefined) {
        this.index = index;
        this.id = ''
        this.name = ""
        this.size = [];
        this.leave = undefined;
        this.fillcolor = "balck"
        this.leftChild = undefined;
        this.rightChild = undefined;

        this.size = [];

        //这里是这个layer的各种统计参数
        // this.countW = 0;
        this.dFi = [];
        this.maxSize = -Infinity;


        // the leaf node
        if (nodeB === undefined) {
            // this.name = nodeA.name.replace(/[ .()#&]/g, "_")
            this.name = nodeA.name
            this.size = nodeA.size.slice();
            this.leave = nodeA;
            this.fillcolor = nodeA.fillcolor
            this.id = nodeA.id;
        }
        //the internall node
        else {
            this.id = index;
            this.name += index;
            this.size = nodeA.size.slice().map(function (d, i) {
                return d + nodeB.size[i]
            });
            this.children = [nodeA, nodeB];
            this.leftChild = nodeA;
            this.rightChild = nodeB;
        }

        for (let i = 0; i < this.size.length; i++) {
            if (this.size[i] !== 0) {
                this.maxSize = Math.max(this.maxSize, this.size[i]);
            }
            if (i >= 1) {
                this.dFi.push(this.size[i] - this.size[i - 1]);
            }
        }
    }
}