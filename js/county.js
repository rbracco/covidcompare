function getCounty(countyID){
    return countyData["features"].find(element => element["properties"]["geo_id"] == countyID)
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
        mouseover: highlightCounty,
        mouseout: resetHighlightCounty,
        click: zoomToFeature
    });
}

function highlightCounty(e) {
    var layer = e.target;
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

