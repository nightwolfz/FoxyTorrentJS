
// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(function onRequest(request, sender, sendResponse){
    // Show the page action for the tab that the sender (content script) was on.
    chrome.pageAction.show(sender.tab.id);

    chrome.pageAction.setPopup({tabId:sender.tab.id, popup:"options.html"});



    if (request.method == "getLocalStorage"){
    	sendResponse({'data': localStorage, 'runtimeId': chrome.runtime.id});
    }

    // Return nothing to let the connection be cleaned up.
    sendResponse({});
});