var sidebar = L.control.sidebar({container:'sidebar'})
            .addTo(map)
            .open('info');

function getBackToStateButton(stateName, curStateLayer) {
    let backToStateButton = document.createElement('input')
    backToStateButton.type = "button"
    backToStateButton.value = `Back to ${stateName}`
    backToStateButton.classList.add("btn", "btn-primary") 
    backToStateButton.onclick = function(){
        window.curState = stateName
        window.curCounty = null;
        zoomToFeature(curStateLayer, padding=[100,100])
        updateSidebar()
    }
    return backToStateButton
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
                    //Menu Options for States
                    {
                        "Case Data":
                        {
                            "Total Cases":"cases", 
                            //"Active":"active", 
                            "Recovered":"recovered", 
                            "Deaths":"deaths",
                        },
                        "Per Capita":
                        {
                            "Cases per 100,000":"pc_cases", 
                            //"Active per 100,000":"pc_active", 
                            "Deaths per 100,000":"pc_deaths",
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
                            "Tests per 100,000":"pc_tests",
                        },
                    }
                    :
                    //Menu Options for Counties
                    {
                        "Case Data":
                        {
                            "Total Cases":"cases", 
                            "Deaths":"deaths", 
                            "Cases per 100,000":"pc_cases",
                            "Deaths per 100,000":"pc_deaths",
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
        updateLegend()
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
        if(["risk_total", "risk_local", "risk_nearby", "pc_cases", "pc_tests", "pc_active", "pc_deaths"].includes(metric)){
            curMetric = curMetric.toFixed(3)
            totalCases = ""
        }
        newLI.innerHTML = `<a>${state["properties"]["statename"]}</a> - ${curMetric} ${metricText}`
        let curLayer = convertStateIDToLayer([state["id"]])
        newLI.addEventListener("mouseover", (e) => highlightState(curLayer))
        newLI.addEventListener("mouseout", (e) => resetHighlightState(curLayer))
        newLI.addEventListener("click", (e) => zoomToCounties(curLayer))
        newOL.appendChild(newLI)
    }
    header = document.createElement('h3')
    header.innerText = `${metricText} in ${region}: ${totalCases}`
    dataDiv.append(header,  newOL)
}

function populateSidebarCounty(dataDiv){
    let totalCases = 0
    let data = getSidebarData()
    let curState = window.curState
    let region = curState ? curState:"United States"
    let {text:metricText, value:metric} = getSelectedMetric()
    let newOL = document.createElement('ol')
    for(let county of data.sort(sortByProp(metric))){
        let newLI = document.createElement('li')
        let {name, statename, cases, geo_id:countyID} = county["properties"]
        let curMetric = county["properties"][metric]
        if(curMetric <= 0){
            break
        }
        totalCases += curMetric
        if(["risk_total", "risk_local", "risk_nearby", "pc_cases", "pc_deaths"].includes(metric)){
            curMetric = curMetric.toFixed(3)
            totalCases = ""
        }
        let curLayer = convertCountyIDToLayer(countyID)
        newLI.innerHTML = `<a>${name}, ${statename}</a> ${curMetric}  ${metricText}`
        newLI.addEventListener("mouseover", (e) => highlightCounty(curLayer))
        newLI.addEventListener("mouseout", (e) => resetHighlightCounty(curLayer))
        newLI.addEventListener("click", (e) => displayDetailed(curLayer, padding=[100,100]))
        //newLI.addEventListener("mouseover", () => info.updateCounty(county["properties"]))
        newOL.appendChild(newLI)
    }
    if(curState && ["cases", "deaths"].includes(metric)){
        let curMetric = getUnassigned(curState, metric)
        if(curMetric){
            let newLI = document.createElement('li')
            newLI.innerHTML = `<strong>Unassigned</strong>, ${curState} ${curMetric} ${metricText}`
            newOL.appendChild(newLI)
            totalCases += curMetric
        }
    }

    let stateID = data[0]["properties"]["state"]
    let props = getState(stateID)["properties"]
    header = document.createElement('h3')
    header.innerText = `${metricText} in ${region}: ${totalCases}`
    dataDiv.append(header, newOL)
}

function populateSidebarDetailed(dataDiv){
    let countyID = window.curCounty
    let props = getCounty(countyID)["properties"]
    let {name, statename, stateabbr, cases, state:stateID, } = props
    curStateLayer = convertStateIDToLayer(stateID)
    header = document.createElement('h2')
    header.innerText = `${name} County, ${stateabbr}`
    header2 = document.createElement('h4')
    header2.innerText = `Lots of new stuff will be posted here in the next few days including time trends, growth rates, county health data, ICU capacity and more.`
    header2.style.color = "blue"
    let content = document.createElement('div')
    let note =  props.notes? `<span class="timestamp">${props.notes}</span><br/>`:``
    let body =`<br/><b>Covid19 Cases</b><br/>
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
    content.innerHTML = body
    let backToStateButton = getBackToStateButton(statename, curStateLayer)

    dataDiv.append(header,backToStateButton, content)
    
}


function getUnassigned(stateName, metric) {
    if(!["cases", "deaths"].includes(metric)){
        return null;
    }
    let filt = filterByProp("statename", stateName)
    let state = stateData["features"].filter(filt)[0]
    let value = metric === "cases"? state["properties"]["unassigned_cases"]:state["properties"]["unassigned_deaths"]
    return value
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
    if(window.curCounty){
        populateSidebarDetailed(dataDiv)
    }
    else if(window.curLayer === "States"){
        populateSidebarState(dataDiv)
    }
    else{
        populateSidebarCounty(dataDiv)
    }
    updateCharts()
}

function sortByProp(prop, descending=true){
    return descending ?
           ((a, b) => a["properties"][prop] > b["properties"][prop] ? -1 : 1)
           :((a, b) => a["properties"][prop] > b["properties"][prop] ? 1 : -1)
}

function sortByDate(a, b){
    aPieces = a.split('-')
    bPieces = b.split('-')
    for(let i=0; i<3; i++){
        if(aPieces[i] == bPieces[i]){
            continue
        }
        return parseInt(aPieces[i]) > parseInt(bPieces[i]) ? 1 : -1
    }
}


function filterByProp(prop, value){
    return (item) => item["properties"][prop] == value
}

initSidebarControls()
updateSidebar()


