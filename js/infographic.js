initInfographicControls()
updateInfographic()

function initInfographicControls(){
    let controlDiv = document.querySelector(".infographic-controls")
    controlDiv.append(getResetButton())
}

function setInfographicHeader(headerText){
    let headerDiv = document.querySelector(".infographic-header")
    headerDiv.innerHTML = ""
    let header = document.createElement('h2')
    header.innerText = headerText
    headerDiv.append(header)
}

function updateInfographic(statename=null, countyID=null){
    countyID = countyID || window.curCounty
    statename = statename || window.curState
    destroyCharts()
    if(countyID){
        updateInfographicCounty(countyID)
    }
    else if(statename){
        updateInfographicState(statename)
    }
    else{
        updateInfographicDefault()
    }

}

function updateInfographicCounty(countyID){
    let props = getCounty(countyID)["properties"]
    setInfographicHeader(`${props["name"]} County, ${props["statename"]}`)
    updateInfographicGraphic(props)
    let chartCases = document.querySelector('#canvas-infographic')
    
    updateChart(chartCases, props, "deaths", "county")

}

function updateInfographicState(statename){
    let state = getStateFromName(statename)
    let props = state["properties"]
    updateInfographicGraphic(props)
    let chartCases = document.querySelector('#canvas-infographic')
    setInfographicHeader(`${statename}`)
    updateChart(chartCases, props, "deaths", "state")
}

function updateInfographicDefault(){
    setInfographicHeader("United States: Hover on a state")
    //updateInfographicGraphic()
}

function displayPct(growth){
    return (100*(parseFloat(growth)-1)).toFixed(2)
}

function updateInfographicGraphic(props){
    const curLayer = window.curLayer
    let rank_total = curLayer === "States" ? stateData["features"].length:countyData["features"].length
    document.querySelector('#cases-cases-total').innerHTML = props["cases"]
    document.querySelector('#cases-cases-pc').innerHTML = props["pc_cases"].toFixed(2)
    document.querySelector('#cases-cases-rank').innerHTML = `${props["rank_cases"]}/${rank_total}`
    document.querySelector('#cases-cases-growth24h').innerHTML = displayPct(props["growth_cases24hr"])
    document.querySelector('#cases-cases-growth72h').innerHTML = displayPct(props["growth_cases72hr"])
    document.querySelector('#cases-cases-growth1w').innerHTML = displayPct(props["growth_cases1w"])

    document.querySelector('#deaths-deaths-total').innerHTML = props["deaths"]
    document.querySelector('#deaths-deaths-pc').innerHTML = props["pc_deaths"].toFixed(2)
    document.querySelector('#deaths-deaths-rank').innerHTML = `${props["rank_deaths"]}/${rank_total}`
    document.querySelector('#deaths-deaths-growth24h').innerHTML = displayPct(props["growth_deaths24hr"])
    document.querySelector('#deaths-deaths-growth72h').innerHTML = displayPct(props["growth_deaths72hr"])
    document.querySelector('#deaths-deaths-growth1w').innerHTML = displayPct(props["growth_deaths1w"])

    document.querySelector('#tests-tests-total').innerHTML = props["test_total"] || "N/A"
    document.querySelector('#tests-tests-pc').innerHTML = curLayer==="States"?props["pc_tests"].toFixed(2):"N/A"
    document.querySelector('#tests-tests-rank').innerHTML = curLayer ==="States"?`${props["rank_tests"]}/${rank_total}`:"N/A"
    document.querySelector('#tests-tests-positive').innerHTML = props["test_positive"] || "N/A"
    document.querySelector('#tests-tests-negative').innerHTML = props["test_negative"] || "N/A"
}
