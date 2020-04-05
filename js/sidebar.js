var sidebar = L.control.sidebar({container:'sidebar'})
            .addTo(map)
            .open('infographic-tab');

//Set events on tab change
sidebar.on('content', function(e) {
    let tabName = e.id
    if(tabName === "infographic-tab"){
        updateInfographic()
    }
    if(tabName === "visualize-tab"){
        updateVisualize()
    }
    else if(tabName === "list-tab"){
        updateList()
    }
})

function getBackToStateButton(stateName, curStateLayer) {
    let backToStateButton = document.createElement('input')
    backToStateButton.type = "button"
    backToStateButton.value = `Back to ${stateName}`
    backToStateButton.classList.add("btn", "btn-primary") 
    backToStateButton.onclick = function(){
        window.curState = stateName
        window.curCounty = null;
        zoomToFeature(curStateLayer, padding=[100,100])
        updateList()
    }
    return backToStateButton
}

function getActiveTab(){
    let tabNames = ['infographic', 'visualize', 'list', 'method', 'about']
    for (let tabName of tabNames){
        if(isActiveTab(tabName)){
            return tabName
        }
    }
    return null
}

function isSidebarOpen(){
    const sidebar = document.querySelector('#sidebar')
    return !sidebar.classList.contains('collapsed')
}

function openSidebar(){
    const sidebar = document.querySelector('#sidebar')
    sidebar.classList.remove('collapsed')
}

function closeSidebar(){
    const sidebar = document.querySelector('#sidebar')
    sidebar.classList.add('collapsed')
}

//Only called for hover events
function updateSidebarOnHover(statename=null, countyID=null){
    let activeTab = getActiveTab()
    if(activeTab === "infographic" || activeTab === null){
        updateInfographic(statename, countyID)
    }
    else if(activeTab === "visualize"){
        updateVisualize(statename, countyID)
    }
}


function visualize(statename=null, countyID=null){
    let infoDiv = document.querySelector(".visualize-header")
    infoDiv.innerHTML = ""
    let chartCases = document.querySelector("#canvas-cases")
    let chartDeaths = document.querySelector("#canvas-deaths")
    let chartTests = document.querySelector("#canvas-tests")
    let chartDiv = document.querySelector(".visualize-data")

    countyID = countyID || window.curCounty
    statename = statename || window.curState
    
    let chart_cases = chartCases
    let chart_deaths = chartDeaths
    if(countyID){
        destroyCharts()
        let props = getCounty(countyID)["properties"]
        let pop = props["population"]
        setVisualizationHeader(`${props["name"]} County, ${props["statename"]}`)
        updateChart(chart_cases, props, "cases", "county")
        updateChart(chart_deaths, props, "deaths", "county")
    }
    else if(statename){
        let state = getStateFromName(statename)
        let props = state["properties"]
        let pop = props["population"]
        setVisualizationHeader(`${props["statename"]}`)
        updateChart(chart_cases, props, "cases", "state")
        updateChart(chart_deaths, props, "deaths", "state")
        let chart_tests = chartTests
        updateChart(chart_tests, props, "test_total", "state")
    }
    else{
        setVisualizationHeader('Please click or hover ')
        destroyCharts()
    }
    note = document.createElement('p')
    note.classList.add("discrepancy")
    note.innerText = "Please be aware the numbers on the Y-Axis change when you move between locations."
    infoDiv.append(note)
}

if(mobileCheck()){
    console.log("hey")
    closeSidebar()
}

