function App(options) {
  const app = this;
  return app
}

App.prototype.initialize = function(options) { 
  app.addSelectMenu() 
  app.addCharts()
  app.addStates()
  app.addCounties()  
  app.addMap()
  app.addVisualizations()
  app.addInfographic()  
  app.addList()
  app.addSidebar()  
}