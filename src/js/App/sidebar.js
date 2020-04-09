App.prototype.addSidebar = function(options) {
    const app = this;
    const {updateVisualize, updateInfographic, updateList} = app
    var sidebar = L.control.sidebar({container:'sidebar'})

    sidebar.addTo(app.map)
    sidebar.open('infographic-tab');

    //Set events on tab change
    sidebar.on('content', function(e) {
        let tabName = e.id
        window.curTab = tabName
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

    app.getBackToStateButton = function(stateName, curStateLayer) {
        let backToStateButton = document.createElement('input')
        backToStateButton.type = "button"
        backToStateButton.value = `Back to ${stateName}`
        backToStateButton.classList.add("btn", "btn-primary") 
        backToStateButton.onclick = function(){
            window.clickState = stateName
            window.curCounty = null;
            window.clickCounty = null;
            app.zoomToFeature(curStateLayer, padding=[100,100])
            app.updateList()
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

    function isActiveTab(tabName){
        return document.querySelector(`.${tabName}-li`).classList.value.split(' ').includes('active')
    }

    app.isSidebarOpen = function(){
        const sidebar = document.querySelector('#sidebar')
        return !sidebar.classList.contains('collapsed')
    }

    app.openSidebar = function(){
        sidebar.open(window.curTab)
    }

    //Only called for hover events
    app.updateSidebarOnHover = () => {
        const { updateVisualize } = app;
        let activeTab = getActiveTab()
        if(activeTab === "infographic" || activeTab === null){
            app.updateInfographic()
        }
        else if(activeTab === "visualize"){
            updateVisualize()
        }
    }

    if(mobileCheck()){
        sidebar.close()
    }
}