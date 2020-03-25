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
        click: () => zoomToFeature(layer, padding=[100,100])
    });
}

function highlightCounty(layer) {
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

