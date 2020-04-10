App.prototype.addVisualizations = function(options) {
    const app = this;  

    app.initVisualizationControls = function(){
        const { getCheckbox } = app;

        let resetDiv = document.querySelector(".visualize-controls")
        if(resetDiv.innerHTML === ""){
            let resetButton = app.getResetButton()
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
    
    app.updateVisualize = function(){
        countyID = window.hoverCounty || window.clickCounty
        statename = window.hoverState || window.clickState
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
    
    app.getChartCanvases = function(){
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
        const { getStateFromName, updateChart, getChartCanvases} = app;
        let {canvasCases, canvasDeaths, canvasTests} = getChartCanvases()
        let state = getStateFromName(statename)
        let props = state["properties"]
        app.destroyCharts()
        setVisualizationHeader(`${props["statename"]}`)
        updateChart(canvasCases, props, "cases", "state")
        updateChart(canvasDeaths, props, "deaths", "state")
        updateChart(canvasTests, props, "test_total", "state")        
    }
    
    function visualizeCounty(countyID){
        const { updateChart } = app;
        const { getChartCanvases } = app;
        let {canvasCases, canvasDeaths, canvasTests} = getChartCanvases()
        app.destroyCharts()
        let props = app.getCounty(countyID)["properties"]
        setVisualizationHeader(`${props["name"]} County, ${props["statename"]}`)
        let chartCases = updateChart(canvasCases, props, "cases", "county")
        let chartDeaths = updateChart(canvasDeaths, props, "deaths", "county")
    }
    
    function visualizeDefault(){
        const { getChartCanvases, updateChart } = app;
        let {canvasCases, canvasDeaths, canvasTests} = getChartCanvases()
        app.destroyCharts()
        let props = USData["properties"]
        setVisualizationHeader(`United States: Hover on a state`)
        updateChart(canvasCases, props, "cases", "state")
        updateChart(canvasDeaths, props, "deaths", "state")
        updateChart(canvasTests, props, "test_total", "state")        
    }  

    app.getCheckbox = function(name, labelText){
        const { updateVisualize } = app;
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = name;
        checkbox.id = name;
        checkbox.onclick = (e) => updateVisualize()
    
        var label = document.createElement(label)
        label.htmlFor = name;
        label.appendChild(document.createTextNode(labelText));
        return [checkbox, label]
    }    
    
    app.initVisualizationControls()
    app.updateVisualize()    
}