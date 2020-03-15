function mergeCovidCountyData(){
    for (let geoID of Object.keys(dataCovidCounty)){
        let cases = dataCovidCounty[geoID] 
        let county = getCounty(geoID)
        county["properties"]["cases"] = cases
    }
}

function getCounty(countyID){
    return countyData["features"].find(element => element["properties"]["GEO_ID"] == countyID)
}



function getNeighboringCountyRisk(geoID){
    let neighborRisk = 0.0
    for (let feat of countyData["features"]){
        let geoID2 = feat["properties"]["GEO_ID"]
        if((geoID != geoID2) & (geoID2 in dataCovidCounty)){
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
    cases = dataCovidCounty[geoID]
    let countyRisk = cases/pop
    props["LOCALRISK"] = countyRisk
    let neighborRisk = 0
    if(originalCall){
        neighborRisk = getNeighboringCountyRisk(geoID)
        props["NEIGHBORRISK"] = neighborRisk
    }
    props["TOTALRISK"] = countyRisk + props["NEIGHBORRISK"]
    return props["TOTALRISK"]
}

function calcRiskAllCounties(){
    for(let county of countyData["features"]){
        calcStateRisk(county["geoID"])
    }
}


function getCountyColor(props){
    let risk = getCountyRisk(props)
    return risk > 0.0001 ? '#a50f15':
           risk > 0.00003  ? '#de2d26':
           risk > 0.00001   ? '#fb6a4a':
           risk > 0.000003    ? '#fc9272':
           risk > 0.000001    ? '#fcbba1':
           isNaN(risk)    ? '#ffffff':
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
    var layer = e.target;
    layer.setStyle({
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    });
}

