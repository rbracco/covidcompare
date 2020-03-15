let API_KEY_MAPBOX = 'pk.eyJ1IjoicmJyYWNjbyIsImEiOiJjazZ6Z3c1c2IwbnNkM21tdmg0eGhmeWJkIn0.IfYSBvXVOMUlmKm8zm-XZA'
// let dataCovidState = getJSON('data/dataCovidState.json', data => dataCovidState = data);
let [lat, long] = [37.8, -96]
let zoomLevel = 5
//'mapbox/satellite-v9'
let tileProvider = 'mapbox/streets-v11'
let map = L.map('map').setView([lat, long], zoomLevel);
let centroids = getCountyCentroids()
mergeCovidCountyData()
mergeCovidStateData()
calcRiskAllStates()
calcRiskAllCounties()
//dump countyData to file
//dump stateData to file
let mapAttribution = `<a href="https://github.com/rbracco/covidcompare" target="_blank">Github</a> |
                    'Map data &copy; <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, 
                    <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>, Imagery © 
                    <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>'`

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: mapAttribution,
    maxZoom: 18,
    id: tileProvider,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: API_KEY_MAPBOX,
}).addTo(map);



function countyStyle(feature) {
    return {
        fillColor: getCountyColor(feature.properties),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

var countyLayer = L.geoJson(countyData, 
    { 
        style:countyStyle, 
        onEachFeature:onEachCounty
    })

var stateLayer  = L.geoJson(statesData, 
    { 
        style:stateStyle, 
        onEachFeature:onEachState
    }).addTo(map);

var overlayMaps = {
    "Counties": countyLayer,
    "States": stateLayer,
}

var layerControl = L.control.layers(overlayMaps).addTo(map);
layerControl.expand()

var info = L.control();
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
    console.log(layer)
}

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.updateState();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.updateState = function (props) {
    let title = props ? `<h3>${props.name}</h3>`:`<h3>Hover over a state</h3>`
    let body = props ? 
        `<b>Covid19 Cases</b><br/>
        ${props.CASES} cases<br/>
        ${props.population} people<br/>
        ${(props.CASES/(props.population/100000)).toFixed(2)} cases per 100000<br/>
        <b>Hospital Access</b><br>
        ${props.beds} hospital beds<br/>
        ${(props.beds/(props.population/100000)).toFixed(2)} beds per 100000<br/>
        <b>Relative Risk<br/></b>
        Local Risk: ${(100000*props.LOCALRISK).toFixed(3)}<br/>
        Nearby Risk: ${(100000*props.NEIGHBORRISK).toFixed(3)}<br/>
        Total Risk: ${(100000*props.TOTALRISK).toFixed(3)}<br/>
        <br>
        `
        : "<br/>"
        
    this._div.innerHTML = title + body

};

info.updateCounty = function (props) {
    let cases = props.cases || 0
    let title = props ? `<h3>${props.NAME} County</h3>`:`<h3>Hover over a county</h3>`
    let body = props ? 
        `<b>Covid19 Cases</b><br/>
        ${cases} cases<br/>
        ${props.POP} people<br/>
        ${(cases/(props.POP/100000)).toFixed(2)} cases per 100000<br/>
        <b>Relative Risk<br/></b>
        Local Risk: ${(100000*props.LOCALRISK).toFixed(3)}<br/>
        Nearby Risk: ${(100000*props.NEIGHBORRISK).toFixed(3)}<br/>
        Total Risk: ${(100000*props.TOTALRISK).toFixed(3)}<br/>
        <br>
        `
        : "<br/>"
        
    this._div.innerHTML = title + body
};

info.addTo(map);

// for(let hospital of dataHospitals){
//     var circle = L.circle([hospital.Y, hospital.X], {
//         color: 'green',
//         fillColor: '#0f3',
//         fillOpacity: 0.5,
//         radius: 1
//     }).addTo(map);
// }