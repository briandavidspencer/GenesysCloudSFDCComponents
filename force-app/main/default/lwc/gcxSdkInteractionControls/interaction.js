export class interaction {

    _conversationId = null;
    _participantId = null;
    _mediaType = null;
    _state = null;
    _isConnected = null;
    _isHeld = null;
    _isMuted = null;
    _isRecording = null;

    constructor(conversationId) {
        this._conversationId = conversationId;
        return this;
    }

    updateInteraction(interaction) {
        if (interaction.body.id != this._conversationId)
            return;

        if (!this._mediaType)
            this._mediaType = setMediaType(interaction.body);

        let agentParticipant = getAgentParticipant(interaction.body);
        this._participantId = agentParticipant.id;

        switch (this._mediaType) {
            case mediaType.CALL:
                this.processCallChange(agentParticipant);
                break;
            case mediaType.MESSAGE:
                this.processMessageChange(agentParticipant);
                break;
            default:
        }
    }

    processCallChange(agentParticipant) {
        switch (agentParticipant.calls[0].state) {
            case "alerting":
                this._state = state.ALERTING;
                this._isConnected = false;
                break;
            case "connected":
                this._state = state.CONNECTED;
                this._isConnected = false;
                this._isRecording = agentParticipant.calls[0].recording;
                this._isHeld = agentParticipant.calls[0].held;
                this._isMuted = agentParticipant.calls[0].muted;
                break;
            case "disconnected":
                this._state = state.DISCONNECTED;
                this._isConnected = false;
                this._isRecording= false;
                this._isHeld = false;
                this._isMuted = false;
                break;
            default:
        }        
    }
    
    processMessageChange(agentParticipant) {
        switch (agentParticipant.messages[0].state) {
            case "alerting":
                this._state = state.ALERTING;
                this._isConnected = false;
                break;
            case "connected":
                this._state = state.CONNECTED;
                this._isConnected = false;
                break;
            case "disconnected":
                this._state = state.DISCONNECTED;
                this._isConnected = false;
                break;
            default:
        }
    }
    
    get conversationId() {
        return this._conversationId;
    }

    get participantId () {
        return this._participantId;
    }

    get state() {
        return this._state;
    }

    get mediaType() {
        return this._mediaType;
    }

    get isConnected() {
        return this._isConnected;
    }

    get isHeld() {
        return this._isHeld;
    }

    get isMuted() {
        return this._isMuted;
    }

    get isRecording() {
        return this._isRecording;
    }

    set state(state) {
        this._state = state;
    }

    set mediaType(mediaType) {
        this._mediaType = mediaType;
    }

    set isConnected(isConnected) {
        this._isConnected = isConnected;
    }

    set isHeld(isHeld) {
        this._isHeld = isHeld;
    }

    set isMuted(isMuted) {
        this._isMuted = isMuted;
    }

    set isRecording(isRecording) {
        this._isRecording = isRecording;
    }
}

function setMediaType(interaction) {
    if (interaction.participants[0].calls && interaction.participants[0].calls.length > 0) {
        return mediaType.CALL;
    }
    else if (interaction.participants[0].messages && interaction.participants[0].messages.length > 0) {
        return mediaType.MESSAGE;
    }
    return null;
}

function getAgentParticipant(interaction) {
    let agentParticipant = interaction.participants.filter(participant => {
        return (participant.purpose == "agent" || participant.purpose == "user");
    });
    return agentParticipant[0];
}

export const mediaType = Object.freeze({
    CALL: "call",
    MESSAGE: "message"
})

export const state = Object.freeze({
    ALERTING: "alerting",
    CONNECTED: "connected",
    DISCONNECTED: "disconnected"
})