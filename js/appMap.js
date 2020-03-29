/*---------------------------------------------MAP SETUP--------------------------------------------- */
//On page load
window.curLayer = "States"
window.curState = null
let [lat, long] = [42, -104]
let zoomLevel = 5
//'mapbox/satellite-v9'
let tileProvider = 'mapbox/streets-v11'
let map = L.map('map').setView([lat, long], zoomLevel);
let mapAttribution = `<a href="https://github.com/rbracco/covidcompare" target="_blank">Github</a> |
                    Covid Data: 
                    <a href="https://covidtracking.com/api/" target="_blank">Testing</a> |
                    <a href="https://covid19.mathdro.id/api/" target="_blank">State</a> |
                    <a href="https://coronavirus.1point3acres.com/" target="_blank">County</a> 
                    Map data: 
                    <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> |
                    <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> |
                    <a href="https://www.mapbox.com/" target="_blank">Imagery:Mapbox</a>`

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: mapAttribution,
    maxZoom: 18,
    id: tileProvider,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: API_KEY_MAPBOX,
}).addTo(map);

let outlinePane = map.createPane('outlines');
outlinePane.style.pointerEvents = 'none';
outlinePane.style.zIndex = 600;

var stateOutlines = L.geoJson(stateData, 
    {
        color:"#444",
        fillOpacity:0,
        weight:2,
        pane: outlinePane,
        interactive:false,
    }).addTo(map)

var countyLayer = L.geoJson(countyData, 
    { 
        style:countyStyle, 
        onEachFeature:onEachCounty,
    })


var stateLayer  = L.geoJson(stateData, 
    { 
        style:stateStyle, 
        onEachFeature:onEachState,
        
    }).addTo(map)

//Register a link between state IDs and the layer of their feature
let stateIDToLayer = {}
let _layersState = stateLayer["_layers"]
for (let layer_key in _layersState){
    stateIDToLayer[_layersState[layer_key]["feature"]["id"]] = layer_key
}

//Register a link between county geo_id and the layer of their feature
let countyIDToLayer = {}
let _layersCounty = countyLayer["_layers"]
for (let layer_key in _layersCounty){
    countyIDToLayer[_layersCounty[layer_key]["feature"]["properties"]["geo_id"]] = layer_key
}


var overlayMaps = {
    "Counties": countyLayer,
    "States": stateLayer,
}

var layerControl = L.control.layers(overlayMaps).addTo(map);
layerControl.expand()

function updateMapStyle(){
    if(window.curLayer === "States"){
        stateLayer.eachLayer((layer) => stateLayer.resetStyle(layer))
    }
    if(window.curLayer === "Counties"){
        countyLayer.eachLayer((layer) => countyLayer.resetStyle(layer))
    }
}

/*-------------------------------LEGEND CONTROL ------------------------------ */

L.legend = L.control({position: 'bottomright'});

function updateLegend(){
    
    let {value:metricValue, text:metricText} = getSelectedMetric()
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
    L.legend.addTo(map);
}
updateLegend()

/*------------------------------INITIALIZE INFO DISPLAY BLOCK---------------------------------- */
var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.updateState();
    return this._div;
};

/*-------------------------------DISPLAY STATE INFO ON HOVER ------------------------------ */

// method that we will use to update the control based on feature properties passed
info.updateState = function (props) {
    let title = props ? `<h3>${props.statename}</h3>`:`<h3>Hover over a state</h3>`
    // Add this back when active is working again(${props.active} active)
    // And also change cases per 100,000 to use the active metric again
    let body = props ? 
        `<b>Covid19 Cases</b><br/>
        ${props.cases} total cases <br/>
        ${props.recovered} recovered<br/>
        ${props.deaths || 0} deaths<br/>
        <span class="timestamp">Updated: ${props.time_cases_update}</span><br/>
        <hr>
        <b>Population</b><br/>
        ${numberWithCommas(props.population)} people<br/>
        ${(props.pc_cases).toFixed(2)} cases per 100000<br/>
        <hr>
        
        <b>Hospital Access</b><br>
        ${props.beds} hospital beds<br/>
        ${(props.beds/(props.population/100000)).toFixed(2)} beds per 100000<br/>
        <hr>
        <b>Comparative Risk<br/></b>
        Local Risk: ${(props.risk_local).toFixed(3)}<br/>
        Nearby Risk: ${(props.risk_nearby).toFixed(3)}<br/>
        Total Risk: ${(props.risk_total).toFixed(3)}<br/>
        <hr>
        <b>Testing Data<br/></b>
        Total Tested: ${(props.test_total)}<br/>
        Tested Positive: ${(props.test_positive)}<br/>
        Tested Negative: ${(props.test_negative)}<br/>
        ${(props.test_total/(props.population/100000)).toFixed(2)} tests per 100000<br/>
        Disclosure Grade: ${props.test_grade}<br/>
        <span class="timestamp">Updated: ${props.time_tests_updated}</span><br/>
        <br>
        `
        : "<br/>"
        
    this._div.innerHTML = title + body

};

/*-------------------------------DISPLAY COUNTY INFO ON HOVER ------------------------------ */

info.updateCounty = function (props) {
    let cases = props.cases || 0
    let title = props ? `<h3>${props.name} County</h3>`:`<h3>Hover over a county</h3>`
    let note =  props.notes? `<span class="timestamp">${props.notes}</span><br/>`:``
    let body = props ? 
        `<b>Covid19 Cases</b><br/>
        ${cases} cases<br/>
        ${props.deaths || 0} deaths<br/>
        <span class="timestamp">Updated: ${props.time_cases_update}</span><br/>
        <hr>
        <b>Population</b><br/>
        ${numberWithCommas(props.population)} people<br/>
        ${(cases/(props.population/100000)).toFixed(2)} cases per 100000<br/>
        <hr>
        <b>Comparative Risk<br/></b>
        Local Risk: ${(props.risk_local).toFixed(3)}<br/>
        Nearby Risk: ${(props.risk_nearby).toFixed(3)}<br/>
        Total Risk: ${(props.risk_total).toFixed(3)}<br/>
        ${note}
        `
        : "<br/>"
        
    this._div.innerHTML = title + body
};

info.addTo(map);

//On layer change
map.on('baselayerchange', function (e) {
    window.curLayer = e.name
    initSidebarControls()
    updateSidebar()
    updateMapStyle()
    updateLegend()
});

// for(let hospital of dataHospitals){
//     var circle = L.circle([hospital.Y, hospital.X], {
//         color: 'green',
//         fillColor: '#0f3',
//         fillOpacity: 0.5,
//         radius: 1
//     }).addTo(map);
// }
