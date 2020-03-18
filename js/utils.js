function getCountyCentroids(){
    let centroids = {}
    for(let feat of countyCentroids["features"]){
        centroids[feat["properties"]["GEO_ID"]] = feat["geometry"]["coordinates"]
    }
    return centroids
}

function getColor(risk_total){
    risk_total *= 100000
    let color =  risk_total > 10 ? '#a50f15':
           risk_total > 3  ? '#de2d26':
           risk_total > 1   ? '#fb6a4a':
           risk_total > 0.3    ? '#fc9272':
           risk_total > 0.1    ? '#fcbba1':
           isNaN(risk_total)    ? '#ffffff':
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