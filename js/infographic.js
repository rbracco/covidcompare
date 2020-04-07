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

function updateInfographic(){
    countyID = window.curCounty || window.clickCounty
    statename = window.curState || window.clickState
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
    updateInfographicGraphic(USData["properties"])
}

function displayPctGrowth(growth, digits=2){
    return (100*(parseFloat(growth)-1)).toFixed(digits)
}

function displayPct(decimal, digits=2){
    return (100*parseFloat(decimal)).toFixed(digits)
}

//only apply toFixed if it's numeric, else just return
function safeToFixed(item, digits){
    return isNaN(item) ? item:item.toFixed(digits)
}

function updateInfographicGraphic(props){
    const curLayer = window.curLayer
    let rank_total = curLayer === "States" ? stateData["features"].length:countyData["features"].length
    document.querySelector('#cases-cases-total').innerHTML = numberWithCommas(props["cases"])
    document.querySelector('#cases-cases-pc').innerHTML = props["pc_cases"].toFixed(2)
    document.querySelector('#cases-cases-rank').innerHTML = isNaN(props["rank_cases"])?"(-)":`(${props["rank_cases"]}/${rank_total})`
    document.querySelector('#cases-cases-growth24h').innerHTML = displayPctGrowth(props["growth_cases24hr"])
    document.querySelector('#cases-cases-growth72h').innerHTML = displayPctGrowth(props["growth_cases72hr"])
    document.querySelector('#cases-cases-growth1w').innerHTML = displayPctGrowth(props["growth_cases1w"])

    document.querySelector('#deaths-deaths-total').innerHTML = numberWithCommas(props["deaths"])
    document.querySelector('#deaths-deaths-pc').innerHTML = props["pc_deaths"].toFixed(2)
    document.querySelector('#deaths-deaths-rank').innerHTML = isNaN(props["rank_deaths"])?"(-)":`(${props["rank_deaths"]}/${rank_total})`
    document.querySelector('#deaths-deaths-growth24h').innerHTML = displayPctGrowth(props["growth_deaths24hr"])
    document.querySelector('#deaths-deaths-growth72h').innerHTML = displayPctGrowth(props["growth_deaths72hr"])
    document.querySelector('#deaths-deaths-growth1w').innerHTML = displayPctGrowth(props["growth_deaths1w"])

    document.querySelector('#tests-tests-total').innerHTML = numberWithCommas(props["test_total"]) || "N/A"
    document.querySelector('#tests-tests-pc').innerHTML = curLayer==="States"?props["pc_tests"].toFixed(2):"N/A"
    document.querySelector('#tests-tests-rank').innerHTML = curLayer ==="States"?`(${props["rank_tests"]}/${rank_total})`:"N/A"
    document.querySelector('#tests-tests-positive').innerHTML = numberWithCommas(props["test_positive"]) || "N/A"
    document.querySelector('#tests-tests-negative').innerHTML = numberWithCommas(props["test_negative"]) || "N/A"
    document.querySelector('#tests-tests-grade').innerHTML = props["test_grade"] || "N/A"

    document.querySelector('#health-comorbid-hypertension').innerHTML = `${props["comorbid_hypertension"].toFixed(2)}%` || "No Data"
    document.querySelector('#health-comorbid-diabetes').innerHTML = `${props["comorbid_diabetes"].toFixed(2)}%` || "No Data"
    document.querySelector('#health-comorbid-obesity').innerHTML = `${props["comorbid_obesity"].toFixed(2)}%` || "No Data"
    document.querySelector('#health-comorbid-smoking').innerHTML = `${props["comorbid_smoking"].toFixed(2)}%` || "No Data"
    document.querySelector('#health-population-density').innerHTML = `${props["population_density"].toFixed(1)}/mi<sup>2</sup>` || "No Data"

    let pop = props["population"]
    document.querySelector('#resident-population').innerHTML = numberWithCommas(pop)
    let age65 = props["age65-74"]
    let age75 = props["age75-84"]
    let age85 = props["age85+"]
    let above65 = age65+age75+age85
    let above75 = age75+age85
    let above85 = age85
    document.querySelector('#resident-age-65').innerHTML = `${numberWithCommas(above65)} (${displayPct(above65/pop, digits=1)}%)`
    document.querySelector('#resident-age-75').innerHTML = `${numberWithCommas(above75)} (${displayPct(above75/pop, digits=1)}%)`
    document.querySelector('#resident-age-85').innerHTML = `${numberWithCommas(above85)} (${displayPct(above85/pop, digits=1)}%)`
    
    document.querySelector('#risk-risk-total').innerHTML = numberWithCommas(safeToFixed(props["risk_total"], 2))
    document.querySelector('#risk-risk-local').innerHTML = numberWithCommas(safeToFixed(props["risk_local"], 2))
    document.querySelector('#risk-risk-nearby').innerHTML = numberWithCommas(safeToFixed(props["risk_nearby"], 2))

}

function resetInfographicGraphic(){
    datapoints = document.querySelectorAll('.datapoint')
    for(let datapoint of datapoints){
        datapoint.innerHTML = '-'
    }
}