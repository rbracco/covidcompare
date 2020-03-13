function getCountyCentroids(){
    let centroids = {}
    for(let feat of countyCentroids["features"]){
        centroids[feat["properties"]["GEO_ID"]] = feat["geometry"]["coordinates"]
    }
    return centroids
}

//get the distance in kilometers between two centroids
function getDistance(c0, c1){
    let latDist = Math.abs(c0[0]-c1[0])
    let longDist = Math.abs(c0[1]-c1[1])
    return Math.sqrt(latDist*latDist + longDist*longDist) * 111
}