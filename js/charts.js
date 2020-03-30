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

function updateInfographic(){

}

function updateChart(chart, props, propName, level, days=14){
    console.log(props)
    let perCapita = document.querySelector("#perCapitaCheckbox").checked
    let [datasets, labels] = getTimeData(props["time_series"], propName, perCapita, props["population"], days)
    let options = getChartOptions(perCapita, level, propName)
    fillChart(chart, datasets, labels, options)
}

function initResetDiv(){
    let resetDiv = document.querySelector(".viz-reset")
    if(resetDiv.innerHTML === ""){
        let resetButton = getResetButton()
        resetDiv.append(resetButton)
        let [perCapitaCheckbox, perCapitaLabel] = getCheckbox("perCapitaCheckbox", "Show Per Capita")
        resetDiv.append(perCapitaCheckbox, perCapitaLabel)
    }
}

function setVizHeader(headerText){
    let headerDiv = document.querySelector(".viz-header")
    headerDiv.innerHTML = ""
    let header = document.createElement('h2')
    header.innerText = headerText
    headerDiv.append(header)
}

function updateCharts(statename=null, countyID=null){
    //let infoDiv = document.querySelector(".infographic")
    //infoDiv.innerHTML = ""
    initResetDiv()
    let chartCases = document.querySelector("#canvas-cases")
    //let chartDeaths = document.querySelector("#canvas-deaths")
    //let chartTests = document.querySelector("#canvas-tests")

    

    let chartDiv = document.querySelector(".chart_container")

    countyID = countyID || window.curCounty
    statename = statename || window.curState
    
    let chart_cases = chartCases
    //let chart_deaths = chartDeaths
    if(countyID){
        destroyCharts()
        let props = getCounty(countyID)["properties"]
        let pop = props["population"]
        setVizHeader(`${props["name"]} County, ${props["statename"]}`)
        updateChart(chart_cases, props, "cases", "county")
        //updateChart(chart_deaths, props, "deaths", "county")
    }
    else if(statename){
        let state = getStateFromName(statename)
        let props = state["properties"]
        let pop = props["population"]
        setVizHeader(`${props["statename"]}`)
        updateChart(chart_cases, props, "cases", "state")
        //updateChart(chart_deaths, props, "deaths", "state")
        //let chart_tests = chartTests
        //updateChart(chart_tests, props, "test_total", "state")
    }
    else{
        setVizHeader('Please click or hover on a state or county to see visualizations')
        destroyCharts()
        
    }
    // note = document.createElement('p')
    // note.classList.add("discrepancy")
    // note.innerText = "Please be aware the numbers on the Y-Axis change when you move between locations."
    // infoDiv.append(header, note)
}

function getDailyChangeData(data){
    var dailyChange = [0];
    for (var i = 1; i < data.length; i++){
        dailyChange.push(data[i] - data[i - 1])
    }
    return dailyChange
}

let suggestedMaxes = {
    true:{
            "county":
                {    
                    "cases":20,
                    "deaths":1,
                },
            "state":
                {
                    "cases":20,
                    "deaths":1,
                    "test_total":1000,
                },
         },
    false:{
            "county":
            {    
                "cases":25,
                "deaths":5,
            },
            "state":
            {
                "cases":500,
                "deaths":25,
                "test_total":1000,
            }
        },
    }

let add_options = {
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

function getTimeData(timeSeries, propName, perCapita, pop, days){
    let labels= []
    let datasets = []
    let data = []
    dates = Object.keys(timeSeries).sort(sortByDate)   
    for(let date of dates){
        labels.push(date)
        let dataPoint = timeSeries[date][propName]
        dataPoint = perCapita ? dataPoint/(pop/100000) : dataPoint
        data.push(dataPoint)
    }
    labels = labels.slice(-days, -1),
    datasets.push({
        data:data.slice(-days, -1),
        fill:false,
        ...add_options[propName]
    })
    let dailyChangeData = getDailyChangeData(data)
    datasets.push({
        data:dailyChangeData.slice(-days, -1),
        type:"bar",
        fill:false,
        steppedLine:true,
        ...add_options[propName+"_dc"]
    })
    return [datasets, labels]
}

function getChartOptions(perCapita, level, propName){
    return {
        responsive: false,
        scales: {
            yAxes: [{
                ticks: {
                    min: 0,
                    beginAtZero: true,
                    precision: perCapita?2:0,
                    suggestedMax: suggestedMaxes[perCapita][level][propName],
                },
                scaleLabel: {
                    display: true,
                    labelString: add_options[propName].label + (perCapita ? ` per 100,000 residents`:""),
                  }
            }],
        },
    }
}

function fillChart(ctx, datasets, labels, options){
    
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: options
    });
    
}

