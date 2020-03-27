// function replaceData(chart, label, data) {
//     chart.data.labels.pop();
//     chart.data.datasets.forEach((dataset) => {
//         dataset.data.pop();
//     });

//     chart.data.labels.push(label);
//     chart.data.datasets.forEach((dataset) => {
//         dataset.data.push(data);
//     });
//     chart.update();
// }

function destroyCharts(){
    for(let c of Object.keys(Chart.instances)){
        Chart.instances[c].destroy()
    }
}

function getCheckbox(name, labelText){
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = name;
    checkbox.id = name;
    checkbox.onclick = (e) => updateCharts()

    var label = document.createElement(label)
    label.htmlFor = name;
    label.appendChild(document.createTextNode(labelText));
    return [checkbox, label]
}

function updateCharts(statename=null, countyID=null){
    let infoDiv = document.querySelector(".infographic")
    infoDiv.innerHTML = ""
    let resetDiv = document.querySelector(".viz-reset")
    let chartCases = document.querySelector("#canvas-cases")
    let chartDeaths = document.querySelector("#canvas-deaths")
    let chartTests = document.querySelector("#canvas-tests")

    if(resetDiv.innerHTML === ""){
        let resetButton = getResetButton()
        resetDiv.append(resetButton)
        let [perCapitaCheckbox, perCapitaLabel] = getCheckbox("perCapitaCheckbox", "Show Per Capita")
        resetDiv.append(perCapitaCheckbox, perCapitaLabel)
    }

    let chartDiv = document.querySelector(".chart_container")

    countyID = countyID || window.curCounty
    statename = statename || window.curState
    console.log("statename", statename)
    let header = document.createElement('h2')
    let chart_cases = chartCases
    let chart_deaths = chartDeaths
    if(countyID){
        destroyCharts()
        let props = getCounty(countyID)["properties"]
        let pop = props["population"]
        header.innerText = `${props["name"]} County, ${props["statename"]}`
        fillChart(chart_cases, props["time_series"], ["cases"], pop)
        fillChart(chart_deaths, props["time_series"], ["deaths"], pop)
        //chartDiv.append(header, chart_cases, chart_deaths)
    }
    else if(statename){
        let state = getStateFromName(statename)
        let props = state["properties"]
        let pop = props["population"]
        header.innerText = `${props["statename"]}`
        console.log(Chart.instances)
        fillChart(chart_cases, props["time_series"], ["cases"], pop)
        fillChart(chart_deaths, props["time_series"], ["deaths"], pop)
        let chart_tests = chartTests
        fillChart(chart_tests, props["time_series"], ["test_total"], pop)
        //chartDiv.append(header, chart_cases, chart_deaths, chart_tests)
    }
    else{
        header.innerText = 'Please click or hover on a state or county to see visualizations'
        destroyCharts()
        
    }
    infoDiv.append(header)
}

function getDailyChangeData(data){
    var dailyChange = [0];
    for (var i = 1; i < data.length; i++){
        dailyChange.push(data[i] - data[i - 1])
    }
    return dailyChange
}

function getTicksSettings(propname, pop, perCapita){
    let precision = perCapita? 2:0
    let suggestedMaxes = perCapita ?
                        {
                            "cases":20,
                            "deaths":1,
                            "tests":1000,
                        }
                        :
                        {
                            "cases":Math.floor(pop/(100000/20)),
                            "deaths":5,
                            "tests":Math.floor(pop/100),
                        }
    return {
        min: 0,
        beginAtZero: true,
        precision: precision,
        suggestedMax: suggestedMaxes[propname],
    }
}

function fillChart(chart, time_series, propname, pop,days=14){
    let perCapita=document.querySelector("#perCapitaCheckbox").checked
    add_options = {
        "cases":{
            backgroundColor: "#36A2EB",
            borderColor: "#36A2EB",
            label: "Cases",
        },
        "deaths":{
            backgroundColor: "#FF6384",
            borderColor: "#FF6384",
            label: "Deaths"
        },
        "test_total":{
            backgroundColor: "#218F2A",
            borderColor: "#218F2A",
            label: "Tests"
        },
        "cases_dc":{
            backgroundColor: "#9ecae1",
            borderColor: "#9ecae1",
            label: "New Cases Per Day",
        },
        "deaths_dc":{
            backgroundColor: "#fa9fb5",
            borderColor: "#fa9fb5",
            label: "Deaths per day"
        },
        "test_total_dc":{
            backgroundColor: "#99d8c9",
            borderColor: "#99d8c9",
            label: "Tests per day"
        },
    }
    
    datasets = []
    let labels = []
    let data = []
    dates = Object.keys(time_series).sort(sortByDate)        
    for(let date of dates){
        labels.push(date)
        let dataPoint = time_series[date][propname]
        dataPoint = perCapita ? dataPoint/(pop/100000) : dataPoint
        data.push(dataPoint)
    }
    datasets.push({
        data:data.slice(-days),
        fill:false,
        ...add_options[propname]
    })
    let dailyChangeData = getDailyChangeData(data)
    datasets.push({
        data:dailyChangeData.slice(-days),
        type:"bar",
        fill:false,
        steppedLine:true,
        ...add_options[propname+"_dc"]
    })
    var myChart = new Chart(chart, {
        type: 'line',
        data: {
            labels: labels.slice(-days),
            datasets: datasets
        },
        options: {
            responsive: false,
            scales: {
                yAxes: [{
                    ticks: getTicksSettings(propname, pop, perCapita),
                    scaleLabel: {
                        display: true,
                        labelString: add_options[propname].label + (perCapita ? ` per capita`:""),
                      }
                }],
            
            },
        }
    });
    
}