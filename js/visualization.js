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
    header.innerHTML = headerText
    headerDiv.append(header)
}

function updateVisualize(){
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
    "canvasCases":document.querySelector("#canvas-cases"),
    "canvasDeaths":document.querySelector("#canvas-deaths"),
    "canvasTests":document.querySelector("#canvas-tests"),
    }
}

    // note = document.createElement('p')
    // note.classList.add("discrepancy")
    // note.innerText = "Please be aware the numbers on the Y-Axis change when you move between locations."
    // infoDiv.append(note)


function visualizeState(statename){
    let {canvasCases, canvasDeaths, canvasTests} = getChartCanvases()
    let state = getStateFromName(statename)
    let props = state["properties"]
    setVisualizationHeader(`${props["statename"]}`)
    updateChart(canvasCases, props, "cases", "state")
    updateChart(canvasDeaths, props, "deaths", "state")
    updateChart(canvasTests, props, "test_total", "state")
}

function visualizeCounty(countyID){
    let {canvasCases, canvasDeaths, canvasTests} = getChartCanvases()
    destroyCharts()
    let props = getCounty(countyID)["properties"]
    setVisualizationHeader(`${props["name"]} County, ${props["statename"]}`)
    let chartCases = updateChart(canvasCases, props, "cases", "county")
    let chartDeaths = updateChart(canvasDeaths, props, "deaths", "county")
}

function visualizeDefault(){
    let {canvasCases, canvasDeaths, canvasTests} = getChartCanvases()
    destroyCharts()
    let props = USData["properties"]
    setVisualizationHeader(`United States: Hover on a state`)
    updateChart(canvasCases, props, "cases", "state")
    updateChart(canvasDeaths, props, "deaths", "state")
    updateChart(canvasTests, props, "test_total", "state")
}

// inside visualize county
// for(let bookmark of bookmarks._data){
//     if(bookmark.county){
//         console.log("Inside", bookmark)
//         let newCounty = getCounty(bookmark.county)
//         console.log("new", newCounty)
//         addToChart(chartCases, newCounty["properties"], "cases", "county")
//     }
//     console.log("bookmarksss", bookmark)
// }