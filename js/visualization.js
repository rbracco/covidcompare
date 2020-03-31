function initResetDiv(){
    let resetDiv = document.querySelector(".charts-reset")
    if(resetDiv.innerHTML === ""){
        let resetButton = getResetButton()
        resetDiv.append(resetButton)
        let [perCapitaCheckbox, perCapitaLabel] = getCheckbox("perCapitaCheckbox", "Show Per Capita")
        resetDiv.append(perCapitaCheckbox, perCapitaLabel)
    }
}

function setinfoHeader(headerText){
    let headerDiv = document.querySelector(".charts-header")
    headerDiv.innerHTML = ""
    let header = document.createElement('h2')
    header.innerText = headerText
    headerDiv.append(header)
}

function visualize(statename=null, countyID=null){
    let infoDiv = document.querySelector(".infographic")
    infoDiv.innerHTML = ""
    initResetDiv()
    let chartCases = document.querySelector("#canvas-cases")
    let chartDeaths = document.querySelector("#canvas-deaths")
    let chartTests = document.querySelector("#canvas-tests")
    let chartDiv = document.querySelector(".charts-container")

    countyID = countyID || window.curCounty
    statename = statename || window.curState
    
    let chart_cases = chartCases
    let chart_deaths = chartDeaths
    if(countyID){
        destroyCharts()
        let props = getCounty(countyID)["properties"]
        let pop = props["population"]
        setinfoHeader(`${props["name"]} County, ${props["statename"]}`)
        updateChart(chart_cases, props, "cases", "county")
        updateChart(chart_deaths, props, "deaths", "county")
    }
    else if(statename){
        let state = getStateFromName(statename)
        let props = state["properties"]
        let pop = props["population"]
        setinfoHeader(`${props["statename"]}`)
        updateChart(chart_cases, props, "cases", "state")
        updateChart(chart_deaths, props, "deaths", "state")
        let chart_tests = chartTests
        updateChart(chart_tests, props, "test_total", "state")
    }
    else{
        setinfoHeader('Please click or hover ')
        destroyCharts()
        
    }
    note = document.createElement('p')
    note.classList.add("discrepancy")
    note.innerText = "Please be aware the numbers on the Y-Axis change when you move between locations."
    infoDiv.append(header, note)
}