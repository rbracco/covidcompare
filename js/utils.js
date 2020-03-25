window.curLayer = "States"

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getSelectedMetric(){
    let base = {value:"cases", text:"Total Cases"};
    let e = document.querySelector('#metricSelect')
    if(!e){
        return base
    }
    if(e.selectedIndex === -1){
        e.selectedIndex = 1
        return base
    }
    return {
        value:e.options[e.selectedIndex].value,
        text:e.options[e.selectedIndex].text
    }
}

function getColor(props){
    let {value:metricValue, text:metricText} = getSelectedMetric()
    let val = props[metricValue]
    let {grades, colors} = getColorsForMetric(metricValue)
    if(isNaN(val)){
        return '#ffffff'
    }
    for (let i = 0; i < grades.length; i++) {
        if(val >= grades[i]){
            return colors[i]
        }
    }
    return colors.slice(-1)
}

//get the distance in kilometers between two centroids
function getDistance(c0, c1){
    let latDist = Math.abs(c0[0]-c1[0])
    let longDist = Math.abs(c0[1]-c1[1])
    return Math.sqrt(latDist*latDist + longDist*longDist) * 111
}

function isViewable(layer){
    return map.getBounds().contains(layer.getBounds().getNorthEast()) || map.getBounds().contains(layer.getBounds().getSouthWest()) 
}

function zoomToFeature(layer, padding) {
    map.fitBounds(layer.getBounds(), {padding:padding});
}

function getColorsForMetric(metricValue){
    redScale = ['#99000d','#cb181d','#ef3b2c','#fb6a4a','#fc9272','#fcbba1','#fee5d9','#abd9e9']

    //blueScale = ['#08519c','#3182bd','#6baed6','#9ecae1','#c6dbef','#fcbba1','#fb6a4a','#d73027']
    blueScale =['#084594','#2171b5','#4292c6','#6baed6','#9ecae1','#c6dbef','#deebf7','#f7fbff',]

    greenScale = ['#005a32','#238b45','#41ab5d','#74c476','#a1d99b','#c7e9c0','#e5f5e0','#f7fcf5']

    let statesScales = {
            "cases":{
                grades : [30000,10000,3000,1000,300,80,20,0],
                colors : redScale
            },
            "deaths":{
                grades : [1000,250,100,50,25,10,3,0],
                colors : redScale
            },
            "recovered":{
                grades : [1000,250,100,50,25,10,3,0],
                colors : greenScale
            },
            "risk_total":{
                grades : [300, 100, 30, 10, 3, 1, 0.3, 0],
                colors : redScale
            },
            "test_total":{
                grades : [250000, 100000, 25000, 10000, 5000, 2500, 1000, 0],
                colors : blueScale
            },
            "pc_tests":{
                grades : [5000, 1000, 500, 250, 100, 50, 25, 0],
                colors : blueScale
            },
            "pc_cases":{
                grades : [500, 250, 50, 25, 10, 5, 2, 0],
                colors : redScale
            },
            "pc_deaths":{
                grades : [5, 2.5, 1, 0.5, 0.25, 0.1, 0.05, 0],
                colors : redScale
            },
    }
    //Add additional identical scales
    statesScales["active"] = statesScales["cases"]
    statesScales["risk_local"] = statesScales["risk_total"]
    statesScales["risk_nearby"] = statesScales["risk_total"]

let countyScales = {
        "cases":{
            grades : [1000,300,100,30,10,3,1,0],
            colors : redScale
        },
        "deaths":{
            grades : [250,100,25,10,5,2,1,0],
            colors : redScale
        },
        "risk_total":{
            grades : [300, 100, 30, 10, 3, 1, 0.3, 0],
            colors : redScale
        },
        "risk_nearby":{
            grades : [100, 30, 10, 3, 1, 0.3, 0.1, 0],
            colors : redScale
        },
        "pc_cases":{
            grades : [500, 250, 50, 25, 10, 5, 2, 0],
            colors : redScale
        },
        "pc_deaths":{
            grades : [5, 2.5, 1, 0.5, 0.25, 0.1, 0.05, 0],
            colors : redScale
        },
    }
    //Add additional identical scales
    countyScales["risk_local"] = countyScales["risk_total"]
    return window.curLayer === "States" ? statesScales[metricValue]:countyScales[metricValue]
}