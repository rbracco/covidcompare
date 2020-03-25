function getCounty(countyID){
    return countyData["features"].find(element => element["properties"]["geo_id"] == countyID)
}

function convertCountyIDToLayer(countyID){
    let layer_id = countyIDToLayer[countyID]
    return countyLayer._layers[layer_id]
}

function countyStyle(feature) {
    return {
        fillColor: getColor(feature.properties),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
    };
}

function onEachCounty(feature, layer){
    layer.on({
        mouseover: () => highlightCounty(layer),
        mouseout: () => resetHighlightCounty(layer),
        click: () => displayDetailed(layer),
    });
}

function displayDetailed(layer){
    window.curCounty = layer.feature.properties.geo_id
    //let menuSelect = document.querySelector('#metricSelect')
    //let curMetric = getSelectedMetric().value
    map.removeLayer(stateLayer)
    map.addLayer(countyLayer)
    zoomToFeature(layer, padding=[300,300])
    updateSidebar()
}


function highlightCounty(layer) {
    if (!isViewable(layer)){
        if(map.getZoom() > 7){
            map.setZoom(7)
        }
        map.panTo(layer.getBounds().getCenter())
    }
    layer.setStyle({
        weight: 5,
        dashArray: '',
        fillOpacity: 0.7
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    info.updateCounty(layer.feature.properties);
}

function resetHighlightCounty(layer) {
    layer.setStyle({
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    });
}

