App.prototype.addStates = function(options) {
    const app = this;  
    app.getState = function(stateID) {
      return stateData["features"].find(element => element["id"] == stateID)
    }
    
    app.getStateFromName = function(stateName){
      return stateData["features"].find(element => element["properties"]["statename"] == stateName)
    }
    
    app.convertStateIDToLayer = function(stateID){
      let layer_id = app.stateIDToLayer[stateID]
      return app.stateLayer._layers[layer_id]
    }
    
    function stateStyle(feature) {
      return {
          fillColor: getColor(feature.properties),
          weight: 1,
          opacity: 1,
          color: 'black',
          dashArray: '3',
          fillOpacity: 0.7
      };
    }
    
    function onEachState(feature, layer) {
      const {highlightState, resetHighlightState, zoomToCounties} = app
      layer.on({
          mouseover: () => highlightState(layer),
          mouseout: () => resetHighlightState(layer),
          click: () => zoomToCounties(layer)
      });
    }
    
    app.zoomToCounties = function(layer){
      window.clickState = layer.feature.properties.statename
      let menuSelect = document.querySelector('#metricSelect')
      app.map.removeLayer(app.stateLayer)
      app.map.addLayer(app.countyLayer)
      let padding = mobileCheck()?[0,0]:[100,100]
      app.zoomToFeature(layer, padding=[0,0])
      setTimeout(() => app.openSidebar(), 1000)
    }
    
    app.resetHighlightState = function(layer) {
      window.hoverState = window.clickState
      app.updateSidebarOnHover()
      app.stateLayer.resetStyle(layer);
    }
    
    app.highlightState = function(layer) {
      window.hoverState=layer.feature.properties.statename
      app.updateSidebarOnHover()
    
      layer.setStyle({
          weight: 5,
          color: '#777',
          dashArray: '',
          fillOpacity: 0.7
      });
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
      }
    }

    // Set objects to app for use by other modules
    app.stateStyle = stateStyle
    app.onEachState = onEachState
  
}