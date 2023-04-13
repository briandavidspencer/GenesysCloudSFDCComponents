({
    conversationId: "",
    isRendered: false,

    searchKnowledge : function(component, searchValue, fullResponse) {
        var action = component.get("c.searchKnowledge");
        action.setParams({'searchValue': searchValue});
        
        action.setCallback(this, function(response) {
            var state = response.getState();            
            if(state === "SUCCESS") {
                var response = response.getReturnValue();
                var articles = JSON.parse(response);                
                articles.data.forEach(function(article) {
                    fullResponse.forEach(function(responseItem) {	
                        if(article.title === responseItem.label)
                            article.probability = responseItem.probability;
                    });
                });
                articles.data.sort(function(msg1, msg2) { return msg2.probability - msg1.probability });
                component.set('v.knowledgeArticles', articles.data);
                component.set('v.numResults', articles.data.length);
            } else {
                this.handleResponseError("Error searching knowledge: ", response);
                this.clear(component);
            }
        });
        
        $A.enqueueAction(action);
    },
    
    getKnowledgeProbabilities : function (component, searchValue) {
    	var action = component.get("c.calculateIntent");
        if (searchValue.messages)
	        action.setParams({'utterance' : searchValue.messages[searchValue.messages.length - 1].body});
        else
            action.setParams({'utterance' : searchValue});
        action.setCallback(this, function(response) {
            var state = response.getState();
            
            if(state === "SUCCESS") {
                var response = response.getReturnValue();
                var labels = [];
                response.forEach(function(res) {
                	labels.push(res.label); 
                });
                
                if(labels) {
                    labels = JSON.stringify(labels);
                    this.searchKnowledge(component, labels, response);
                } else {
                    this.clear(component);
                }
            } else {
                this.handleResponseError("Error getting knowledge probabilities: ", response);
            }
        });
        $A.enqueueAction(action);
    },
    
    clear : function(component) {
        component.set('v.knowledgeArticles', []);
        component.set('v.numResults', 0);
    },

    updateNextBestAction : function(component, utterance) {
        var action = component.get("c.updateExperienceLastUtterance");
        action.setParams({'recordId': component.get("v.recordId"), 'utterance': utterance});
        action.setCallback(this, function(response) {
            var appEvt = $A.get("e.lightning:nextBestActionsRefresh");
            appEvt.setParam("recordId", component.get("v.recordId"));
            appEvt.fire();
        });
        $A.enqueueAction(action);
    },
    
    handleConversationTranscription : function(component, eventData) {
        if (eventData && eventData.body.transcripts) {
            var x = eventData.body.transcripts.length - 1;
            if (eventData.body.transcripts[x].channel == "EXTERNAL") {
                this.updateNextBestAction(component, eventData.body.transcripts[x].alternatives[0].transcript);
                this.getKnowledgeProbabilities(component, eventData.body.transcripts[x].alternatives[0].transcript);
            }
        }
    },

    handleMessageUpdate : function(component, eventData) {
        if (eventData && eventData.data.messages) {
            var x = eventData.data.messages.length - 1;
            if (eventData.data.messages[x].role == "customer") {
				this.updateNextBestAction(component, eventData.data.messages[x].body);
                this.getKnowledgeProbabilities(component, eventData.data.messages[x].body);
            }
        }
    },

    requestResend: function(component) {
        component.find('clientEventMessageChannel').publish({
            "type": "resend",
            "body": {}
        });
    },

    publishTranscriptSubscription: function(component, eventData) {
        if (this.conversationId == "") {
            this.conversationId = eventData.body.id;
            component.find('clientEventMessageChannel').publish({
                "type": "API",
                "body": {
                    "API": "notificationsApi",
                    "Command": "postNotificationsChannelSubscriptions",
                    "Payload": "notificationChannel.id, [ { \"id\": \"v2.conversations." + this.conversationId + ".transcription\" } ]"
                }
            });
        }
        this.handleConversationTranscription(component, eventData);
    },

    handleResponseError: function(errorMsg, response) {
        var errors = response.getError();
        errors.forEach(function(error) {
            console.error(errorMsg, error.message);
        });
    }
})