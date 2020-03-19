var sidebar = L.control.sidebar({container:'sidebar'})
            .addTo(map)
            .open('home');

        // be notified when a panel is opened
        sidebar.on('content', function (ev) {
            switch (ev.id) {
                case 'autopan':
                sidebar.options.autopan = true;
                break;
                default:
                sidebar.options.autopan = false;
            }
        });

let resetMap = () => {
    map.setView([42, -104], 5);
    map.removeLayer(countyLayer)
    map.addLayer(stateLayer)
    updateSidebar("States", "confirmed")
}

function getResetButton() {
    let resetButton = document.createElement('input')
    resetButton.type = "button"
    resetButton.value = "Reset Map"

    resetButton.classList.add("btn", "btn-primary") 
    resetButton.onclick = resetMap
    return resetButton
}
let nameConverter = {
    "Total Risk":"risk_total",
    "Total Cases":"confirmed",
    "Total Active":"active",
    "Total Tests":"test_total",
}
function getSelectMenu(layerName){
    let options = layerName === 'States'?
                    {
                        "Case Data":
                        {
                            "Total Cases":"confirmed", 
                            "Active":"active", 
                            "Recovered":"recovered", 
                            "Deaths":"deaths",
                        },
                        "Per Capita":
                        {
                            "Cases/100k":null, 
                            "Active/100k":null, 
                            "Recovered/100k":null, 
                            "Deaths/100k":null,
                        },
                        "Risk Data":
                        {
                            "Total Risk":"risk_total", 
                            "Local Risk":"risk_local", 
                            "Nearby Risk":"risk_nearby",
                        },
                        "Testing Data":
                        {
                            "Total Tests":"test_total", 
                            "Tests/100k":null,
                        },
                    }
                    :
                    {
                        "Case Data":
                        {
                            "Total Cases":"cases", 
                            "Deaths":"deaths", 
                            "Cases/100k":null,
                        },
                        "Risk Data":
                        {
                            "Total Risk":"risk_total",
                            "Local Risk":"risk_local",
                            "Nearby Risk":"risk_nearby",
                        },
                    }
    let selectMenu = document.createElement('select')
    selectMenu.id = "metricSelect"
    for (let category of Object.keys(options)){
        let menuOption = document.createElement('option')
        menuOption.text = "  ---" + category + "---"
        menuOption.disabled = "disabled"
        menuOption.style = "font-weight:bold;"
        selectMenu.appendChild(menuOption)
        for (let displayName of Object.keys(options[category])){
            let menuOption = document.createElement('option')
            menuOption.value  = options[category][displayName]
            menuOption.text = displayName
            selectMenu.appendChild(menuOption)
        }
    }

    selectMenu.addEventListener("change", ()=> updateSidebar(layerName, selectMenu.value))
    return selectMenu
}

function initSidebarControls(layerName){
    let controlsDiv = document.querySelector(".controls")
    let resetButton = getResetButton()
    let selectMenu = getSelectMenu(layerName)
    controlsDiv.innerHTML = ""
    controlsDiv.append(selectMenu, resetButton)
}

function updateSidebar(layerName, metric, filt, region="US"){
    console.log("Layer", layerName,"metric", metric, "filt", filt,"region", region)
    
    
    let dataDiv = document.querySelector(".data")
    dataDiv.innerHTML = ''
    let newOL = document.createElement('ol')
    let totalCases = 0
    if(layerName == "States"){
        let data = filt ? stateData["features"].filter(filt):stateData["features"]

        for(let state of data.sort(sortByProp(metric))){
            let newLI = document.createElement('li')
            let {name, confirmed, lat, long} = state["properties"]
            let curMetric = state["properties"][metric]
            totalCases += curMetric
            newLI.innerHTML = `<a>${state["properties"]["name"]}</a> - ${curMetric} cases`
            newLI.addEventListener("mouseover", () => info.updateState(state["properties"]))
            newLI.addEventListener("click", (e) => {
                map.setView([lat, long], 8)
                map.removeLayer(stateLayer)
                map.addLayer(countyLayer)
                updateSidebar("Counties", metric, filterByProp("statename", name), name)
            })
            newOL.appendChild(newLI)
        }
    }
    else {
        let data = filt ? countyData["features"].filter(filt):countyData["features"]
        for(let county of data.sort(sortByProp("cases"))){
            let newLI = document.createElement('li')
            let {name, statename, cases} = county["properties"]
            if(cases <= 0){
                break
            }
            totalCases += cases
            newLI.innerHTML = `<a>${name}, ${statename}</a> ${cases} cases`
            newLI.addEventListener("mouseover", () => info.updateCounty(county["properties"]))
            newOL.appendChild(newLI)
        }
    }
    header = document.createElement('h3')
    header.innerText = `Total in ${region} ${totalCases}`
    dataDiv.append(header,  newOL)
}

function sortByProp(prop, descending=true){
    return descending ?
           ((a, b) => a["properties"][prop] > b["properties"][prop] ? -1 : 1)
           :((a, b) => a["properties"][prop] > b["properties"][prop] ? 1 : -1)
}

function filterByProp(prop, value){
    return (item) => item["properties"][prop] == value
}

initSidebarControls("States")
updateSidebar("States", "confirmed")

map.on('baselayerchange', function (e) {
    initSidebarControls(e.name)
    updateSidebar(e.name, "confirmed")
});

