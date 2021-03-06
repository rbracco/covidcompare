App.prototype.addList = function(options) {
    const app = this;  
    
    function initListControls(){
        const {initSelectMenu, getResetButton} = app;
        let controlsDiv = document.querySelector(".list-controls")
        let resetButton = getResetButton()
        let selectMenu = initSelectMenu("sidebarSelect")
        controlsDiv.innerHTML = ""
        controlsDiv.append(selectMenu, resetButton)
    }
    
    app.updateList = function(){
        countyID = window.hoverCounty || window.clickCounty
        statename = window.hoverState || window.clickState
        let dataDiv = document.querySelector(".list-data")
        dataDiv.children = []
        dataDiv.innerHTML = ""
        if(countyID){
            populateListDetailed(dataDiv)
        }
        else if(statename){
            populateListCounty(dataDiv)
        }
        else{
            populateListState(dataDiv)
        }
    }
    
    function populateListState(dataDiv){
        const {highlightState, resetHighlightState, zoomToCounties, getListData} = app;
        let totalCases = 0
        let data = getListData()
        let region = window.hoverState ? window.hoverState:"United States"
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
            let curLayer = app.convertStateIDToLayer([state["id"]])
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
        const {getListData, highlightCounty, resetHighlightCounty, displayDetailed} = app;
        let totalCases = 0
        let data = getListData()
        let hoverState = window.hoverState || window.clickState
        let region = hoverState ? hoverState:"United States"
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
            let curLayer = app.convertCountyIDToLayer(countyID)
            newLI.innerHTML = `<a>${name}, ${statename}</a> ${curMetric}  ${metricText}`
            newLI.addEventListener("mouseover", (e) => highlightCounty(curLayer))
            newLI.addEventListener("mouseout", (e) => resetHighlightCounty(curLayer))
            newLI.addEventListener("click", (e) => displayDetailed(curLayer, padding=[100,100]))
            //newLI.addEventListener("mouseover", () => info.updateCounty(county["properties"]))
            newOL.appendChild(newLI)
        }
        if(hoverState && ["cases", "deaths"].includes(metric)){
            let curMetric = getUnassigned(hoverState, metric)
            if(curMetric){
                let newLI = document.createElement('li')
                newLI.innerHTML = `<strong>Unassigned</strong>, ${hoverState} ${curMetric} ${metricText}`
                newOL.appendChild(newLI)
                totalCases += curMetric
            }
        }
    
        let stateID = data[0]["properties"]["state"]    
        let props = app.getState(stateID)["properties"]
        let countyHeader = document.createElement('h3')
        countyHeader.innerText = `${metricText} in ${region}: ${totalCases}`
        dataDiv.append(countyHeader, newOL)
        
    }
    
    function populateListDetailed(dataDiv){
        const {getBackToStateButton} = app
        let countyID = window.hoverCounty || window.clickCounty
        let props = app.getCounty(countyID)["properties"]
        let {name, statename, stateabbr, cases, state:stateID, } = props
        hoverStateLayer = app.convertStateIDToLayer(stateID)
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
        let backToStateButton = getBackToStateButton(statename, hoverStateLayer)
    
        dataDiv.append(detailHeader,backToStateButton, content)
    }
    
    app.getListData = function(){
        let hoverState = window.hoverState || window.clickState
        let curLayer = app.getCurLayer
        let allData = hoverState ? countyData["features"]:stateData["features"]
        //if we've selected a current state, filter to only show data from that state
        if(hoverState){
            let filt = filterByProp("statename", hoverState)
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

    initListControls()
    app.updateList()    
}