function getBlankChart(width=350, height=250){
    let chart = document.createElement('canvas')
    chart.width = width
    chart.height = height
    return chart
}

function updateCharts(statename=null, countyID=null){
    let visualDiv = document.querySelector(".visualizations")
    let chartDiv = document.querySelector(".chart_container")
    chartDiv.innerHTML = ""

    // let resetButton = getResetButton()
    // visualDiv.append(resetButton)
    
    
    countyID = countyID || window.curCounty
    statename = statename || window.curState

    let header = document.createElement('h2')
    let chart_cases = getBlankChart()
    let chart_deaths = getBlankChart()
    if(countyID){
        let props = getCounty(countyID)["properties"]
        header.innerText = `${props["name"]} County, ${props["statename"]}`
        fillChart(chart_cases, props["time_series"], ["cases"])
        fillChart(chart_deaths, props["time_series"], ["deaths"])
        chartDiv.append(header, chart_cases, chart_deaths)
    }
    else if(statename){
        let state = getStateFromName(statename)
        let props = state["properties"]
        header.innerText = `${props["statename"]}`
        fillChart(chart_cases, props["time_series"], ["cases"])
        fillChart(chart_deaths, props["time_series"], ["deaths"])
        let chart_tests = getBlankChart()
        fillChart(chart_tests, props["time_series"], ["test_total"])
        chartDiv.append(header, chart_cases, chart_deaths, chart_tests)
    }
    else{
        header.innerText = 'Please click or hover on a state or county to see visualizations'
        chartDiv.append(header)
    }
}

function getDailyChangeData(data){
    var dailyChange = [0];
    for (var i = 1; i < data.length; i++){
        dailyChange.push(data[i] - data[i - 1])
    }
    return dailyChange
}

function fillChart(chart, time_series, props, days=7){
    add_options = {
        "cases":{
            backgroundColor: "#36A2EB",
            borderColor: "#36A2EB",
            label: "Total Cases",
        },
        "deaths":{
            backgroundColor: "#FF6384",
            borderColor: "#FF6384",
            label: "Total Deaths"
        },
        "test_total":{
            backgroundColor: "#218F2A",
            borderColor: "#218F2A",
            label: "Total Tests"
        },
        "cases_dc":{
            backgroundColor: "#36A2EB",
            borderColor: "#36A2EB",
            label: "New Cases Per Day",
        },
        "deaths_dc":{
            backgroundColor: "#FF6384",
            borderColor: "#FF6384",
            label: "Deaths per day"
        },
        "test_total_dc":{
            backgroundColor: "#218F2A",
            borderColor: "#218F2A",
            label: "Tests per day"
        },
    }
    
    datasets = []
    let labels
    for(let prop of props){
        labels = []
        let data = []
        for(let date of Object.keys(time_series)){
            labels.push(date)
            data.push(time_series[date][prop])
        }
        datasets.push({
            data:data,//.slice(-days),
            fill:false,
            ...add_options[prop]
        })
        let dailyChangeData = getDailyChangeData(data)
        datasets.push({
            data:dailyChangeData,//.slice(-days),
            type:"bar",
            fill:false,
            steppedLine:true,
            ...add_options[prop+"_dc"]
        })
    }
    var myChart = new Chart(chart, {
        type: 'line',
        data: {
            labels: labels,//.slice(-days),
            datasets: datasets
        },
        options: {
            responsive: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            // legend: {
            //     onClick: function(event, legendItem){
            //         for(let dataset of datasets){
            //             if(dataset.label === legendItem.text){
            //                 dataset.hidden = false
            //             }
            //             else{
            //                 dataset.hidden = true
            //             }
            //         }
            //         myChart.update()
            //     }
            // },
        }
    });
    
}