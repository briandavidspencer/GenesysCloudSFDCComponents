import { LightningElement, track, api } from 'lwc';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { createMessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import GCX_channel from '@salesforce/messageChannel/gcxSdkMessageChannel__c';

export default class gCX_Interaction_Controls extends LightningElement {

    //
    //class properties
    //
    @api recordId;
    userId = "";
    conversationId = "";
    communicationId = "";

    //
    //class objects
    //
    interaction = {};
    messageIds = [];
    subscribeMessageContext = createMessageContext();
    publishMessageContext = createMessageContext();
    GCX_channelSubscription = null;
    @track
    activeConversation = false;
    @track
    messages = [];

    //
    //class event handlers
    //
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    handleKeyDown(event) {
        if (event.key == "Enter") {
            this.publishSendMessage();
        }
    }

    handleGCXMessage(event) {
        if(!event.type)
            return;

        switch (event.type) {
            case "authenticated":
                if (this.userId == "")
                    this.publishGetMe();
                break;
            case "getUsersMeResponse":
                if (event.body && event.body.id && this.userId == "") {
                    this.userId = event.body.id;
                    this.publishTopicSubscriptions();        
                }
                break;
            case "postConversationsMessageMessagesBulkResponse":
                this.publishMessages(event.body.entities);
                break;
            case "notificationEvent":
                if (event.body) {
                    this.interaction = event.body;
                    this.processInteractionUpdate();
                }
            default:
        }
    }

    //
    //class methods
    //
    subscribeToMessageChannel() {
        if (!this.GCX_channelSubscription) {
            this.GCX_channelSubscription = subscribe(
                this.subscribeMessageContext,
                GCX_channel,
                (message) => this.handleGCXMessage(message)
            );
        }

        this.publishIsAuthenticated();
    }

    publishTopicSubscriptions() {
        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "API",
                "body": {
                    "API": "notificationsApi",
                    "Command": "postNotificationsChannelSubscriptions",
                    "Payload": `notificationChannel.id, [ { \"id\": \"v2.users.${this.userId}.conversations\" } ]`
                }
            }
        );
    }

    publishGetMe() {
        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "API",
                "body": {
                    "API": "usersApi",
                    "Command": "getUsersMe",
                    "Payload": "{}"
                }
            }
        );
    }

    publishIsAuthenticated() {
        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "isAuthenticated",
                "body": {}
            }
        );
    }

    publishSendMessage() {
        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "API",
                "body": {
                    "API": "conversationsApi",
                    "Command": "postConversationsMessageCommunicationMessages",
                    "Payload": `\"${this.conversationId}\", \"${this.communicationId}\", {\"textBody\": \"${this.template.querySelector('input').value}\"}`
                }
            }
        );
        this.template.querySelector('input').value = "";
    }

    publishGetMessages() {
        let newMessages = [];
        this.interaction.participants.map((participant) => {
            participant.messages.map((message) => {
                if(message.messages) {
                    message.messages.map((message) => {
                        if(message.messageId && !this.messageIds.includes(`\"${message.messageId}\"`)){
                            this.messageIds.push(`\"${message.messageId}\"`);
                            newMessages.push(`\"${message.messageId}\"`);
                        }
                    })
                }
            })
        });

        if (newMessages.length == 0)
            return;

        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "API",
                "body": {
                    "API": "conversationsApi",
                    "Command": "postConversationsMessageMessagesBulk",
                    "Payload": `\"${this.conversationId}\", {\"useNormalizedMessage\": true, \"body\": [${newMessages}]}`
                }
            }
        );
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.GCX_channelSubscription);
        this.GCX_channelSubscription = null;
    }

    processInteractionUpdate() {
        this.conversationId = this.interaction.id;
        let agentParticipant = this.interaction.participants.filter(participant => participant.purpose == "agent");
        switch (agentParticipant[0].messages[0].state) {
            case "connected":
                this.activeConversation = true;
                this.communicationId = agentParticipant[0].messages[0].id;
                this.publishGetMessages();
                break;
            case "disconnected":
                this.activeConversation = false;
                this.communicationId = "";
                console.log("GCX Messaging: logging transcript: " + JSON.stringify(this.messages));
                createRecord({
                    "apiName": "purecloud__PureCloud_Chat_Transcript__c",
                    "fields": {
                        "Name": this.conversationId,
                        "purecloud__Body__c": JSON.stringify(this.messages)
                    }
                })
                .then((result) => {
                    updateRecord({
                        "fields": {
                            "Id": this.recordId,
                            "Genesys_Cloud_Interaction_Transcript__c": result.id
                        }
                    })
                    .then((object) => {
                        console.log("GCX Transcript: updated: " + JSON.stringify(object));
                    })
                    .catch((err) => {
                        console.log("GCX Transcript: error updating record: " + err);
                    });
                })
                .catch((err) => {
                    console.log("GCX Transcript: error creating record: " + err);
                });
                break;
            default:
        }
    }

    publishMessages(entities) {
        for (var x=0; x<entities.length; x++) {
            if (this.messages.map(message => message.id).includes(entities[x].id) || !entities[x].normalizedMessage.text) {
                continue;
            }

            var message = {
                get isExternal() {
                    return (this.role.toUpperCase() == "INBOUND");
                }
            };
            
            message.id = entities[x].normalizedMessage.id;
            message.body = entities[x].normalizedMessage.text;
            message.time = entities[x].normalizedMessage.channel.time;
            message.role = entities[x].normalizedMessage.direction;

            this.messages.push(message);
        }

        this.messages.sort(function(a, b){
            return Date.parse(a.time) - Date.parse(b.time);
        });

        setTimeout(() => {
            this.template.querySelector('section').scrollTop = this.template.querySelector('section').scrollHeight;
        }, 200);
    }
}

