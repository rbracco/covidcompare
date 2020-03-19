function getState(stateID){
    return statesData["features"].find(element => element["id"] == stateID)
}

function stateStyle(feature) {
    return {
        fillColor: getColor(feature.properties["risk_total"]),
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
        click: zoomToCounties,
    });
}

function zoomToCounties(e){
    let menuSelect = document.querySelector('#metricSelect')
    let curMetric = menuSelect.options[menuSelect.selectedIndex].value
    console.log("MET", curMetric)
    map.removeLayer(stateLayer)
    map.addLayer(countyLayer)
    zoomToFeature(e, padding=[100,100])
    let stateName = e.target.feature.properties.name
    let filt = filterByProp("statename", stateName)
    updateSidebar("Counties", curMetric, filt, stateName)
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