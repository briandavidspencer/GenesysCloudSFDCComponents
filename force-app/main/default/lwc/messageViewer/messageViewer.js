import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getTranscript from '@salesforce/apex/getTranscript.getTranscript';
import TRANSCRIPT_FIELD from '@salesforce/schema/Experience__c.Genesys_Cloud_Interaction_Transcript__c';

export default class WireFunction extends LightningElement {
    @api recordId;
    @track _messages = [];
    id;

    @wire(getRecord, { recordId: '$recordId', fields: [TRANSCRIPT_FIELD] })
    record;

    get messages() {
        if (this._messages.length > 0)
            return this._messages;

        if (this.record.data) {
            this.id = this.record.data.fields.Genesys_Cloud_Interaction_Transcript__c.value;
            if (this.id) {
                getTranscript({id: this.id})
                .then(result => {
                    this._messages = JSON.parse(result);
                })
                .catch(error => {
                    console.log(JSON.stringify(error));
                    return;
                });
            }
            else {
                console.log("GCX Transcript Viewer: this.record.data.fields.Genesys_Cloud_Interaction_Transcript__c.value empty");
                return;
            }
            this._messages.sort(function(a, b){
                return Date.parse(a.time) - Date.parse(b.time);
            });
    
            return this._messages;
        }
    }
}

