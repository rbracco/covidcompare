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
    window.curState = null
    map.setView([42, -104], 5);
    map.removeLayer(countyLayer)
    map.addLayer(stateLayer)
    updateSidebar()
}

function getResetButton() {
    let resetButton = document.createElement('input')
    resetButton.type = "button"
    resetButton.value = "Reset Map"

    resetButton.classList.add("btn", "btn-primary") 
    resetButton.onclick = resetMap
    return resetButton
}

function getAllOptions(sections){
    option_list = []
    for(let section of sections){
        for(let val of Object.values(section)){
            option_list.push(val)
        }
    }
    return option_list
}

function getSelectMenu(){
    let layerName = window.curLayer
    let oldValue =  getSelectedMetric().value
    let options = layerName === 'States'?
                    {
                        "Case Data":
                        {
                            "Total Cases":"cases", 
                            "Active":"active", 
                            "Recovered":"recovered", 
                            "Deaths":"deaths",
                        },
                        // "Per Capita":
                        // {
                        //     "Cases/100k":null, 
                        //     "Active/100k":null, 
                        //     "Recovered/100k":null, 
                        //     "Deaths/100k":null,
                        // },
                        "Risk Data":
                        {
                            "Total Risk":"risk_total", 
                            "Local Risk":"risk_local", 
                            "Nearby Risk":"risk_nearby",
                        },
                        "Testing Data":
                        {
                            "Total Tests":"test_total", 
                            //"Tests/100k":null,
                        },
                    }
                    :
                    {
                        "Case Data":
                        {
                            "Total Cases":"cases", 
                            "Deaths":"deaths", 
                            //"Cases/100k":null,
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
    if(getAllOptions(Object.values(options)).includes(oldValue)){
        selectMenu.value = oldValue
    }
    else {
        selectMenu.text = "Total Cases"
        selectMenu.value = "cases"
    }
    selectMenu.addEventListener("change", ()=> {
        updateSidebar()
        updateMapStyle()
    })
    return selectMenu
}

function initSidebarControls(){
    let curValue = getSelectedMetric()
    let controlsDiv = document.querySelector(".controls")
    let resetButton = getResetButton()
    let selectMenu = getSelectMenu()
    //Make sure we keep the selected value 
    if (curValue){
        selectMenu.value = curValue.value
    }
    controlsDiv.innerHTML = ""
    controlsDiv.append(selectMenu, resetButton)
}

function populateSidebarState(dataDiv){
    let totalCases = 0
    let data = getSidebarData()
    let region = window.curState ? window.curState:"United States"
    let {text:metricText, value:metric} = getSelectedMetric()
    let newOL = document.createElement('ol')
    for(let state of data.sort(sortByProp(metric))){
        let newLI = document.createElement('li')
        let {statename, cases, lat, long} = state["properties"]
        let curMetric = state["properties"][metric]
        totalCases += curMetric
        if(["risk_total", "risk_local", "risk_nearby"].includes(metric)){
            curMetric = curMetric.toFixed(3)
            totalCases = ""
        }
        newLI.innerHTML = `<a>${state["properties"]["statename"]}</a> - ${curMetric} ${metricText}`
        newLI.addEventListener("mouseover", () => info.updateState(state["properties"]))
        newLI.addEventListener("click", (e) => {
            map.setView([lat, long], 8)
            window.curState = statename
            map.removeLayer(stateLayer)
            map.addLayer(countyLayer)
            // updateSidebar()
        })
        newOL.appendChild(newLI)
    }
    header = document.createElement('h3')
    header.innerText = `${metricText} in ${region}: ${totalCases}`
    dataDiv.append(header,  newOL)
}

function populateSidebarCounty(dataDiv){
    let totalCases = 0
    let data = getSidebarData()
    let region = window.curState ? window.curState:"United States"
    let {text:metricText, value:metric} = getSelectedMetric()
    let newOL = document.createElement('ol')
    for(let county of data.sort(sortByProp(metric))){
        let newLI = document.createElement('li')
        let {name, statename, cases} = county["properties"]
        let curMetric = county["properties"][metric]
        if(curMetric <= 0){
            break
        }
        totalCases += curMetric
        if(["risk_total", "risk_local", "risk_nearby"].includes(metric)){
            curMetric = curMetric.toFixed(3)
            totalCases = ""
        }
        newLI.innerHTML = `<a>${name}, ${statename}</a> ${curMetric}  ${metricText}`
        newLI.addEventListener("mouseover", () => info.updateCounty(county["properties"]))
        newOL.appendChild(newLI)
    }
    header = document.createElement('h3')
    header.innerText = `${metricText} in ${region}: ${totalCases}`
    dataDiv.append(header,  newOL)

}

function getSidebarData(){
    let curState = window.curState
    let curLayer = window.curLayer
    let allData = curLayer === "States" ? stateData["features"]:countyData["features"]
    //if we've selected a current state, filter to only show data from that state
    if(curState){
        let filt = filterByProp("statename", curState)
        allData = allData.filter(filt)
    }
    return allData
}

function updateSidebar(){
    let dataDiv = document.querySelector(".data")
    dataDiv.innerHTML = ''
    window.curLayer === "States"?
        populateSidebarState(dataDiv)
        :populateSidebarCounty(dataDiv)
}

function sortByProp(prop, descending=true){
    return descending ?
           ((a, b) => a["properties"][prop] > b["properties"][prop] ? -1 : 1)
           :((a, b) => a["properties"][prop] > b["properties"][prop] ? 1 : -1)
}


function filterByProp(prop, value){
    return (item) => item["properties"][prop] == value
}

//On page load
window.curLayer = "States"
window.curState = null
initSidebarControls()
updateSidebar()
//On layer change
map.on('baselayerchange', function (e) {
    window.curLayer = e.name
    initSidebarControls()
    updateSidebar()
});

