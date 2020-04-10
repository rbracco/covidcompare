App.prototype.addCounties = function(options) {
    const app = this; 
    app.getCountyIDFromLatLng = async function(lat, lng){
      const api_url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`
      const {data} = await axios.get(api_url)
      //State Name -> data["State"]["name"] abbr -> data["State"]["code"] county name data["County"]["name"]
      return '0500000US' + data["County"]["FIPS"]
  }

    app.getCounty = function(countyID){
      return countyData["features"].find(element => element["properties"]["geo_id"] == countyID)
    }

    app.convertCountyIDToLayer = function(countyID){
      let layer_id = app.countyIDToLayer[countyID]
      return app.countyLayer._layers[layer_id]
    }

    function countyStyle(feature) {
      return {
          fillColor: getColor(feature.properties),
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7,
      };
    }

    function onEachCounty(feature, layer){
      const { highlightCounty, resetHighlightCounty, displayDetailed } = app;
      layer.on({
          mouseover: () => highlightCounty(layer),
          mouseout: () => resetHighlightCounty(layer),
          click: () => displayDetailed(layer),
      });
    }

    app.displayDetailed = function(layer){
      const {stateLayer, countyLayer, map, updateSidebarOnHover, openSidebar, updateList, zoomToFeature} = app
      window.clickCounty = layer.feature.properties.geo_id
      updateSidebarOnHover()
      map.removeLayer(stateLayer)
      map.addLayer(countyLayer)
      let padding = mobileCheck()?[100,100]:[200,200]
      zoomToFeature(layer, padding)
      updateList()
      setTimeout(() => openSidebar(), 1250)
    }


    app.highlightCounty = function(layer) {
      const { map } = app;
      window.hoverCounty = layer.feature.properties.geo_id
      app.updateSidebarOnHover()    
      layer.setStyle({
          weight: 5,
          dashArray: '',
          fillOpacity: 0.7
      });
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
      }
    }

    app.resetHighlightCounty = function(layer) {
      window.hoverCounty = window.clickCounty;
      app.updateSidebarOnHover()

      layer.setStyle({
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
      });
    }

    // Set objects to app for use by other modules
    app.countyStyle = countyStyle
    app.onEachCounty = onEachCounty    
}