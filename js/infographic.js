initInfographicControls()
updateInfographic()

function initInfographicControls(){
    let controlDiv = document.querySelector(".infographic-controls")
    console.log(controlDiv)
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
    console.log("updating infographic")
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
    //updateInfographicGraphic()
    let chartCases = document.querySelector('#canvas-infographic')
    
    updateChart(chartCases, props, "cases", "county")

}

function updateInfographicState(statename){
    let state = getStateFromName(statename)
    let props = state["properties"]
    //updateInfographicGraphic()
    let chartCases = document.querySelector('#canvas-infographic')
    setInfographicHeader(`${statename}`)
    updateChart(chartCases, props, "cases", "state")
}

function updateInfographicDefault(){
    setInfographicHeader("United States: Hover on a state")
    //updateInfographicGraphic()
}

