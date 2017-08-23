var { ToggleButton } = require("sdk/ui/button/toggle");
var { setTimeout, clearTimeout } = require("sdk/timers");
var tabs = require("sdk/tabs");
var panels = require("sdk/panel");
var prefs = require("sdk/simple-prefs").prefs;
var currentTab;
var timer;

var button = ToggleButton({
	id: "infinite-neptun",
	label: "InfiniteNeptun",
	icon: {
		"32": "./32.png",
		"64": "./64.png"
	},
	onClick: handleClick	
});

var panel = panels.Panel({
	contentURL: "./panel.html",
	contentScript:
			'function removeCreds() {'+
			'	self.port.emit("removeCreds", false);'+
			'}',
	onHide: handleHide
});

panel.port.on("removeCreds", function() {
	console.log("Received");
	prefs.uname = "";
	prefs.pwd = "";
});

function handleHide(state) {
	button.state('window', {checked: false});
}

function handleClick(state) {
	tabs.open({
		url: prefs.url,
		isPinned: true,
		onOpen: function onOpen(tab) {
			currentTab = tab;
			tab.on("ready", handleReload);
			tab.on("close", tabClose);
			tab.on("deactivate", tabUnfocused);
			tab.on("activate", tabFocused);
			button.removeListener("click", handleClick);
		}
	});
	button.state('window', {checked: false});
}

function handleChange(state) {
	if(state.checked) {
		panel.show({
			position: button
		});
	}
}

function focusNeptun(state) {
	currentTab.activate();
	button.state('window', {checked: false});
}

function tabFocused(tab) {
	button.removeListener("click", focusNeptun);
	button.on("change", handleChange);
}

function tabUnfocused(tab) {
	button.removeListener("change", handleChange);
	button.on("click", focusNeptun);
}

function tabClose(tab) {
	button.removeListener("change", handleChange);
	button.removeListener("click", focusNeptun);
	button.on("click", handleClick);
}

function handleReload(tab) {
	if(/.*neptun.*[Ll]ogin.*/.test(tab.url)) {
		if(!prefs.uname && !prefs.pwd) {
			var worker = tab.attach({
				contentScript:
					'document.getElementById("user").addEventListener("blur", function () { self.port.emit("uname", document.getElementById("user").value); });'+
					'document.getElementById("pwd").addEventListener("blur", function () { self.port.emit("pwd", document.getElementById("pwd").value); });'
			});
			worker.port.on("uname", function(text) {
				prefs.uname = text;
			});
			worker.port.on("pwd", function(text) {
				prefs.pwd = text;
			});
		} else {
			var worker = tab.attach({
				contentScript:
					'document.getElementById("user").value = self.options.user;'+
					'document.getElementById("pwd").value = self.options.pwd;'+
					'document.getElementById("btnSubmit").click();',
				contentScriptOptions: {
					user: prefs.uname,
					pwd: prefs.pwd
				}
			});
			worker.port.on("reqReload", function() {
				tab.reload();
			});
			clearTimeout(timer);
			if(prefs.timer) timer = setTimeout(function() { tab.reload(); }, 3000);
		}
		tidyLogin(tab);
	} else {
		var worker = tab.attach({
			contentScript:
				'setInterval(function() {document.querySelectorAll("input[value=RENDBEN]")[0].click();}, 10000);'+
				'document.getElementById("upTraining_lblRemainingTime").id = "nope";'+
				'document.getElementById("nope").innerHTML = "∞";'+
				'if(window.find(self.options.helloworld)) self.port.emit("reqRedirect", false);'+
				'else if(window.find(self.options.maintenance) || window.find(self.options.full)) self.port.emit("reqReload", false);',
			contentScriptOptions: {
				maintenance: "Karbantartás alatt",
				helloworld: "My ASP.NET Application",
				full: "Várakozás szabad helyre",
			}
		});
		worker.port.on("reqReload", function() {
			tab.reload();
		});
		worker.port.on("reqRedirect", function() {
			currentTab.url = prefs.url + "/main.aspx"
		});
		tidyUp(tab);
	}
}

