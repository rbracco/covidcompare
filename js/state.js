function getState(stateID) {
    return stateData["features"].find(element => element["id"] == stateID)
}

function getStateFromName(stateName){
    return stateData["features"].find(element => element["properties"]["statename"] == stateName)
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
    });
}

function zoomToCounties(layer){
    window.clickState = layer.feature.properties.statename
    let menuSelect = document.querySelector('#metricSelect')
    map.removeLayer(stateLayer)
    map.addLayer(countyLayer)
    let padding = mobileCheck()?[0,0]:[100,100]
    zoomToFeature(layer, padding=[0,0])
    setTimeout(() => openSidebar(), 1250)
}

function resetHighlightState(layer) {
    window.curState = window.clickState
    updateSidebarOnHover()
    stateLayer.resetStyle(layer);
}

function highlightState(layer) {
    window.curState=layer.feature.properties.statename
    updateSidebarOnHover()

    layer.setStyle({
        weight: 5,
        color: '#777',
        dashArray: '',
        fillOpacity: 0.7
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

