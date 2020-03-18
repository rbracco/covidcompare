var sidebar = L.control.sidebar({container:'sidebar'})
            .addTo(map)
            .open('home');

        // be notified when a panel is opened
        sidebar.on('content', function (ev) {
            switch (ev.id) {
                case 'autopan':
                sidebar.options.autopan = true;
                break;
                default:
                sidebar.options.autopan = false;
            }
        });

let resetMap = () => {
    map.setView([42, -104], 5);
    map.removeLayer(countyLayer)
    map.addLayer(stateLayer)
    updateSidebar("States")
}

console.log(countyData)

function getResetButton() {
    let resetButton = document.createElement('input')
    resetButton.type = "button"
    resetButton.value = "Reset Map"

    resetButton.classList.add("btn", "btn-primary") 
    resetButton.onclick = resetMap
    return resetButton
}

function updateSidebar(layerName, filt, headerText="Total Cases in US:"){
    let resetButton = getResetButton()
    let dataDiv = document.querySelector(".data")
    dataDiv.innerHTML = ''
    let newOL = document.createElement('ol')
    let totalCases = 0
    if(layerName == "States"){
        let data = filt ? stateData["features"].filter(filt):stateData["features"]

        for(let state of data.sort(sortByProp("cases"))){
            let newLI = document.createElement('li')
            let {name, cases, lat, long} = state["properties"]
            totalCases += cases
            newLI.innerHTML = `<a>${state["properties"]["name"]}</a> - ${cases} cases`
            newLI.addEventListener("mouseover", () => info.updateState(state["properties"]))
            newLI.addEventListener("click", (e) => {
                map.setView([lat, long], 8)
                map.removeLayer(stateLayer)
                map.addLayer(countyLayer)
                updateSidebar("Counties", filterByProp("statename", name), `Total Cases in ${name}:`)
            })
            newOL.appendChild(newLI)
        }
    }
    else {
        let data = filt ? countyData["features"].filter(filt):countyData["features"]
        for(let county of data.sort(sortByProp("cases"))){
            let newLI = document.createElement('li')
            let {name, statename, cases} = county["properties"]
            if(cases <= 0){
                break
            }
            totalCases += cases
            newLI.innerHTML = `<a>${name}, ${statename}</a> ${cases} cases`
            newLI.addEventListener("mouseover", () => info.updateCounty(county["properties"]))
            newOL.appendChild(newLI)
        }
    }
    header = document.createElement('h3')
    header.innerText = `${headerText} ${totalCases}`
    dataDiv.append(header, resetButton,  newOL)
}

function sortByProp(prop, descending=true){
    return descending ?
           ((a, b) => a["properties"][prop] > b["properties"][prop] ? -1 : 1)
           :((a, b) => a["properties"][prop] > b["properties"][prop] ? 1 : -1)
}

function filterByProp(prop, value){
    return (item) => item["properties"][prop] == value
}

updateSidebar("States")

map.on('baselayerchange', function (e) {
    updateSidebar(e.name)
});

