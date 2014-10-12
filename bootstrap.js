/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
var PageActions;
try {
	Components.utils.import("resource://gre/modules/PageActions.jsm"); /* ↑ */
} catch(e) {
	const Ci = Components.interfaces;
	PageActions = {
		onOpenWindowProxy: function(aWindow) {
			let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			domWindow.addEventListener("UIReady", function onLoad() {
				domWindow.removeEventListener("UIReady", onLoad, false);
				updatePageAction();
			}, false);
		},
		add: function(aOptions) {
			let window = Services.wm.getMostRecentWindow("navigator:browser");
			return window.NativeWindow.pageactions.add(aOptions);
		},
		remove: function(id) {
			let window = Services.wm.getMostRecentWindow("navigator:browser");
			window.NativeWindow.pageactions.remove(id);
		}
	};
}

const BUNDLE = "chrome://closetab/locale/closetab.properties";
XPCOMUtils.defineLazyGetter(this, "Strings", function() {
	return Services.strings.createBundle(BUNDLE);
});


const windowListener = {
	onOpenWindow: PageActions.onOpenWindowProxy || function(aWindow) { updatePageAction(); },
	onCloseWindow: function(aWindow) {},
	onWindowTitleChange: function(aWindow, aTitle) {}
};

let UUID;
function updatePageAction(aUnload) {
	if (UUID) PageActions.remove(UUID);
	UUID = !aUnload && PageActions.add({
		title: Strings.GetStringFromName("Close Tab"),
		icon: "drawable://tab_close",
		clickCallback: function() {
			let window = Services.wm.getMostRecentWindow("navigator:browser");
			window.BrowserApp.closeTab(window.BrowserApp.selectedTab);
		}
	});
}


function startup(aData, aReason) {
	Services.wm.addListener(windowListener);
	updatePageAction(); /* ↑ */
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;
	Services.wm.removeListener(windowListener);
	updatePageAction(true);
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}

