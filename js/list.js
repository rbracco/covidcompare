function initListControls(){
    let controlsDiv = document.querySelector(".list-controls")
    let resetButton = getResetButton()
    let selectMenu = initSelectMenu("sidebarSelect")
    controlsDiv.innerHTML = ""
    controlsDiv.append(selectMenu, resetButton)
}

initControls()
