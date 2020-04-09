App.prototype.addMap = function(options) {
    const app = this;

    window.curLayer = "States"
    window.curState = null
    window.curCounty = null
    window.clickState = null
    window.clickCounty = null
    window.curTab = "infographic-tab"
    window.curMetric = {value:"pc_deaths", text:"Deaths per 100,000"}
    let [lat, long] = mobileCheck()? [40, -99]:[40, -96]
    let zoomLevel = mobileCheck()?3:5
    //'mapbox/satellite-v9'
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

    L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=JUdfeZRkXltAhTrUZSpJ', {
        attribution: mapAttribution,
        maxZoom: 18,
        id: tileProvider,
        tileSize: 512,
        zoomOffset: -1,
    }).addTo(app.map);

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

    app.countyLayer = L.geoJson(countyData, 
        { 
            style:app.countyStyle, 
            onEachFeature:app.onEachCounty,
        })


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

    //Register a link between county geo_id and the layer of their feature
    app.countyIDToLayer = {}
    let _layersCounty = app.countyLayer["_layers"]
    for (let layer_key in _layersCounty){
        app.countyIDToLayer[_layersCounty[layer_key]["feature"]["properties"]["geo_id"]] = layer_key
    }


    var overlayMaps = {
        "Counties": app.countyLayer,
        "States": app.stateLayer,
    }

    var layerControl = L.control.layers(overlayMaps).addTo(app.map);
    layerControl.expand()

    let geolocate = L.control.locate({
        position: 'topright', 
        flyTo:true, 
        initialZoomLevel:8,
        strings: {
            title: "Show the latest data for my area"
        }
    }).addTo(app.map);
    
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
    
    app.map.on('locationfound', onLocationFound)    

    app.updateMapStyle = function(){
        if(window.curLayer === "States"){
            app.stateLayer.eachLayer((layer) => app.stateLayer.resetStyle(layer))
        }
        if(window.curLayer === "Counties"){
            app.countyLayer.eachLayer((layer) => app.countyLayer.resetStyle(layer))
        }
    }

    var bookmarks = new L.Control.Bookmarks().addTo(app.map);

    L.legend = L.control({position: 'bottomright'});

    app.updateLegend = function(){
        
        let {value:metricValue, text:metricText} = window.curMetric
        let {grades, colors} = getColorsForMetric(metricValue)

        L.legend.onAdd = function (map) {
        
            var div = L.DomUtil.create('div', 'info legend'),
                
                labels = [];
        
            div.innerHTML += `<h3>${metricText}</h3>`
            // loop through our density intervals and generate a label with a colored square for each interval

            for (var i = 0; i < grades.length; i++) {
                grade_label = grades[i-1] ? `${grades[i]}&ndash;${grades[i-1]}<br>`: `${grades[i]}<br>`
                div.innerHTML +=
                    `<i style="background:${colors[i]}"></i>${grade_label}`
                
            }
            return div;
        };
        L.legend.addTo(app.map);
    }
    app.updateLegend()

    app.resetMap = () => {
        const {map, countyLayer, stateLayer, getMapDefaultCoords, updateSidebarOnHover} = app;
        window.curState = null
        window.curCounty = null
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
        // resetButton.classList.add("btn-reset") 
        // resetButton.innerHTML = '<i class="fas fa-home"></i>'
        // resetButton.style = "font-size:1em;width:34px; height:32px;"
        resetButton.classList.add("btn", "btn-primary") 
        resetButton.onclick = resetMap
        
        return resetButton
    }
    
    var resetButton = L.control({position: 'topright'});
    resetButton.onAdd = function (map) {
        var resetDiv = L.DomUtil.create('div',);
        resetDiv.append(app.getResetButton())
        return resetDiv;
    };
    resetButton.addTo(app.map);

    var selectMetric = L.control({position: 'topright'});
    selectMetric.onAdd = function (map) {
        const {initSelectMenu} = app; 
        var div = L.DomUtil.create('div',);
        div.append(initSelectMenu("mapSelect"))
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    selectMetric.addTo(app.map);




    // /*------------------------------INITIALIZE INFO DISPLAY BLOCK---------------------------------- */
    // var info = L.control();
    // info.onAdd = function (map) {
    //     this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    //     this.updateState();
    //     return this._div;
    // };

    // /*-------------------------------DISPLAY STATE INFO ON HOVER ------------------------------ */

    // // method that we will use to update the control based on feature properties passed
    // info.updateState = function (props) {
    //     let title = props ? `<h3>${props.statename}</h3>`:`<h3>Hover over a state</h3>`
    //     // Add this back when active is working again(${props.active} active)
    //     // And also change cases per 100,000 to use the active metric again
    //     let body = props ? 
    //         `<b>Covid19 Cases</b><br/>
    //         ${props.cases} total cases <br/>
    //         ${props.recovered} recovered<br/>
    //         ${props.deaths || 0} deaths<br/>
    //         <span class="timestamp">Updated: ${props.time_cases_update}</span><br/>
    //         <hr>
    //         <b>Population</b><br/>
    //         ${numberWithCommas(props.population)} people<br/>
    //         ${(props.pc_cases).toFixed(2)} cases per 100000<br/>
    //         <hr>
            
    //         <b>Hospital Access</b><br>
    //         ${props.beds} hospital beds<br/>
    //         ${(props.beds/(props.population/100000)).toFixed(2)} beds per 100000<br/>
    //         <hr>
    //         <b>Comparative Risk<br/></b>
    //         Local Risk: ${(props.risk_local).toFixed(3)}<br/>
    //         Nearby Risk: ${(props.risk_nearby).toFixed(3)}<br/>
    //         Total Risk: ${(props.risk_total).toFixed(3)}<br/>
    //         <hr>
    //         <b>Testing Data<br/></b>
    //         Total Tested: ${(props.test_total)}<br/>
    //         Tested Positive: ${(props.test_positive)}<br/>
    //         Tested Negative: ${(props.test_negative)}<br/>
    //         ${(props.test_total/(props.population/100000)).toFixed(2)} tests per 100000<br/>
    //         Disclosure Grade: ${props.test_grade}<br/>
    //         <span class="timestamp">Updated: ${props.time_tests_updated}</span><br/>
    //         <br>
    //         `
    //         : "<br/>"
            
    //     this._div.innerHTML = title + body

    // };

    // /*-------------------------------DISPLAY COUNTY INFO ON HOVER ------------------------------ */

    // info.updateCounty = function (props) {
    //     let cases = props.cases || 0
    //     let title = props ? `<h3>${props.name} County</h3>`:`<h3>Hover over a county</h3>`
    //     let note =  props.notes? `<span class="timestamp">${props.notes}</span><br/>`:``
    //     let body = props ? 
    //         `<b>Covid19 Cases</b><br/>
    //         ${cases} cases<br/>
    //         ${props.deaths || 0} deaths<br/>
    //         <span class="timestamp">Updated: ${props.time_cases_update}</span><br/>
    //         <hr>
    //         <b>Population</b><br/>
    //         ${numberWithCommas(props.population)} people<br/>
    //         ${(cases/(props.population/100000)).toFixed(2)} cases per 100000<br/>
    //         <hr>
    //         <b>Comparative Risk<br/></b>
    //         Local Risk: ${(props.risk_local).toFixed(3)}<br/>
    //         Nearby Risk: ${(props.risk_nearby).toFixed(3)}<br/>
    //         Total Risk: ${(props.risk_total).toFixed(3)}<br/>
    //         ${note}
    //         `
    //         : "<br/>"
            
    //     this._div.innerHTML = title + body
    // };

    // info.addTo(map);

    //On layer change
    app.map.on('baselayerchange', (e)=> onBaseLayerChange(e))

    function onBaseLayerChange(e){
        const { updateMapStyle, updateLegend, updateList, updateSelectedMetric} = app;
        window.curLayer = e.name
        window.curCounty = null
        window.clickCounty = null
        enableDisableOptions()
        updateList()
        updateSelectedMetric(document.querySelector('select'))
        updateMapStyle()
        updateLegend()
    };

    // for(let hospital of dataHospitals){
    //     var circle = L.circle([hospital.Y, hospital.X], {
    //         color: 'green',
    //         fillColor: '#0f3',
    //         fillOpacity: 0.5,
    //         radius: 1
    //     }).addTo(map);
    // }

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
    
}

