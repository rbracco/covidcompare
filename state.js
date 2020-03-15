function mergeCovidStateData(){
    for (let stateID of Object.keys(dataCovidState)){
        let {CASES, DEATHS, ABBR, LAT, LONG} = dataCovidState[stateID]
        let state = getState(stateID)
        state["properties"]["CASES"] = CASES
        state["properties"]["DEATHS"] = DEATHS
        state["properties"]["ABBR"] = ABBR
        state["properties"]["LAT"] = LAT
        state["properties"]["LONG"] = LONG
    }
}

function getState(stateID){
    return statesData["features"].find(element => element["id"] == stateID)
}

function calcRiskAllStates(){
    for(let state of statesData["features"]){
        calcLocalStateRisk(state["id"])
    }
    for(let state of statesData["features"]){
        console.log("HERE2")
        calcAllNeighborStateRisk(state["id"])
    }
}

function calcLocalStateRisk(stateID){
    let stateRisk = 0
    let state = getState(stateID)
    let props = state["properties"]
    let {population, CASES} = props
    stateRisk = CASES/population
    props["LOCALRISK"] = stateRisk
    return props["LOCALRISK"]
}

function calcAllNeighborStateRisk(stateID){
    let neighborRisk = 0.0
    let stateOrig = getState(stateID)
    for(let stateNeighbor of statesData["features"]){
        neighborRisk += calcNeighborStateRisk(stateOrig, stateNeighbor)
        console.log("NR", neighborRisk)
    }
    stateOrig["properties"]["NEIGHBORRISK"] = neighborRisk
    stateOrig["properties"]["TOTALRISK"] = stateOrig["properties"]["LOCALRISK"] + neighborRisk
    return neighborRisk
}

function calcNeighborStateRisk(state1, state2){
    if(state1["id"] === state2["id"]){
        return 0
    }
    let {LAT, LONG, LOCALRISK} = state2["properties"]
    let centroidState = [state1["properties"]["LAT"], state1["properties"]["LONG"]]
    let centroidNeighbor = [LAT, LONG]
    let distance = getDistance(centroidState,centroidNeighbor)
    let curNeighborRisk = LOCALRISK
    return curNeighborRisk/(distance/50)
}


function getStateColor(stateID, props){
    let risk = props["TOTALRISK"]
    return risk > 0.0001 ? '#a50f15':
           risk > 0.00003  ? '#de2d26':
           risk > 0.00001   ? '#fb6a4a':
           risk > 0.000003    ? '#fc9272':
           risk > 0.000001    ? '#fcbba1':
           isNaN(risk)    ? '#000000':
                         '#bbbbbb';
}

function stateStyle(feature) {
    return {
        fillColor: getStateColor(feature.id, feature.properties),
        weight: 1,
        opacity: 1,
        color: 'black',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function onEachState(feature, layer) {
    layer.on({
        mouseover: highlightState,
        mouseout: resetHighlightState,
        click: zoomToFeature
    });
}
function highlightState(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.updateState(layer.feature.properties);
}

function resetHighlightState(e) {
    stateLayer.resetStyle(e.target);
    info.updateState();
}