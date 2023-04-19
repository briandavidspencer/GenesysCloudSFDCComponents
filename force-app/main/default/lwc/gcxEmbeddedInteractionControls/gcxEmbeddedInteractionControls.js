import { LightningElement, track } from 'lwc';
import { createMessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import PureCloud from '@salesforce/messageChannel/purecloud__ClientEvent__c';
import { connectionButton, holdButton, muteButton, recordButton } from './buttons';

export default class gcxEmbeddedInteractionControls extends LightningElement {

    //
    //class objects
    //
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
    interaction = {};
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
        this.log("initializing");
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    handleConnectionClick() {
        this.log("connection click");
        this.publishStateChangeMessage(this.connection.stateChange);
    }

    handleMuteClick() {
        this.log("mute click");
        if (this.conversationId != "") {
            this.publishStateChangeMessage(this.mute.stateChange);
            this.mute.isMuted = !this.mute.isMuted;
        }
    }

    handleHoldClick() {
        this.log("hold click");
        if (this.conversationId != "") {
            this.publishStateChangeMessage(this.hold.stateChange);
        }
    }

    handleRecordClick() {
        this.log("record click");
        if (this.conversationId != "") {
            this.publishStateChangeMessage(this.record.stateChange);
        }
    }

    handleGCXMessage(event) {
        this.log("received event: " + JSON.stringify(event));
        if(!event.type)
            return;

        switch (event.type) {
            case "InitialSetup":
                this.publishSubscribe();
                break;
            case "Interaction":
                this.processStateChange(event);
                break;
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
                PureCloud,
                (message) => this.handleGCXMessage(message)
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.GCX_channelSubscription);
        this.GCX_channelSubscription = null;
    }

    publishSubscribe() {
        this.log("publishing interaction subscription");
        publish(
            this.publishMessageContext,
            PureCloud,
            {
                "type": "PureCloud.subscribe",
                "data": {
                    "type": "Interaction",
                    "categories": ["add", "change", "connect", "disconnect"]
                }
            }
        );
    }

    publishStateChangeMessage(state) {
        publish(
            this.publishMessageContext,
            PureCloud,
            {
                "type": "PureCloud.Interaction.updateState",
                "data" : {
                    "action": state,
                    "id": this.interaction.id,
                }
            }
        );
    }

    processStateChange(interaction) {
        this.log("processing interaction");
        if (interaction.category == "change")
            this.interaction = interaction.data.new;
        else
            this.interaction = interaction.data;
        if (this.interaction && this.interaction.state) {
            switch (this.interaction.state) {
                case "ALERTING":
                    this.connection.isEnabled = true;
                    this.connection.isConnected = false;
                    this.showMessagingControls = (this.interaction.isMessage);
                    this.showVoiceControls = (!this.interaction.isMessage);
                    break;
                case "CONNECTED":
                    this.connection.isEnabled = true;
                    this.connection.isConnected = true;
                    this.hold.isEnabled = true;
                    this.hold.isHeld = false;
                    this.mute.isEnabled = true;
                    this.record.isEnabled = true;
                    this.record.isRecording = (this.interaction.recordingState == "active");
                    this.showMessagingControls = (this.interaction.isMessage);
                    this.showVoiceControls = (!this.interaction.isMessage);
                    break;
                case "HELD":
                    this.connection.isEnabled = true;
                    this.connection.isConnected = true;
                    this.hold.isEnabled = true;
                    this.hold.isHeld = true;
                    this.mute.isEnabled = true;
                    this.record.isEnabled = true;
                    this.record.isRecording = (this.interaction.recordingState == "active");
                    this.showMessagingControls = (this.interaction.isMessage);
                    this.showVoiceControls = (!this.interaction.isMessage);
                    break;
                case "DISCONNECTED":
                    delete this.interaction;
                    this.showMessagingControls = false;
                    this.showVoiceControls = false;
                    this.connection.isEnabled = false;
                    this.connection.isConnected = false;
                    this.hold.isHeld = false;
                    this.hold.isEnabled = false;
                    this.mute.isEnabled = false;
                    this.mute.isMuted = false;
                    this.record.isEnabled = false;
                    this.record.isRecording = false;
                    break;
                default:
            }
        }
    }

    log(detail) {
        console.log("GCX Interaction Controls: " + detail);
    }
}