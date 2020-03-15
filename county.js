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

function calcRiskAllCounties(){
    for(let county of countyData["features"]){
        calcLocalCountyRisk(county["properties"])
    }
    for(let county of countyData["features"]){
        calcAllNeighborCountyRisk(county["properties"])
    }
}

function calcLocalCountyRisk(props){
    let pop = props.POP
    let geoID = props.GEO_ID
    cases = dataCovidCounty[geoID] 
    let countyRisk = cases/pop
    props["LOCALRISK"] = countyRisk
    return countyRisk
}

function calcAllNeighborCountyRisk(props){
    props["SPECIFICRISK"] = {}
    for (let neighbor of countyData["features"]){
        calcNeighborCountyRisk(props, neighbor["properties"])
    }
    props["NEIGHBORRISK"] = averageNeighborRisk(props)
    props["TOTALRISK"] = props["LOCALRISK"] + props["NEIGHBORRISK"]
    //do something to store/return
}

function calcNeighborCountyRisk(props, neighborProps){
    let geoID = props["GEO_ID"]
    let geoID2 = neighborProps["GEO_ID"]
    let distance = getDistance(centroids[geoID], centroids[geoID2])
    let neighborLocalRisk = neighborProps["LOCALRISK"] || 0
    if (geoID === geoID2 || distance > 500 || neighborLocalRisk === 0){
        return
    }
    props["SPECIFICRISK"][geoID2] = {
        "distance":distance,
        "neighborRisk":neighborLocalRisk,
    }
}

function averageNeighborRisk(props){
    let risks = Object.values(props["SPECIFICRISK"])
    let numRisks = risks.length
    let avg = 0
    for (let risk of risks){
        let {distance, neighborRisk} = risk
        avg += (neighborRisk/numRisks)*(1/Math.log2(distance))
    }
    return avg
}

function getCountyColor(props){
    let risk = props["TOTALRISK"]
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

