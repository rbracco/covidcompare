initVisualizationControls()
updateVisualize()

function initVisualizationControls(){
    let resetDiv = document.querySelector(".visualize-controls")
    if(resetDiv.innerHTML === ""){
        let resetButton = getResetButton()
        resetDiv.append(resetButton)
        let [perCapitaCheckbox, perCapitaLabel] = getCheckbox("perCapitaCheckbox", "Show Per Capita")
        resetDiv.append(perCapitaCheckbox, perCapitaLabel)
    }
}

function setVisualizationHeader(headerText){
    let headerDiv = document.querySelector(".visualize-header")
    headerDiv.innerHTML = ""
    let header = document.createElement('h2')
    header.innerText = headerText
    headerDiv.append(header)
}

function updateVisualize(statename=null, countyID=null){
    // countyID = countyID || window.curCounty
    // statename = statename || window.curState
    countyID = window.curCounty || window.clickCounty
    statename = window.curState || window.clickState
    if(countyID){
        visualizeCounty(countyID)
    }
    else if(statename){
        visualizeState(statename)
    }
    else{
        visualizeDefault()
    }

}

function getChartCanvases(){
    return {
    "chartCases":document.querySelector("#canvas-cases"),
    "chartDeaths":document.querySelector("#canvas-deaths"),
    "chartTests":document.querySelector("#canvas-tests"),
    }
}

    // note = document.createElement('p')
    // note.classList.add("discrepancy")
    // note.innerText = "Please be aware the numbers on the Y-Axis change when you move between locations."
    // infoDiv.append(note)


function visualizeState(statename){
    let {chartCases, chartDeaths, chartTests} = getChartCanvases()
    let state = getStateFromName(statename)
    let props = state["properties"]
    setVisualizationHeader(`${props["statename"]}`)
    updateChart(chartCases, props, "cases", "state")
    updateChart(chartDeaths, props, "deaths", "state")
    let chart_tests = chartTests
    updateChart(chartTests, props, "test_total", "state")

    
}

function visualizeCounty(countyID){
    let {chartCases, chartDeaths, chartTests} = getChartCanvases()
    destroyCharts()
    let props = getCounty(countyID)["properties"]
    setVisualizationHeader(`${props["name"]} County, ${props["statename"]}`)
    updateChart(chartCases, props, "cases", "county")
    updateChart(chartDeaths, props, "deaths", "county")
}

function visualizeDefault(){
    destroyCharts()
    setVisualizationHeader('Please click or hover ')
}

