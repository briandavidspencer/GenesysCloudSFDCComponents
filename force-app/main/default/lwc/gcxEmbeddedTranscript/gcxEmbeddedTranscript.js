import { LightningElement, track } from 'lwc';
import { createMessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import { createRecord } from 'lightning/uiRecordApi';
import PureCloud from '@salesforce/messageChannel/purecloud__ClientEvent__c';
import linkTranscriptToActivity from '@salesforce/apex/getTranscript.linkTranscriptToActivity';


export default class gcxEmbeddedTranscript extends LightningElement {

    //
    //class properties
    //
    lastUtteranceId = "";

    //
    //class objects
    //
    subscribeMessageContext = createMessageContext();
    publishMessageContext = createMessageContext();
    subscription = null;

    @track
    utterances = [];

    //
    //class event handlers
    //
    connectedCallback() {
        this.subscribeToMessageChannel();
        this.publishSubscribe();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    async handleMessage(message) {
        if(!message.type)
            return;

        if(message.type == "InitialSetup") {
            this.publishSubscribe();
            return;
        }

        switch (message.category) {
            case "conversationTranscription":
                this.log("received transcription event");
                if (message.data.transcripts && message.data.transcripts.length > 0){
                    if (this.lastUtteranceId == message.data.transcripts[0].utteranceId)
                        return;
                    else
                        this.lastUtteranceId = message.data.transcripts[0].utteranceId;
                    
                    this.addStreamedUtterance(message);
                }
                this.utterances.sort(function(a, b){
                    return Date.parse(b.eventTime) - Date.parse(a.eventTime);
                });
                if (message.data.status && message.data.status == "SESSION_ENDED") {
                    createRecord({
                        "apiName": "purecloud__PureCloud_Chat_Transcript__c",
                        "fields": {
                            "Name": message.data.id,
                            "purecloud__Body__c": JSON.stringify(this.utterances)
                        }
                    })
                    .then((result) => {
                        linkTranscriptToActivity({interactionId: message.data.id, transcriptId: result.id});
                    })
                    .catch((err) => {
                        this.log("error creating record: " + err);
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
                PureCloud,
                (message) => this.handleMessage(message)
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.GCX_channelSubscription);
        this.GCX_channelSubscription = null;
    }

    publishSubscribe() {
        this.log("publishing notification subscription");
        publish(
            this.publishMessageContext,
            PureCloud,
            {
                "type": "PureCloud.subscribe",
                "data": {
                    "type": "Notification",
                    "categories": ["conversationTranscription"]
                }
            }
        );
    }

    addStreamedUtterance(message) {
        var utterance = {
            get isInternal() {
                return (this.party.toUpperCase() == "INTERNAL");
            }
        };
        utterance.id = message.data.transcripts[0].utteranceId;
        utterance.transcript = message.data.transcripts[0].alternatives[0].transcript;
        utterance.eventTime = message.data.eventTime;
        utterance.party = message.data.transcripts[0].channel;

        this.utterances.push(utterance);
    }

    log(detail) {
        console.log("GCX embedded transcript: " + detail);
    }

}

