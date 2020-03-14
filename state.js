function getNeighboringStateRisk(stateID){
    let neighborRisk = 0.0
    let centroidState
    for(let state of statesData["features"]){
        if(state["id"] == stateID){
            centroidState = [state["properties"]["LAT"], state["properties"]["LONG"]]
        }
    }
    for(let state of statesData["features"]){
        let neighborID = state["id"]
        let props = state["properties"]
        if(neighborID != stateID){
            //we need to find a way to remove this reference to dataCovidState
            centroidNeighbor = [props["LAT"], props["LONG"]]
            let distance = getDistance(centroidState,centroidNeighbor)
            let curNeighborRisk = getStateRisk(neighborID, originalCall=false)
            //console.log("D", distance, curNeighborRisk)
            if(! isNaN(curNeighborRisk)){
                neighborRisk += curNeighborRisk/(distance/50)
            }
        }
    }
    return neighborRisk
}

function getStateRisk(stateID, originalCall=true){
    let neighborRisk = 0
    let stateRisk = 0
    if(originalCall){
        neighborRisk = getNeighboringStateRisk(stateID)
    }
    let state = statesData["features"].find(element => element["id"] == stateID)
    let props = state["properties"]
    let {population, CASES} = props
    stateRisk = CASES/population
    let totalRisk = stateRisk + neighborRisk
    props["LOCALRISK"] = stateRisk
    props["NEIGHBORRISK"] = neighborRisk
    props["TOTALRISK"] = stateRisk + neighborRisk
    return totalRisk
}

function mergeCovidStateData(){
    for (let stateID of Object.keys(dataCovidState)){
        let {CASES, DEATHS, ABBR, LAT, LONG} = dataCovidState[stateID]
        for (let state of statesData["features"]){
            if(state.id == stateID){
                state["properties"]["CASES"] = CASES
                state["properties"]["DEATHS"] = DEATHS
                state["properties"]["ABBR"] = ABBR
                state["properties"]["LAT"] = LAT
                state["properties"]["LONG"] = LONG
            }
        }
    }
}

function getStateColor(stateID, props){
    let risk = getStateRisk(stateID, props)
    let pop = props.POP
    let geoID = props.GEO_ID

    pop = parseInt(pop)
    cases = dataCovid[geoID] || 0.00001
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