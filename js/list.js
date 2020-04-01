initListControls()
updateList()

function initListControls(){
    let controlsDiv = document.querySelector(".list-controls")
    let resetButton = getResetButton()
    let selectMenu = initSelectMenu("sidebarSelect")
    controlsDiv.innerHTML = ""
    controlsDiv.append(selectMenu, resetButton)
}

function updateList(){
    let dataDiv = document.querySelector(".list-data")
    dataDiv.children = []
    dataDiv.innerHTML = ""
    if(window.curCounty){
        populateListDetailed(dataDiv)
    }
    else if(window.curLayer === "States"){
        populateListState(dataDiv)
    }
    else{
        populateListCounty(dataDiv)
    }
}

function populateListState(dataDiv){
    let totalCases = 0
    let data = getListData()
    let region = window.curState ? window.curState:"United States"
    let {text:metricText, value:metric} = window.curMetric
    let newOL = document.createElement('ol')
    for(let state of data.sort(sortByProp(metric))){
        let {statename, cases, lat, long} = state["properties"]
        let curMetric = state["properties"][metric]
        totalCases += curMetric
        if(["risk_total", "risk_local", "risk_nearby", "pc_cases", "pc_tests", "pc_active", "pc_deaths"].includes(metric)){
            curMetric = curMetric.toFixed(3)
            totalCases = ""
        }
        let newLI = document.createElement('li')
        
        newLI.innerHTML = `<a>${state["properties"]["statename"]}</a> - ${curMetric} ${metricText}`
        console.log(newLI)
        let curLayer = convertStateIDToLayer([state["id"]])
        newLI.addEventListener("mouseover", (e) => highlightState(curLayer));
        newLI.addEventListener("mouseout", (e) => resetHighlightState(curLayer));
        newLI.addEventListener("click", (e) => zoomToCounties(curLayer));
        newOL.appendChild(newLI)
        
    }
    let stateHeader = document.createElement('h3')
    stateHeader.innerText = `${metricText} in ${region}: ${totalCases}`
    dataDiv.append(stateHeader,  newOL)
}

function populateListCounty(dataDiv){
    let totalCases = 0
    let data = getListData()
    let curState = window.curState
    let region = curState ? curState:"United States"
    let {text:metricText, value:metric} = window.curMetric
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
    let countyHeader = document.createElement('h3')
    countyHeader.innerText = `${metricText} in ${region}: ${totalCases}`
    dataDiv.append(countyHeader, newOL)
    
}

function populateListDetailed(dataDiv){
    console.log("other")
    let countyID = window.curCounty
    let props = getCounty(countyID)["properties"]
    let {name, statename, stateabbr, cases, state:stateID, } = props
    curStateLayer = convertStateIDToLayer(stateID)
    let detailHeader = document.createElement('h2')
    detailHeader.innerText = `${name} County, ${stateabbr}`
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

    dataDiv.append(detailHeader,backToStateButton, content)
    
}

function getListData(){
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

function getUnassigned(stateName, metric) {
    if(!["cases", "deaths"].includes(metric)){
        return null;
    }
    let filt = filterByProp("statename", stateName)
    let state = stateData["features"].filter(filt)[0]
    let value = metric === "cases"? state["properties"]["unassigned_cases"]:state["properties"]["unassigned_deaths"]
    return value
}