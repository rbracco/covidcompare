let API_KEY_MAPBOX = 'pk.eyJ1IjoicmJyYWNjbyIsImEiOiJjazZ6Z3c1c2IwbnNkM21tdmg0eGhmeWJkIn0.IfYSBvXVOMUlmKm8zm-XZA'

let [lat, long] = [37.8, -96]
let zoomLevel = 5
//'mapbox/satellite-v9'
let tileProvider = 'mapbox/streets-v11'
let map = L.map('map').setView([lat, long], zoomLevel);

let mapAttribution = `<a href="https://www.defineamerican.com" target="_blank">Define American</a> |
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


function getCentroids(){
    let centroids = {}
    for(let feat of countyCentroids["features"]){
        centroids[feat["properties"]["GEO_ID"]] = feat["geometry"]["coordinates"]
    }
    return centroids
}

let centroids = getCentroids()

function getDistance(c0, c1){
    let latDist = Math.abs(c0[0]-c1[0])
    let longDist = Math.abs(c0[1]-c1[1])
    return Math.sqrt(latDist*latDist + longDist*longDist)
}

//It will speed it up massively if I just iterate over dataCovid (where we have cases) instead of every county
function getNeighboringRisk(geoID){
    let neighborRisk = 0.0
    for (let feat of countyData["features"]){
        let geoID2 = feat["properties"]["GEO_ID"]
        if((geoID != geoID2) & (geoID2 in dataCovid)){
            let distance = getDistance(centroids[geoID], centroids[geoID2]) * 111 //distance in km
            let curNeighborRisk = getRisk(feat["properties"], originalCall=false)
            if(! isNaN(curNeighborRisk)){
                neighborRisk += curNeighborRisk/distance
            }
        }
    }
    return neighborRisk
}

function getRisk(props, originalCall=true){
    let pop = props.POP
    let geoID = props.GEO_ID
    pop = parseInt(pop)
    cases = dataCovid[geoID] || 0.00001
    let risk = cases/pop
    
    let neighborRisk = 0
    if(originalCall){
        neighborRisk = getNeighboringRisk(geoID)
    }
    return risk + neighborRisk
}

function getColor(props){
    let risk = getRisk(props)
    let pop = props.POP
    let geoID = props.GEO_ID
    //console.log(geoID, risk)

    pop = parseInt(pop)
    cases = dataCovid[geoID] || 0.00001
    //let val = cases/pop
    let val = risk
    //console.log("Risk", risk)
    return val > 0.0001 ? '#a50f15':
           val > 0.00003  ? '#de2d26':
           val > 0.00001   ? '#fb6a4a':
           val > 0.000003    ? '#fc9272':
           val > 0.000001    ? '#fcbba1':
           isNaN(val)    ? '#000000':
                         '#bbbbbb';
}

function countyStyle(feature) {
    return {
        fillColor: getColor(feature.properties),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

let stateStyle = {
    weight: 1,
    opacity: 1,
    color: 'black',
}
function onEachState(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
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
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function resetHighlight(e) {
    stateLayer.resetStyle(e.target);
}

function resetHighlightCounty(e) {
    countyLayer.resetStyle(e.target);
}

console.log("States", statesData)
console.log("Counties", countyData)

function highlightFeature(e) {
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
}


var countyLayer = L.geoJson(countyData, 
    { 
        style:countyStyle, 
        onEachFeature:onEachCounty
    }).addTo(map);
// var stateLayer  = L.geoJson(statesData, 
//     { 
//         style:stateStyle, 
//         onEachFeature:onEachState
//     }).addTo(map);

// // create the sidebar instance and add it to the map
// var sidebar = L.control.sidebar({ container: 'sidebar' })
//     .addTo(map)
//     .open('home');

// add panels dynamically to the sidebar
// sidebar
//     .addPanel({
//         id:   'js-api',
//         tab:  '<i class="fa fa-gear"></i>',
//         title: 'JS API',
//         pane: '<p>The Javascript API allows to dynamically create or modify the panel state.<p/><p><button onclick="sidebar.enablePanel(\'mail\')">enable mails panel</button><button onclick="sidebar.disablePanel(\'mail\')">disable mails panel</button></p><p><button onclick="addUser()">add user</button></b>',
//     })
//     // add a tab with a click callback, initially disabled
//     .addPanel({
//         id:   'mail',
//         tab:  '<i class="fa fa-envelope"></i>',
//         title: 'Messages',
//         button: function() { alert('opened via JS callback') },
//         disabled: true,
//     })

// // be notified when a panel is opened
// sidebar.on('click', function (ev) {
//     console.log(ev)
//     switch (ev.id) {
//         case 'autopan':
//         sidebar.options.autopan = true;
//         break;
//         default:
//         sidebar.options.autopan = false;
//     }
// });

// L.geoJson(statesData).addTo(map);


// var protestIcon = L.icon({
//     iconUrl: 'img/stop.jpg',
//     //shadowUrl: 'img/leaf-shadow.png',

//     iconSize:     [38, 34], // size of the icon
//     //shadowSize:   [50, 64], // size of the shadow
//     iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
//     shadowAnchor: [4, 62],  // the same for the shadow
//     popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
// });



// //greenMarker.addTo(map);

// async function displayLeaders(){
//     let count = 0
//     for (let leader of leaders){
//         await new Promise(r => setTimeout(r, 50));
//         displayLeader(leader, count)
//         count++;
//     }
//     let saysNo = document.querySelector('#saysno')
//     saysNo.innerText = `Over 250 Faith Leaders Across KY`
//     let msg = document.querySelector('#msg')
//     msg.innerText = `...say PLEASE STOP SB1!`
//     let heightWrapper = document.querySelector('.height-wrapper')
//     heightWrapper.style.height = "20px";
// }

// var allMarkers = [];

// function popOpen(count){
//     map.setView([37.8393, -86.9700], zoomLevel);
//     allMarkers[count].openPopup()
// }

// function displayLeader(leader, count){
//     let {lat:leaderLat, long:leaderLong, Name:leaderName, Organization:org} = leader
//     let newMarker = L.marker([leaderLat, leaderLong], {icon: protestIcon})
//     newMarker.addTo(map)
//     newMarker.bindPopup(`<p>
//     <div><strong>Name:</strong> ${leaderName}</div>
//     <div><strong>Organization:</strong> ${org}</div>
//     <div><strong>Stance on SB1:</strong> <span style="color:red;font-weight:bold;">OPPOSE</span></div>
//     </p>`)
//     allMarkers.push(newMarker)
    
//     let saysNo = document.querySelector('#saysno')
//     saysNo.innerText = `${leaderName}`

//     let signUL = document.querySelector('#signers')
//     let newLI = document.createElement('li')
//     newLI.innerHTML = `<a onmouseover=popOpen(${count}) onclick='map.setView([${leaderLat},${leaderLong}], 14)'>${leaderName}</a>`
//     signUL.append(newLI)

//     let w = document.querySelector('.leaflet-sidebar-content')
//     w.scrollTop = w.scrollHeight;
// }

// var sidebar = L.control.sidebar('sidebar').addTo(map);
// displayLeaders()
// console.log(allMarkers)
