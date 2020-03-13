function getNeighboringCountyRisk(geoID){
    let neighborRisk = 0.0
    for (let feat of countyData["features"]){
        let geoID2 = feat["properties"]["GEO_ID"]
        if((geoID != geoID2) & (geoID2 in dataCovid)){
            let distance = getDistance(centroids[geoID], centroids[geoID2])
            let curNeighborRisk = getCountyRisk(feat["properties"], originalCall=false)
            if(! isNaN(curNeighborRisk)){
                neighborRisk += curNeighborRisk/distance
            }
        }
    }
    return neighborRisk
}

function getCountyRisk(props, originalCall=true){
    let pop = props.POP
    let geoID = props.GEO_ID
    pop = parseInt(pop)
    cases = dataCovid[geoID] || 0
    let risk = cases/pop
    
    let neighborRisk = 0
    if(originalCall){
        neighborRisk = getNeighboringCountyRisk(geoID)
    }
    return risk + neighborRisk
}

function getCountyColor(props){
    let risk = getCountyRisk(props)
    return risk > 0.0001 ? '#a50f15':
           risk > 0.00003  ? '#de2d26':
           risk > 0.00001   ? '#fb6a4a':
           risk > 0.000003    ? '#fc9272':
           risk > 0.000001    ? '#fcbba1':
           isNaN(risk)    ? '#000000':
                         '#bbbbbb';
}

function onEachCounty(feature, layer){
    layer.on({
        mouseover: highlightCounty,
        mouseout: resetHighlightCounty,
        click: zoomToFeature
    });
}

function resetHighlightCounty(e) {
    countyLayer.resetStyle(e.target);
}

