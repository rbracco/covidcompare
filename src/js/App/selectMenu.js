App.prototype.addSelectMenu = function() {
    app.syncSelects = function(selectMenu){
      let selectMenus = document.querySelectorAll('select')
          for (let select of selectMenus){
              select.value = selectMenu.value
          }
    }

    app.initSelectMenu = function(menuID){
        const {updateList, syncSelects} = app;
        let options = {
                            "Case Data":
                            {
                                "Total Cases":"cases", 
                                //"Active":"active", 
                                //"Recovered":"recovered", 
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
            const { updateMapStyle, updateLegend, updateList, syncSelects, updateSelectedMetric } = app;
            updateSelectedMetric(selectMenu)
            syncSelects(selectMenu)
            updateList()
            updateMapStyle()
            updateLegend()
        })

        selectMenu.text = "Deaths per 100,000"
        selectMenu.value = "pc_deaths"
        selectMenu.selectedIndex = 5
        return selectMenu
    }

    app.updateSelectedMetric = function(selectMenu){
      let metric
      let base = {value:"pc_deaths", text:"Deaths Per 100,000"};
      
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
  

}