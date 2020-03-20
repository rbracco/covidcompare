function getCountyCentroids(){
    let centroids = {}
    for(let feat of countyCentroids["features"]){
        centroids[feat["properties"]["GEO_ID"]] = feat["geometry"]["coordinates"]
    }
    return centroids
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getSelectedMetric(){
    let base = {value:"cases", text:"Total Cases"};
    let e = document.querySelector('#metricSelect')
    if(!e){
        return base
    }
    if(e.selectedIndex === -1){
        e.selectedIndex = 1
        return base
    }
    return {
        value:e.options[e.selectedIndex].value,
        text:e.options[e.selectedIndex].text
    }
}

function getColor(props){
    let {value:metricValue, text:metricText} = getSelectedMetric()
    let val = props[metricValue]
    let color =  val > 10 ? '#a50f15':
           val > 3  ? '#de2d26':
           val > 1   ? '#fb6a4a':
           val > 0.3    ? '#fc9272':
           val > 0.1    ? '#fcbba1':
           isNaN(val)    ? '#ffffff':
                         '#bbbbbb';
    return color
}

//get the distance in kilometers between two centroids
function getDistance(c0, c1){
    let latDist = Math.abs(c0[0]-c1[0])
    let longDist = Math.abs(c0[1]-c1[1])
    return Math.sqrt(latDist*latDist + longDist*longDist) * 111
}

function zoomToFeature(e, padding) {
    map.fitBounds(e.target.getBounds(), {padding:padding});
}