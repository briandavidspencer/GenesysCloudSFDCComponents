import { LightningElement, api, track } from 'lwc';
import { sentiment as Sentiment, sentiments } from './sentiment';
import { createMessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import GCX_channel from '@salesforce/messageChannel/gcxSdkMessageChannel__c';

export default class gCX_Interaction_Controls extends LightningElement {

    //
    //class properties
    //
    @api recordId;
    conversationId = "";
    lastUtteranceId = "";

    //
    //class objects
    //
    subscribeMessageContext = createMessageContext();
    publishMessageContext = createMessageContext();
    subscription = null;
    @track
    sentiment = new Sentiment();
    @track
    utterances = [];

    //
    //class event handlers
    //
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    async handleMessage(message) {
        if(!message.type)
            return;

        switch (message.type) {
            case "authenticated":
                this.publishResend();
                break;
            case "notificationEvent":
                if (this.conversationId == "") {
                    this.conversationId = message.body.id;
                    this.publishTranscriptSubscription();
                    this.utterances = [];
                    //await this.getPreviousTranscript(this.conversationId);
                }
                if (message.body.transcripts && message.body.transcripts.length > 0){
                    if (this.lastUtteranceId == message.body.transcripts[0].utteranceId)
                        return;
                    else
                        this.lastUtteranceId = message.body.transcripts[0].utteranceId;
                    
                    this.addStreamedUtterance(message);
                    //await this.getSentiment(message.body.id);
                }
                this.utterances.sort(function(a, b){
                    return Date.parse(b.eventTime) - Date.parse(a.eventTime);
                });
                if (message.body.status && message.body.status.status && message.body.status.status == "SESSION_ENDED") {
                    createRecord({
                        "apiName": "purecloud__PureCloud_Chat_Transcript__c",
                        "fields": {
                            "Name": this.conversationId,
                            "purecloud__Body__c": JSON.stringify(this.utterances)
                        }
                    })
                    .then((result) => {
                        updateRecord({
                            "fields": {
                                "Id": this.recordId,
                                "Genesys_Cloud_Interaction_Transcript__c": result.id
                            }
                        })
                        .catch((err) => {
                            console.log("GCX Transcript: error updating record: " + JSON.stringify(err));
                        });
                    })
                    .catch((err) => {
                        console.log("GCX Transcript: error creating record: " + JSON.stringify(err));
                    });
                }
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
                GCX_channel,
                (message) => this.handleMessage(message)
            );
        }
        this.publishIsAuthenticated();
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.GCX_channelSubscription);
        this.GCX_channelSubscription = null;
    }

    publishTranscriptSubscription() {
        publish(
            this.publishMessageContext,
            GCX_channel,
            {
                "type": "API",
                "body": {
                    "API": "notificationsApi",
                    "Command": "postNotificationsChannelSubscriptions",
                    "Payload": "notificationChannel.id, [ { \"id\": \"v2.conversations." + this.conversationId + ".transcription\" } ]"
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
        
    async getPreviousTranscript (conversationId) {
        try {
            let response = await fetch(`https://abdymgp7o6.execute-api.us-east-1.amazonaws.com/default/getIvrTranscript?conversationId=${conversationId}`);
            let result = await response.json();
            for (var i=0; i<result.utterances.length; i++) {
                this.addBatchUtterance(result, i);
            }
            this.utterances.sort(function(a, b){
                return Date.parse(b.eventTime) - Date.parse(a.eventTime);
            });
            if (result.sentiment) {
                this.setSentiment(result.sentiment);
            }
            else
                this.sentiment.visible = false;
        }
        catch (err) {
            console.log("GCX_Interaction_Transcript: " + err);
            return;
        }
    }

    async getSentiment (conversationId) {
        try {
            let response = await fetch(`https://abdymgp7o6.execute-api.us-east-1.amazonaws.com/default/getIvrTranscript?conversationId=${conversationId}`);
            let result = await response.json();
            if (result.sentiment) {
                this.setSentiment(result.sentiment);
            }
        }
        catch (err) {
            console.log("GCX_Interaction_Transcript: " + err);
            return;
        }
    }

    setSentiment(sentiment) {
        switch (sentiment) {
            case "POSITIVE":
                this.sentiment.sentiment = sentiments.POSITIVE;
                break;
            case "NEUTRAL":
                this.sentiment.sentiment = sentiments.NEUTRAL;
                break;
            case "MIXED":
                this.sentiment.sentiment = sentiments.MIXED;
                break;
            case "NEGATIVE":
                this.sentiment.sentiment = sentiments.NEGATIVE;
                break;
            default:
                this.sentiment.visible = false;
                return;
        }
        this.sentiment.visible = true;
    }

    addStreamedUtterance(message) {
        var utterance = {
            get isInternal() {
                return (this.party.toUpperCase() == "INTERNAL");
            }
        };
        utterance.id = message.body.transcripts[0].utteranceId;
        utterance.transcript = message.body.transcripts[0].alternatives[0].transcript;
        utterance.eventTime = message.body.eventTime;
        utterance.party = message.body.transcripts[0].channel;

        this.utterances.push(utterance);
    }

    addBatchUtterance(result, i) {
        var utterance = {
            get isInternal() {
                return (this.party.toUpperCase() == "INTERNAL");
            }
        };

        utterance.id = i;
        utterance.transcript = result.utterances[i].transcript;
        utterance.eventTime = result.utterances[i].eventTime;
        utterance.party = result.utterances[i].party;

        this.utterances.push(utterance);
    }
}

