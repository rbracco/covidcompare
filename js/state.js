function getState(stateID) {
    return statesData["features"].find(element => element["id"] == stateID)
}

function convertStateIDToLayer(stateID){
    let layer_id = stateIDToLayer[stateID]
    return stateLayer._layers[layer_id]
}

function stateStyle(feature) {
    return {
        fillColor: getColor(feature.properties),
        weight: 1,
        opacity: 1,
        color: 'black',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function onEachState(feature, layer) {
    layer.on({
        mouseover: () => highlightState(layer),
        mouseout: () => resetHighlightState(layer),
        click: () => zoomToCounties(layer)
    //click: zoomToCounties,
    });
}

function zoomToCounties(layer){
    window.curState = layer.feature.properties.statename
    let menuSelect = document.querySelector('#metricSelect')
    let curMetric = getSelectedMetric().value
    map.removeLayer(stateLayer)
    map.addLayer(countyLayer)
    zoomToFeature(layer, padding=[100,100])   
}

function resetHighlightState(layer) {
    stateLayer.resetStyle(layer);
    info.updateState();
}

function highlightState(layer) {
    layer.setStyle({
        weight: 5,
        color: '#FFF',
        dashArray: '',
        fillOpacity: 0.7
    });
    info.updateState(layer.feature.properties);
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

