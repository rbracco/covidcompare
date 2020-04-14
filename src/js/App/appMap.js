App.prototype.addMap = function(options) {
    /*------------------------------INITIALIZE STATE---------------------------------- */
    const app = this;
    window.hoverState = null
    window.hoverCounty = null
    window.clickState = null
    window.clickCounty = null
    window.curTab = "infographic-tab"
    window.curMetric = {value:"pc_deaths", text:"Deaths per 100,000"}

    let [lat, long] = mobileCheck()? [40, -99]:[40, -96]
    let zoomLevel = mobileCheck()?3:5
    //https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=JUdfeZRkXltAhTrUZSpJ

    /*------------------------------CREATE AND INITIALIZE MAP---------------------------------- */
    let tileProvider = 'mapbox/streets-v11'
    app.map = L.map('map').setView([lat, long], zoomLevel);
    let mapAttribution = `<a href="https://github.com/rbracco/covidcompare" target="_blank">Github</a> |
                        Covid Data: 
                        <a href="https://covidtracking.com/api/" target="_blank">Testing</a> |
                        <a href="https://covid19.mathdro.id/api/" target="_blank">State</a> |
                        <a href="https://coronavirus.1point3acres.com/" target="_blank">County</a> 
                        Map data: 
                        <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> |
                        <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> |
                        <a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a>`
    L.tileLayer('http://covidcompare.com:8080/tile/{z}/{x}/{y}.png', {
        attribution: mapAttribution,
        maxZoom: 18,
        //id: tileProvider,
        tileSize: 256,
        zoomOffset: 0,
    }).addTo(app.map);

    

    /*------------------------------FUNCTION FOR ONLOCATIONFOUND EVENT---------------------------------- */
    async function onLocationFound(e) {
        const { map, getCountyIDFromLatLng, stateLayer, countyLayer, updateSidebarOnHover, openSidebar } = app;
        let latitude = e.latitude
        let longitude = e.longitude
        const countyID = await getCountyIDFromLatLng(latitude, longitude)
        window.clickCounty = countyID
    
        map.removeLayer(stateLayer)
        map.addLayer(countyLayer)
        updateSidebarOnHover()
        openSidebar()
    }
    //Note in the geolocate code we have turned off following so that it only finds the location once
    //on button click and doesnt continue tracking location
    app.map.on('locationfound', onLocationFound) 

    /*------------------------------FUNCTION FOR BASELAYERCHANGE EVENT---------------------------------- */
    app.map.on('baselayerchange', (e)=> onBaseLayerChange(e))

    function onBaseLayerChange(e){
        const { updateMapStyle, updateLegend, updateList, updateSelectedMetric} = app;
        window.hoverCounty = null
        window.clickCounty = null
        enableDisableOptions()
        updateList()
        updateSelectedMetric(document.querySelector('select'))
        updateMapStyle()
        updateLegend()
    };

    /*------------------------------CREATE A RESET MAP BUTTON---------------------------------- */
    app.resetMap = () => {
        const {map, countyLayer, stateLayer, getMapDefaultCoords, updateSidebarOnHover} = app;
        window.hoverState = null
        window.hoverCounty = null
        window.clickState = null
        window.clickCounty = null
        let [lat, long] = getMapDefaultCoords()
        let zoomLevel = mobileCheck()?3:5
        map.setView([lat,long], zoomLevel);
        map.removeLayer(countyLayer)
        map.addLayer(stateLayer)
        updateSidebarOnHover()
    }

    app.getResetButton = function() {
        const { resetMap } = app;
        let resetButton = document.createElement('input')
        resetButton.type = "button"
        resetButton.value = "Reset Map"
        resetButton.classList.add("btn", "btn-primary") 
        resetButton.onclick = resetMap
        return resetButton
    }

    /*------------------------------GENERAL MAP UTILITY FUNCTIONS---------------------------------- */

    app.getCurLayer = function() {
        if(app.map.hasLayer(app.countyLayer)){
            return "Counties"
        }
        else if(app.map.hasLayer(app.stateLayer)){
            return "States"
        }
        return null
    }

    app.zoomToFeature = function(layer, padding) {
        app.map.fitBounds(layer.getBounds(), {padding:padding});
    }

    app.isViewable = function(layer){
        const map = app.map
        return map.getBounds().contains(layer.getBounds().getNorthEast()) || map.getBounds().contains(layer.getBounds().getSouthWest()) 
    }

    app.getMapDefaultCoords = function(){
        const { isSidebarOpen } = app;
        if(mobileCheck()){
            //check if sidebar is open, autopan messes up map reset, this is a slight hack
            return isSidebarOpen()? [40, -99]:[40, -106.12]
        }
        return isSidebarOpen()? [40, -106.12]:[40, -96]
    }  

    /*------------------------------MAKE STATE/COUNTY/OUTLINE LAYERS--------------------------------- */
    //Make a non responsive pane for state outlines so we can see them in county mode
    let outlinePane = app.map.createPane('outlines');
    outlinePane.style.pointerEvents = 'none';
    outlinePane.style.zIndex = 600;
    var stateOutlines = L.geoJson(stateData, 
        {
            color:"#444",
            fillOpacity:0,
            weight:2,
            pane: outlinePane,
            interactive:false,
        }).addTo(app.map)

    //create state layer
    app.stateLayer  = L.geoJson(stateData, 
        { 
            style:app.stateStyle, 
            onEachFeature:app.onEachState,
            
        }).addTo(app.map)

    //Register a link between state IDs and the layer of their feature
    app.stateIDToLayer = {}
    let _layersState = app.stateLayer["_layers"]
    for (let layer_key in _layersState){
        app.stateIDToLayer[_layersState[layer_key]["feature"]["id"]] = layer_key
    }

    //create county layer
    app.countyLayer = L.geoJson(countyData, 
        { 
            style:app.countyStyle, 
            onEachFeature:app.onEachCounty,
        })

    //Register a link between county geo_id and the layer of their feature
    app.countyIDToLayer = {}
    let _layersCounty = app.countyLayer["_layers"]
    for (let layer_key in _layersCounty){
        app.countyIDToLayer[_layersCounty[layer_key]["feature"]["properties"]["geo_id"]] = layer_key
    }


    /*------------------------------ADD COUNTY/STATE LAYER CONTROL---------------------------------- */
    var overlayMaps = {
        "Counties": app.countyLayer,
        "States": app.stateLayer,
    }

    var layerControl = L.control.layers(overlayMaps).addTo(app.map);
    layerControl.expand()

    /*------------------------------ADD GEOLOCATE CONTROL---------------------------------- */
    let geolocate = L.control.locate({
        position: 'topright', 
        flyTo:true, 
        initialZoomLevel:8,
        strings: {
            title: "Show the latest data for my area"
        }
    }).addTo(app.map);
    
    app.updateMapStyle = function(){
        app.getCurLayer() === "States"? 
                                app.stateLayer.eachLayer((layer) => app.stateLayer.resetStyle(layer)):
                                app.countyLayer.eachLayer((layer) => app.countyLayer.resetStyle(layer))
    }

    /*------------------------------ADD BOOKMARKS CONTROL---------------------------------- */
    var bookmarks = new L.Control.Bookmarks().addTo(app.map);

    /*------------------------------ADD LEGEND CONTROL---------------------------------- */
    L.legend = L.control({position: 'bottomright'});
    app.updateLegend = function(){
        let {value:metricValue, text:metricText} = window.curMetric
        let {grades, colors} = getColorsForMetric(metricValue)
        L.legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend')
            labels = [];
            div.innerHTML += `<h3>${metricText}</h3>`
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                grade_label = grades[i-1] ? `${grades[i]}&ndash;${grades[i-1]}<br>`: `${grades[i]}<br>`
                div.innerHTML += `<i style="background:${colors[i]}"></i>${grade_label}`
            }
            return div;
        };
        L.legend.addTo(app.map);
    }
    app.updateLegend()

    /*------------------------------ADD RESET CONTROL---------------------------------- */
    
    var resetButton = L.control({position: 'topright'});
    resetButton.onAdd = function (map) {
        var resetDiv = L.DomUtil.create('div',);
        resetDiv.append(app.getResetButton())
        return resetDiv;
    };
    resetButton.addTo(app.map);

    /*------------------------------ADD SELECT CONTROL---------------------------------- */
    var selectMetric = L.control({position: 'topright'});
    selectMetric.onAdd = function (map) {
        const {initSelectMenu} = app; 
        var div = L.DomUtil.create('div',);
        div.append(initSelectMenu("mapSelect"))
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    selectMetric.addTo(app.map);
    
    // for(let hospital of dataHospitals){
    //     var circle = L.circle([hospital.Y, hospital.X], {
    //         color: 'green',
    //         fillColor: '#0f3',
    //         fillOpacity: 0.5,
    //         radius: 1
    //     }).addTo(map);
    // }

}

