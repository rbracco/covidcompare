function getCounty(countyID){
    return countyData["features"].find(element => element["properties"]["geo_id"] == countyID)
}

function getCountyColor(props){
    
    let risk = props["risk_total"]
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

