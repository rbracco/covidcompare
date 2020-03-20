window.curLayer = "States"

function getCountyCentroids(){
    let centroids = {}
    for(let feat of countyCentroids["features"]){
        centroids[feat["properties"]["GEO_ID"]] = feat["geometry"]["coordinates"]
    }
    return centroids
}

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

function zoomToFeature(e, padding) {
    map.fitBounds(e.target.getBounds(), {padding:padding});
}

function getColorsForMetric(metricValue){
    let greenScale = ['#006d2c','#31a354','#74c476','#a1d99b','#c7e9c0','#eeeeee']
    let redScale =   ['#a50f15','#de2d26','#fb6a4a','#fc9272','#fcbba1','#bbbbbb',]
    let blueScale = ['#08519c','#3182bd','#6baed6','#9ecae1','#c6dbef','#eff3ff']
    let statesScales = {
        "cases":{
            grades : [3000,1000,300,80,20,0],
            colors : redScale
        },
        "deaths":{
            grades : [100,50,25,10,3,0],
            colors : redScale
        },
        "recovered":{
            grades : [100,50,25,10,3,0],
            colors : greenScale
        },
        "risk_total":{
            grades : [30, 10, 3, 1, 0.3, 0],
            colors : redScale
        },
        "test_total":{
            grades : [10000, 5000, 2500, 1000, 500, 0],
            colors : blueScale
        },
    }
    //Add additional identical scales
    statesScales["active"] = statesScales["cases"]
    statesScales["risk_local"] = statesScales["risk_total"]
    statesScales["risk_nearby"] = statesScales["risk_total"]

    let countyScales = {
        "cases":{
            grades : [100,30,10,3,1,0],
            colors : redScale
        },
        "deaths":{
            grades : [25,10,5,2,1,0],
            colors : redScale
        },
        "risk_total":{
            grades : [30, 10, 3, 1, 0.3, 0],
            colors : redScale
        },
        "risk_nearby":{
            grades : [10, 3, 1, 0.3, 0.1, 0],
            colors : redScale
        },
    }
    countyScales["risk_local"] = countyScales["risk_total"]
    return window.curLayer === "States" ? statesScales[metricValue]:countyScales[metricValue]
}