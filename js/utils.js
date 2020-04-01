window.curLayer = "States"

function mobileCheck () {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function enableDisableOptions(){
    let toggleOptions = ["test_total", "pc_tests"]
    let selectMenus = document.querySelectorAll('select')
    
    for (let selectMenu of selectMenus){
        let curIndex = 0
        const options = selectMenu.getElementsByTagName("option")
        for (let option of options){

            if(toggleOptions.includes(option.value)){
                if(curIndex === selectMenu.selectedIndex){
                    selectMenu.value = "cases"
                }
                option.disabled = !option.disabled
            }
            curIndex++
        }
        
    }
}

function filterByProp(prop, value){
    return (item) => item["properties"][prop] == value
}

function sortByProp(prop, descending=true){
    return descending ?
           ((a, b) => a["properties"][prop] > b["properties"][prop] ? -1 : 1)
           :((a, b) => a["properties"][prop] > b["properties"][prop] ? 1 : -1)
}

function sortByDate(a, b){
    aPieces = a.split('-')
    bPieces = b.split('-')
    for(let i=0; i<3; i++){
        if(aPieces[i] == bPieces[i]){
            continue
        }
        return parseInt(aPieces[i]) > parseInt(bPieces[i]) ? 1 : -1
    }
}

let resetMap = () => {
    window.curState = null
    window.curCounty = null
    map.setView([42, -104], 5);
    map.removeLayer(countyLayer)
    map.addLayer(stateLayer)
}

function getResetButton() {
    let resetButton = document.createElement('input')
    resetButton.type = "button"
    resetButton.value = "Reset Map"

    resetButton.classList.add("btn", "btn-primary") 
    resetButton.onclick = resetMap
    return resetButton
}

function getCheckbox(name, labelText){
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = name;
    checkbox.id = name;
    checkbox.onclick = (e) => visualize()

    var label = document.createElement(label)
    label.htmlFor = name;
    label.appendChild(document.createTextNode(labelText));
    return [checkbox, label]
}

function updateSelectedMetric(selectMenu){
    let metric
    let base = {value:"cases", text:"Total Cases"};
    
    if(!selectMenu){
        metric = base
    }
    // else if(selectMenu.selectedIndex === -1){
    //     selectMenu.selectedIndex = 1
    //     metric = base
    // }
    else { 
        metric = {
            value:selectMenu.options[selectMenu.selectedIndex].value,
            text:selectMenu.options[selectMenu.selectedIndex].text
            }
    }
    window.curMetric = metric

}

function getColor(props){
    let {value:metricValue, text:metricText} = window.curMetric
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


// function isChartsTabActive(){
//     let chartsTab = document.querySelector(".visualize-li")
//     let classList = chartsTab.classList.value.split(' ')
//     return classList.includes('active')
// }

function isActiveTab(tabName){
    return document.querySelector(`.${tabName}-li`).classList.value.split(' ').includes('active')
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

function syncSelects(selectMenu){
    let selectMenus = document.querySelectorAll('select')
        for (let select of selectMenus){
            select.value = selectMenu.value
        }
}

function initSelectMenu(menuID){
    let options = {
                        "Case Data":
                        {
                            "Total Cases":"cases", 
                            //"Active":"active", 
                            "Recovered":"recovered", 
                            "Deaths":"deaths",
                        },
                        "Per Capita":
                        {
                            "Cases per 100,000":"pc_cases", 
                            //"Active per 100,000":"pc_active", 
                            "Deaths per 100,000":"pc_deaths",
                        },
                        "Risk Data":
                        {
                            "Total Risk":"risk_total", 
                            "Local Risk":"risk_local", 
                            "Nearby Risk":"risk_nearby",
                        },
                        "Testing Data":
                        {
                            "Total Tests":"test_total", 
                            "Tests per 100,000":"pc_tests",
                        },
                    }  
    let selectMenu = document.createElement('select')
    selectMenu.id = menuID
    for (let category of Object.keys(options)){
        let menuOption = document.createElement('option')
        menuOption.text = "  ---" + category + "---"
        menuOption.disabled = "disabled"
        menuOption.style = "font-weight:bold;"
        selectMenu.appendChild(menuOption)
        for (let displayName of Object.keys(options[category])){
            let menuOption = document.createElement('option')
            menuOption.value  = options[category][displayName]
            menuOption.text = displayName
            selectMenu.appendChild(menuOption)
        }
    }
    selectMenu.addEventListener("change", ()=> {
        updateSelectedMetric(selectMenu)
        syncSelects(selectMenu)
        updateList()
        updateMapStyle()
        updateLegend()
    })

    selectMenu.text = "Total Cases"
    selectMenu.value = "cases"
    selectMenu.selectedIndex = 1
    return selectMenu
}
