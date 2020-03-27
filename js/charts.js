function getBlankChart(width=350, height=250){
    let chart = document.createElement('canvas')
    chart.width = width
    chart.height = height
    return chart
}

function replaceData(chart, label, data) {
    console.log("REPLACING")
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });

    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function destroyCharts(){
    console.log("Destroying")
    for(let c of Object.keys(Chart.instances)){
        Chart.instances[c].destroy()
    }
}

function updateCharts(statename=null, countyID=null){
    let infoDiv = document.querySelector(".infographic")
    infoDiv.innerHTML = ""
    let resetDiv = document.querySelector(".viz-reset")
    let chartCases = document.querySelector("#canvas-cases")
    let chartDeaths = document.querySelector("#canvas-deaths")
    let chartTests = document.querySelector("#canvas-tests")
    
    let resetButton = getResetButton()
    resetDiv.innerHTML = ""
    resetDiv.append(resetButton)
    let chartDiv = document.querySelector(".chart_container")

    countyID = countyID || window.curCounty
    statename = statename || window.curState

    let header = document.createElement('h2')
    let chart_cases = chartCases
    let chart_deaths = chartDeaths
    if(countyID){
        destroyCharts()
        let props = getCounty(countyID)["properties"]
        let pop = props["population"]
        header.innerText = `${props["name"]} County, ${props["statename"]}`
        fillChart(chart_cases, props["time_series"], ["cases"], pop, suggestedMax=20)
        fillChart(chart_deaths, props["time_series"], ["deaths"], pop, suggestedMax=5)
        //chartDiv.append(header, chart_cases, chart_deaths)
    }
    else if(statename){
        let state = getStateFromName(statename)
        let props = state["properties"]
        let pop = props["population"]
        header.innerText = `${props["statename"]}`
        console.log(Chart.instances)
        fillChart(chart_cases, props["time_series"], ["cases"], pop, suggestedMax=250)
        fillChart(chart_deaths, props["time_series"], ["deaths"], pop, suggestedMax=20)
        let chart_tests = chartTests
        fillChart(chart_tests, props["time_series"], ["test_total"], pop, suggestedMax=10000)
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

function fillChart(chart, time_series, props, pop, suggestedMax=25,days=14){
    let per_capita=true
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
        dates = Object.keys(time_series).sort(sortByDate)        
        for(let date of dates){
            labels.push(date)
            if(per_capita){
                let percap = (time_series[date][prop])/(pop/100000)
                console.log(percap)
                data.push(percap)
            }
            else{
                data.push(time_series[date][prop])
            }
        }
        datasets.push({
            data:data.slice(-days),
            fill:false,
            ...add_options[prop]
        })
        let dailyChangeData = getDailyChangeData(data)
        datasets.push({
            data:dailyChangeData.slice(-days),
            type:"bar",
            fill:false,
            steppedLine:true,
            ...add_options[prop+"_dc"]
        })
    }
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
                    ticks: {
                        min: 0,
                        beginAtZero: true,
                        precision: 0,
                        suggestedMax: suggestedMax,
                    },
                    
                }],
            
            },
        }
    });
    
}