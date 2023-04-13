({
    openArticle: function (component, event, helper) {
        var id = event.target.id;
        var articles = component.get('v.knowledgeArticles');
        var article = articles.filter(function (a) { return a.id == id; })[0];
        
        var workspaceAPI = component.find("workspace");
        workspaceAPI.openTab({
            url: article.url,
            focus: true
        }).then(function(response) {
            workspaceAPI.getTabInfo({
                tabId: response
            }).then(function(tabInfo) {
            console.error("The recordId for this tab is: " + tabInfo.recordId);
            });
        }).catch(function(error) {
            console.error(error);
        });
    },

    onClientEvent: function (component, message, helper) {
        var eventData = message.getParams();
        switch (eventData.type) {
            case "authenticated":
                helper.requestResend(component);
                break;
            case "notificationEvent":
                helper.publishTranscriptSubscription(component, eventData);
                break;
            default:
        }
    },

    init: function(component, event, helper){
        if (!helper.isRendered) {
            helper.isRendered = true;
            component.find('clientEventMessageChannel').publish({
                "type": "isAuthenticated",
                "body": {}
            });
        }
    }
})