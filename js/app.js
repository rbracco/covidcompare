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
  app.addInfographic()  
  app.addVisualizations()
  app.addList()
  app.addSidebar()  
}