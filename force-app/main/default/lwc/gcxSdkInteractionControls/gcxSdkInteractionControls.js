import { LightningElement, track, api } from 'lwc';
import { createMessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import { updateRecord } from 'lightning/uiRecordApi';
import GCX_channel from '@salesforce/messageChannel/gcxSdkMessageChannel__c';
import { connectionButton, holdButton, muteButton, recordButton } from './buttons';
import { interaction as Interaction } from './interaction';

export default class gcxSdkInteractionControls extends LightningElement {

    //
    //class properties
    //
    userId = "";

    //
    //class objects
    //
    @api recordId;
    GCX_channelSubscription = null;
    subscription = null;
    @track
    connection = connectionButton;
    @track
    hold = holdButton;
    @track
    mute = muteButton;
    @track
    record = recordButton;
    interaction;
    subscribeMessageContext = createMessageContext();
    publishMessageContext = createMessageContext();

    //
    //display controls
    //
    @track
    showVoiceControls = false;
    @track
    showMessagingControls = false;

    //
    //class event handlers
    //
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    handleConnectionClick() {
        this.publishStateChangeMessage(this.connection.stateChange);
    }

    handleMuteClick() {
        if (this.conversationId != "") {
            this.publishStateChangeMessage(this.mute.stateChange);
        }
    }

    handleHoldClick() {
        if (this.conversationId != "") {
            this.publishStateChangeMessage(this.hold.stateChange);
        }
    }

    handleRecordClick() {
        if (this.conversationId != "") {
            this.publishStateChangeMessage(this.record.stateChange);
        }
    }

    handleGCXMessage(event) {
        if(!event.type)
            return;

        switch (event.type) {
            case "authenticated":
                if (this.userId == "") {
                    this.publishGetMe();
                }
                else
                    this.publishResend();
                break;
            case "getUsersMeResponse":
                if (event.body && event.body.id && this.userId == "") {
                    this.userId = event.body.id;
                    this.publishResend();
                }
                break;
            case "notificationEvent":
                if (event.body.id) {
                    if (!this.interaction) {
                        this.interaction = new Interaction(event.body.id);
                    }
                    this.interaction.updateInteraction(event);
                    this.processStateChange();
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

    unsubscribeToMessageChannel() {
        unsubscribe(this.GCX_channelSubscription);
        this.GCX_channelSubscription = null;
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

    publishResend() {
        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "resend",
                "body": {}
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
    
    publishStateChangeMessage(state) {
        if (this.mediaType == "message") {
            publish(
                this.publishMessageContext,
                GCX_channel,
                {
                    "type": "API",
                    "body" : {
                        "API": "conversationsApi",
                        "Command": "patchConversationsMessageParticipant",
                        "Payload": `"${this.interaction.conversationId}", "${this.interaction.participantId}", {"body": ${state}}`
                    }
                }
            );
        }
        else {
            publish(
                this.publishMessageContext,
                GCX_channel,
                {
                    "type": "API",
                    "body" : {
                        "API": "conversationsApi",
                        "Command": "patchConversationsCallParticipant",
                        "Payload": `"${this.interaction.conversationId}", "${this.interaction.participantId}", ${state}`
                    }
                }
            );

        }
    }

    processStateChange() {
        if (this.interaction && this.interaction.state) {
            switch (this.interaction.state) {
                case "alerting":
                    this.connection.isEnabled = true;
                    this.connection.isConnected = false;
                    this.showMessagingControls = (this.interaction.mediaType == "message");
                    this.showVoiceControls = (this.interaction.mediaType == "call");
                    break;
                case "connected":
                    this.connection.isEnabled = true;
                    this.connection.isConnected = true;
                    this.hold.isEnabled = true;
                    this.hold.isHeld = (this.interaction.isHeld);
                    this.mute.isEnabled = true;
                    this.mute.isMuted = (this.interaction.isMuted);
                    this.record.isEnabled = true;
                    this.record.isRecording = (this.interaction.isRecording);
                    this.showVoiceControls = (this.interaction.mediaType == "call");
                    this.showMessagingControls = (this.interaction.mediaType == "message");
                    break;
                case "disconnected":
                    delete this.interaction;
                    this.showMessagingControls = false;
                    this.showVoiceControls = false;
                    setTimeout(() => {
                        updateRecord({
                            "fields": {
                                "Id": this.recordId,
                                "Completed__c": true
                            }
                        })
                        .catch ((err) => {
                            console.log("GCX Interaction Controls: error updating record: " + JSON.stringify(err));
                        });
                    }, 500);
            
                    break;
                default:
            }
        }
    }
}