function tidyLogin(tab) {
	var cleaner = tab.attach({
		contentScript:
			'document.getElementById("div_login_right_side").style.backgroundImage = "none";'+
			'document.getElementById("td_Logo").style.backgroundImage = "none";'+
			'document.getElementById("td_LeftImage").style.backgroundImage = "none";'+
			'document.getElementById("info_table_center_container_div").remove();',
	});
}

function tidyUp(tab) {
	var cleaner = tab.attach({
		contentScript:
			//Global
			'document.body.style.fontFamily = "Calibri sans-serif !important";'+
			'document.body.style.backgroundColor = "#f0f0f0";'+
			'removeClass("footer_table");'+
			//Helpers
			'function setBG(className, property) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.background = property;}'+
			'function setBGI(className, property) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.backgroundImage = property;}'+
			'function setBGC(className, property) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.backgroundColor = property;}'+
			'function setColor(className, property) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.color = property;}'+
			'function setFont(className, property) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.fontFamily = property;}'+
			'function setWeight(className, property) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.fontWeight = property;}'+
			'function removeBorder(className) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.border = "solid 0px transparent !important";}'+
			'function capitalize(className) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.textTransform = "uppercase";}'+
			'function removeClass(className) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].remove();}'+
			'function hideClass(className) { var elements = document.getElementsByClassName(className); for(var i=0; i<elements.length; i++) elements[i].style.display = "none";}'+
			//kek
			'document.getElementById("lblTrainingName").innerHTML = document.getElementById("lblTrainingName").innerHTML.replace("alapképzés", "szopóroller");'+
			//Functionality
			'if(document.getElementById("menucaption").innerHTML == "Üzenetek") document.getElementById("upFilter").remove();'+
			'if(document.getElementById("menucaption").innerHTML == "Felvett tárgyak") document.getElementById("upFilter_expandedsearchbutton").click();'+
			//Style
			//----Header
			'document.getElementsByClassName("main_table")[0].style.backgroundColor = "transparent";'+
			'document.getElementsByClassName("main_header_l")[0].style.backgroundColor = "transparent";'+
			'document.getElementsByClassName("main_header_m")[0].style.backgroundColor = "transparent";'+
			'document.getElementsByClassName("main_header_r")[0].style.backgroundColor = "transparent";'+
			'document.getElementById("panCloseHeader").remove();'+
			'removeClass("langskinpartially");'+
			//----Menu
			'setBGI("top_menu_left", "none");'+
			'setBGI("top_menu_mid", "none");'+
			'setBGI("top_menu_right", "none");'+
			'document.getElementsByClassName("top_menu_wrapper")[0].style.background = "#"+self.options.color;'+
			'setBGI("menu-parent", "none");'+
			'setColor("menu-parent", "white");'+
			'setWeight("menu-parent", "normal");'+
			'document.getElementsByClassName("top_menu_wrapper")[0].style.marginTop = "8px";'+
			'document.getElementsByClassName("top_menu_wrapper")[0].style.marginBottom = "18px";'+
			'document.getElementsByClassName("top_menu_wrapper")[0].style.boxShadow = "0px 3px 15px 3px grey";'+
			'setFont("menu-parent", "Calibri, sans-serif");'+
			'capitalize("menu-parent");'+
			'setBG("menu", "#"+self.options.color);'+
			'setColor("menu-item", "white");'+
			'setFont("menu-item", "Calibri, sans-serif");'+
			'removeBorder("menu-item");'+
			'setWeight("menu-item", "normal");'+
			'hideClass("menuitemfirst");'+
			'hideClass("menuitemlast");'+
			//----Potato sideboxes
			'function fixGadget() {'+
			'document.getElementById("upBoxes_upRSS_gdgRSS").style.display = "none";'+
			'document.getElementById("upBoxes_upfavorites").style.display = "none";'+
			'document.getElementById("upBoxes_upForum").style.display = "none";'+
			'document.getElementById("upBoxes_upBoxesButtons").style.display = "none";'+
			'setBGI("HeaderLeftCorner", "none");'+
			'setBGI("GadgetHeaderPanelTitle", "none");'+
			'setBGI("GadgetHeaderPanelButtonLeftMenu", "none");'+
			'setBGI("HeaderRightCorner", "none");'+
			'document.getElementById("upBoxes_upMessage_gdgMessage_gdgMessage").style.backgroundColor = "white";'+
			'document.getElementById("upBoxes_upCalendar_gdgCalendar_gdgCalendar").style.backgroundColor = "white";'+
			'hideClass("GadgetHeaderPanelButtonLeftMenu");'+
			'hideClass("upBoxes_CloseLeftBoxTD");'+
			'setBGI("gadgetbodyleft", "none");'+
			'setBGI("gadgetbodyright", "none");'+
			'setBGI("GadgetFooterLeftCorner", "none");'+
			'var fuckingborder = document.getElementsByClassName("GadgetFooter"); for(var i=0; i<fuckingborder.length; i++) fuckingborder[i].style.borderBottomWidth = "0px";'+
			'document.getElementById("upBoxes_upMessage").style.marginBottom = "12px";'+
			'document.getElementById("upBoxes_upMessage_gdgMessage").style.marginBottom = "0px";'+
			'document.getElementById("upBoxes_upMessage").style.marginBottom = "32px";'+
			'document.getElementById("upBoxes_upMessage").style.boxShadow = "0px 3px 10px 2px grey";'+
			'document.getElementById("upBoxes_upCalendar").style.boxShadow = "0px 3px 10px 2px grey";'+
			'setBGI("GadgetFooterRightCorner", "none");'+
			'}'+
			//----Content
			'function fixContent() {'+
			'setBG("function", "white");'+
			'document.getElementsByClassName("function")[0].style.boxShadow = "0px 3px 10px 2px grey";'+
			'setBGI("FunctionHeaderLeftCorner", "none");'+
			'setBGI("FunctionHeader", "none");'+
			'setBGI("FunctionHeaderRightCorner", "none");'+
			'setBGI("FunctionLeftSide", "none");'+
			'removeBorder("upFunctionCommandLineBottom_div_line_bottom");'+
			'setBGI("FunctionRightSide", "none");'+
			'setBGI("function_table_leftside", "none");'+
			'setBGI("function_table_rightside", "none");'+
			'setBGI("FunctionFooterLeftCorner", "none");'+
			'removeBorder("FunctionFooter");'+
			'setBGI("FunctionFooterRightCorner", "none");'+
			'setBGI("grid_pagerrow_left", "none");'+
			'setBGI("grid_topfunctionpanel", "none");'+
			'setBGI("grid_pagerpanel", "none");'+
			'setBGI("grid_pagerrow_right", "none");'+
			'removeBorder("header");'+
			'}'+
			'fixContent();'+
			//----Popups
			'removeClass("dialog_modal1");'+
			'removeClass("dialog_modal11");'+
			/*'document.getElementById("upRequiredMessageReader_upmodal_RequiredMessageReader_upFootermodal_RequiredMessageReader_footerbtn_modal_RequiredMessageReader_Tovabb").click()',
			'document.getElementById("upReadMessageModal_upmodal_ReadMessage_upFootermodal_ReadMessage_footerbtn_modal_ReadMessage_KovetkezoUzenet").click()'*/
			//----Hook to Changes
			'var lastGadget = 0; var lastContent = 0;'+
			'document.getElementById("upBoxes_upMessage").addEventListener("DOMSubtreeModified", function() { if(Date.now() - lastGadget > 250) { fixGadget(); lastGadget = Date.now(); } }, false);'+
			'document.getElementsByClassName("function")[0].addEventListener("DOMSubtreeModified", function() { if(Date.now() - lastContent > 250) fixContent(); lastContent = Date.now(); }, false);',
		contentScriptOptions: {
			color: prefs.color,
		}
	});
}