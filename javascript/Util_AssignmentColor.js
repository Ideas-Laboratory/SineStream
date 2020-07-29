//color from colorBrewer
let Palettes = [
    'rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)',
    'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)',
    'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)',
    'rgb(106,61,154)', 'rgb(255,255,153)', 'rgb(177,89,40)']

/**
 * assign random color to layers
 * @param layers
 * @param options
 */
function assign_Random_Color(layers) {
    let res = Palettes.slice(0)
    if (layers.length < res.length) {
        res = d3.shuffle(res).slice(0, layers.length)
    } else {
        while (res.length < layers.length) {
            res = res.concat(d3.shuffle(Palettes))
        }
        res = d3.shuffle(res.slice(0, layers.length))
    }
    layers = layers.map((d, i) => {
        d.fillcolor = res[i]
        return d
    })
    return layers
}