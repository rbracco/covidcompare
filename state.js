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

function getNeighboringStateRisk(stateID){
    let neighborRisk = 0.0
        let state = getState(stateID)
    let centroidState = [state["properties"]["LAT"], state["properties"]["LONG"]]

    for(let state of statesData["features"]){
        let centroidNeighbor
        let neighborID = state["id"]
        if(neighborID != stateID){
            let neighborProps = state["properties"]
            centroidNeighbor = [neighborProps["LAT"], neighborProps["LONG"]]
            let distance = getDistance(centroidState,centroidNeighbor)
            let curNeighborRisk = calcStateRisk(neighborID, originalCall=false)
            if(! isNaN(curNeighborRisk)){
                neighborRisk += curNeighborRisk/(distance/50)
            }
        }
    }
    return neighborRisk
}

function calcStateRisk(stateID, originalCall=true){
    let neighborRisk = 0
    let stateRisk = 0
    let state = getState(stateID)
    let props = state["properties"]
    if(originalCall){
        neighborRisk = getNeighboringStateRisk(stateID)
        props["NEIGHBORRISK"] = neighborRisk
    }
    let {population, CASES} = props
    stateRisk = CASES/population
    props["LOCALRISK"] = stateRisk
    props["TOTALRISK"] = stateRisk + props["NEIGHBORRISK"]
    return props["TOTALRISK"]
}

function calcRiskAllStates(){
    for(let state of statesData["features"]){
        calcStateRisk(state["id"])
    }
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