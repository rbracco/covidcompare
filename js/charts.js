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

function updateChart(chart, props, propName, level, days=14){
    let perCapita = document.querySelector("#perCapitaCheckbox").checked
    let [datasets, labels] = getTimeData(props["time_series"], propName, perCapita, props["population"], days)
    let options = getChartOptions(perCapita, level, propName)
    fillChart(chart, datasets, labels, options)
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
        responsive: true,
        maintainAspectRatio:false,
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

