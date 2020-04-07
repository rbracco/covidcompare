var sidebar = L.control.sidebar({container:'sidebar'})
            .addTo(map)
            .open('infographic-tab');

//Set events on tab change
sidebar.on('content', function(e) {
    let tabName = e.id
    if(tabName === "infographic-tab"){
        updateInfographic()
    }
    if(tabName === "visualize-tab"){
        updateVisualize()
    }
    else if(tabName === "list-tab"){
        updateList()
    }
})

function getBackToStateButton(stateName, curStateLayer) {
    let backToStateButton = document.createElement('input')
    backToStateButton.type = "button"
    backToStateButton.value = `Back to ${stateName}`
    backToStateButton.classList.add("btn", "btn-primary") 
    backToStateButton.onclick = function(){
        window.clickState = stateName
        window.curCounty = null;
        window.clickCounty = null;
        zoomToFeature(curStateLayer, padding=[100,100])
        updateList()
    }
    return backToStateButton
}

function getActiveTab(){
    let tabNames = ['infographic', 'visualize', 'list', 'method', 'about']
    for (let tabName of tabNames){
        if(isActiveTab(tabName)){
            return tabName
        }
    }
    return null
}

function isSidebarOpen(){
    const sidebar = document.querySelector('#sidebar')
    return !sidebar.classList.contains('collapsed')
}

function openSidebar(){
    const sidebar = document.querySelector('#sidebar')
    sidebar.classList.remove('collapsed')
}

function closeSidebar(){
    const sidebar = document.querySelector('#sidebar')
    sidebar.classList.add('collapsed')
}

//Only called for hover events
function updateSidebarOnHover(){
    let activeTab = getActiveTab()
    if(activeTab === "infographic" || activeTab === null){
        updateInfographic()
    }
    else if(activeTab === "visualize"){
        updateVisualize()
    }
}

if(mobileCheck()){
    closeSidebar()
}

