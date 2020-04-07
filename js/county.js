// function indexCounties(){
//     let i = 0
//     countyIDToIndex = {}
//     console.log(countyData["features"])
//     for(let county of countyData["features"]){
//         console.log(county)
//         countyIDToIndex[county["properties"]["geo_id"]] = i
//         i += 1
//     }
//     return countyIDToIndex
// }

function getCounty(countyID){
    
    // let index = countyIndex[countyID]
    // console.log("getting county", countyID, "index", index, countyData["features"][index])
    // return countyData["features"][index]
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
    window.clickCounty = layer.feature.properties.geo_id
    updateSidebarOnHover()
    map.removeLayer(stateLayer)
    map.addLayer(countyLayer)
    let padding = mobileCheck()?[100,100]:[200,200]
    zoomToFeature(layer, padding)
    updateList()
    setTimeout(() => openSidebar(), 1250)
}


function highlightCounty(layer) {
    window.curCounty = layer.feature.properties.geo_id
    updateSidebarOnHover()
    if (!isViewable(layer)){
        if(map.getZoom() > 7){
            map.setZoom(7)
        }
        map.panTo(layer.getBounds().getCenter())
    }
    // if(isChartsTabActive()){
    //     visualize(state=null, countyID=layer.feature.properties.geo_id)
    // }
    
    layer.setStyle({
        weight: 5,
        dashArray: '',
        fillOpacity: 0.7
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    //info.updateCounty(layer.feature.properties);
}

function resetHighlightCounty(layer) {
    window.curCounty = window.clickCounty;
    updateSidebarOnHover()

    layer.setStyle({
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    });
}

