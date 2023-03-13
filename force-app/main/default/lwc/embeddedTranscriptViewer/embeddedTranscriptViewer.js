import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import TRANSCRIPT_FIELD from '@salesforce/schema/purecloud__PureCloud_Chat_Transcript__c.purecloud__Body__c';

export default class embeddedTranscriptViewer extends LightningElement {
    @api recordId;
    @track _utterances = [];
    id;

    @wire(getRecord, { recordId: '$recordId', fields: [TRANSCRIPT_FIELD] })
    record;

    get utterances() {
        this.log("getting utterances");
        if (this._utterances.length > 0)
            return this._utterances;

        this.log("no utterances, about to get them");
        if (this.record.data) {
            this.log("record has data");
            this._utterances = JSON.parse(this.record.data.fields.purecloud__Body__c.value);
        }
        else {
            console.log("GCX Transcript Viewer: this.record.data.fields.purecloud__Body__c.value empty");
            return;
        }
        this._utterances.sort(function(a, b){
            return Date.parse(a.time) - Date.parse(b.time);
        });
    
        return this._utterances;
    }

    log(detail) {
        console.log("GCX embedded transcript viewer: " + detail);
    }
}

