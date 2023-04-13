({
    onStatusChanged: function(component, event, helper) {
        var statusId = event.getParam('statusId');
        var GenesysCloudStatusId = helper.newGenesysCloudStatusId(statusId);
        let userId = component.get("v.userId");
        if (userId == "")
            return;
	
        helper.API(component, {
            "type": "API",
            "body": {
                "API": "presenceApi",
                "Command": "patchUserPresencesPurecloud",
                "Payload": `\"${userId}\", {\"presenceDefinition\": {\"id\": \"${GenesysCloudStatusId}\"}}`
            }
        });
    },

    handleMessage: function(component, event, helper) {
        var data = event.getParams();
        switch (data.type) {
            case "isAuthenticated":
                helper.sendLMSMessage(component, {
                    "type": 'authenticated',
                    "body": helper.authenticated
                });
                break;
            case "API":
                if (data.body) {
                    helper.API(component, {
                        "type": data.type,
                        "body": data.body
                    });
                }
                break;
            case "resend":
	            helper.sendLMSMessage(component, {
                    "type": "notificationEvent",
                    "body": component.get("v.priorMessage")
                });
                break;
            case "getUsersMeResponse":
                helper.handleGetMe(data.body);
                break;
            default:
        }
    },
    
    scriptsLoaded: function(component, event, helper) {
        helper.initGenesysCloudSdk(component);
    }

})