({
    platformClient: {},
    clientId: '33050ebb-784d-4788-8e39-d782c23cc763',
    redirectUri: 'https://resourceful-moose-37263-dev-ed.lightning.force.com/lightning/page/home',
    websocket: {},
    webRtcWindow: {},
    authWindow: {},
    topics: [],
    component: {},
    authenticated: false,

    initGenesysCloudSdk: function(component) {
        this.component = component;
		this.platformClient = require("platformClient");
		window.client = this.platformClient.ApiClient.instance;

        client.loginImplicitGrant(this.clientId, this.redirectUri)
        .then(() => {
            this.authenticated = true;
            window.conversationsApi = new this.platformClient.ConversationsApi();
            window.usersApi = new this.platformClient.UsersApi();
            window.notificationsApi = new this.platformClient.NotificationsApi();
            window.presenceApi = new this.platformClient.PresenceApi();
    
            this.webRtcWindow = window.open(
                `https://briandemofiles.s3.amazonaws.com/gcxWebRtc.html?accessToken=${window.client.instance.authentications['PureCloud OAuth'].accessToken}`,
                '_blank',
                'height=50,width=100'
            );
    
    /*        
            this.webRtcWindow = window.open(
                `https://apps.mypurecloud.com/crm/webrtc.html?accessToken=${window.client.instance.authentications['PureCloud OAuth'].accessToken}`,
                '_blank',
                'height=200,width=200'
            );
    */

            window.notificationsApi.postNotificationsChannels()
            .then((channel) => {
                window.notificationChannel = channel;
                this.websocket = new WebSocket(window.notificationChannel.connectUri);
                let self = this;
                this.websocket.addEventListener('message', $A.getCallback(function (event) {
                    self.websocketEventHandler(component, event);
                }));
                this.publishGetMe();
            })
            .catch((err) => {
                console.log("GCX SDK: " + err);
            });
        })
        .catch((err) => {
            console.log("GCX SDK: " + err);
        });
    },

    websocketEventHandler: function (component, event) {
        let notification = JSON.parse(event.data);
        if (notification.topicName.toLowerCase() === 'channel.metadata') {
            return;
        }
        component.set("v.priorMessage", notification.eventBody);
        if(notification.eventBody.id) {
            this.handleNotificationEvent(component, notification.eventBody);
        }
        this.sendLMSMessage(component, {
            type: "notificationEvent",
            body: notification.eventBody
        });
    },

    API: function (component, data) {
        if (data.body.API == "notificationsApi" && data.body.Command == "postNotificationsChannelSubscriptions") {
            if (this.manageDeduplicateTopicRequests(data.body.Payload))
                return;
        }

        let command = data.body.API + "." + data.body.Command + "(" + data.body.Payload + ")";
        eval(
            command
        )
        .then((reply) => {
            console.log("GCX SDK: " + command + ": " + JSON.stringify(reply));
            this.sendLMSMessage(component, {
                type: data.body.Command + "Response",
                body: reply
            });
        })
        .catch((err) => {
            console.log("GCX SDK error: " + err);
        });
    },

    manageDeduplicateTopicRequests: function (payload) {
        let startOfJson = payload.indexOf('[');
        let topicText = payload.slice(startOfJson);
        let topic = JSON.parse(topicText);
        if (this.topics.includes(topic[0].id))
            return true;
        else {
            this.topics.push(topic[0].id);
            return false;
        }
    },

    newGenesysCloudStatusId: function(OmnichannelId) {
        switch (OmnichannelId) {
            case "0N50b000000bmsH":
                return "e08eaf1b-ee47-4fa9-a231-1200e284798f";
            default:
                return "1212ca3a-f479-429e-8d69-dcb03d736217";
        }
    },
    
    assignAgentWork: function(component, workItemId, serviceChannelId, psrId, conversationId, participantId, isMessage) {
        var action = component.get("c.createAgentWork");
        action.setParams({'workItemId': workItemId, 'serviceChannelId': serviceChannelId, 'psrId': psrId});
        if (isMessage) {
            action.setCallback(this, function(response) {
                var state = response.getState();
                if(state === "SUCCESS") {
                    var message = {
                        "type": "API",
                        "body" : {
                            "API": "conversationsApi",
                            "Command": "patchConversationsMessageParticipant",
                            "Payload": "\"" + conversationId + "\", \"" + participantId + "\", {\"body\": {\"state\": \"connected\"}}"
                        }
                    }
                    this.API(component, message);
                }
                else {
                    this.handleResponseError("Error assigning agentWork: ", response);
                }
            });
		}
        $A.enqueueAction(action);
    },

    getPSR: function(component, workItemId, conversationId, participantId, isMessage) {
        var action = component.get("c.getPSR");
        action.setParams({'workItemId': workItemId});
        action.setCallback(this, function(response) {
            let psr = response.getReturnValue();
            if ($A.util.isEmpty(psr.Id)) {
                //this.assignAgentWork(component, workItemId, '0N95a000000sXtg', '', conversationId, participantId, isMessage);
                return;
            }
            var data = response.getReturnValue();
            this.handleResponse('getPSR: ', response);
            var psrId = data.Id;
            var serviceChannelId = data.ServiceChannelId;
            this.assignAgentWork(component, workItemId, serviceChannelId, psrId, conversationId, participantId, isMessage);
        });
        $A.enqueueAction(action);
    },

    publishGetMe: function() {
        var message = {
            "type": "API",
            "body": {
                "API": "usersApi",
                "Command": "getUsersMe",
                "Payload": ""
            }
        };
        this.API(this.component, message)
    },

    handleGetMe: function(userResponse) {
        if(this.component.get("v.userId") == "") {
            this.component.set("v.userId", userResponse.id);
            this.publishTopicSubscription(userResponse.id);
        }    
    },
    
    publishTopicSubscription: function(userId) {
        var message = {
            "type": "API",
            "body": {
                "API": "notificationsApi",
                "Command": "postNotificationsChannelSubscriptions",
                "Payload": "notificationChannel.id, [ { \"id\": \"v2.users." + userId + ".conversations\" } ]"
            }
        };
        this.API(this.component, message);
    },
    
    handleDOMMessage: function(component) {
        let self = this;
		window.addEventListener("message", $A.getCallback(function(event) {
            if(event.data && event.data.type) {
                console.log("GCX SDK: received DOM event");
                switch (event.data.type) {
                    case "authenticated":
                        //self.publishGetMe();
                        //self.sendLMSMessage(component, event.data);
                        window.client.instance.authentications = event.data.body;
                        console.log("GCX SDK: client instance: " + JSON.stringify(window.client.instance));
                        self.initializeComponents(component);
                        break;
                    case "getUsersMeResponse":
                        if(component.get("v.userId") == "") {
                            component.set("v.userId", event.data.body.id);
                        }
                        self.sendLMSMessage(component, event.data);
                        self.publishTopicSubscription(event.data.body.id);
                        break;
                    case "notificationEvent":
                        component.set("v.priorMessage", event.data);
                        if(event.data.body.id) {
                            self.handleNotificationEvent(component, event);
                        }
                        self.sendLMSMessage(component, event.data);
                        break;
                    default:
                        self.sendLMSMessage(component, event.data);
                }
            }
        }));
    },
    
    sendLMSMessage: function(component, message) {
        component.find("clientEventMessageChannel").publish({
            "type": message.type,
            "body": message.body
        });
    },
    
    handleNotificationEvent: function(component, event) {
        var currentIds = component.get("v.conversationIds");
        let agentParticipant = event.participants.filter(participant => (participant.purpose == "agent" || participant.purpose == "user"));
        let customerParticipant = event.participants.filter(participant => (participant.purpose == "customer" || participant.purpose == "external"));
        let workItemId = "";
        if (customerParticipant[0].attributes && customerParticipant[0].attributes.workItemId)
            workItemId = customerParticipant[0].attributes.workItemId;
        
        let state = "";
        let isMessage = false;
        if (agentParticipant[0].messages && agentParticipant[0].messages.length > 0) {
            state = agentParticipant[0].messages[0].state;
            isMessage = true;
        }
        else if (agentParticipant[0].calls && agentParticipant[0].calls.length > 0)
            state = agentParticipant[0].calls[0].state;
            
        switch (state) {
            case "alerting":
                if (!currentIds.includes(event.id)) {
                    if (workItemId != "") {
                        this.getPSR(component, workItemId, event.id, agentParticipant[0].id, isMessage);
                    }
                    currentIds.push(event.id);
                    component.set("v.conversationIds", currentIds);
                }
                break;
            case "disconnected":
                const newIds = currentIds.filter(function(value) {
                    return value != event.id;
                });
                component.set("v.conversationIds", newIds);
                break;
            default:
        }
    },
                
    handleResponseError: function(errorMsg, response) {
        var errors = response.getError();
        errors.forEach(function(error) {
            console.error(errorMsg, error.message);
        });
    },

    handleResponse: function(message, response) {
        var returnValue = response.getReturnValue();
        console.error(message, JSON.stringify(returnValue));
    }


})