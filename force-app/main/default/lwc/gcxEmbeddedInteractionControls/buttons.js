export const connectionButton = {
    _variant: "success",
    _label: "Pickup",
    _isConnected: false,
    _isEnabled: false,

    get variant() {
        return this._variant;
    },

    get label() {
        return this._label;
    },

    get stateChange() {
        if (this._isConnected) {
            return "disconnect";
        }
        else
            return "pickup";
    },

    /**
     * @param {boolean} isConnected
     */
    set isConnected(isConnected) {
        if (isConnected != this._isConnected) {
            this.toggleState();
        }
    },

    /**
     * @param {boolean} isEnabled
     */
    set isEnabled(isEnabled) {
        this._isEnabled = isEnabled;
    },

    toggleState() {
        this._isConnected = !this._isConnected;
        if (this._isConnected) {
            this._variant = "destructive",
            this._label = "Disconnect"
        }
        else {
            this._variant = "success",
            this._label = "Pickup"
        }
    }
}

export const muteButton = {
    _variant: "destructive-text",
    _label: "Mute",
    _isMuted: false,
    _isEnabled: false,

    get variant() {
        return this._variant;
    },

    get label() {
        return this._label;
    },

    get stateChange() {
        return "mute";
    },

    get isMuted() {
        return this._isMuted;
    },

    /**
     * @param {boolean} isMuted
     */
    set isMuted(isMuted) {
        if (isMuted != this._isMuted)
            this.toggleState();
    },

    /**
     * @param {boolean} isEnabled
     */
    set isEnabled(isEnabled) {
        this._isEnabled = isEnabled;
    },

    toggleState() {
        if (this._isMuted) {
            this._variant = "destructive-text",
            this._label = "Mute"
        }
        else {
            this._variant = "success",
            this._label = "Unmute"
        }
        this._isMuted = !this._isMuted;
    }
}

export const holdButton = {
    _variant: "destructive-text",
    _label: "Hold",
    _isHeld: false,
    _isEnabled: false,

    get variant() {
        return this._variant;
    },

    get label() {
        return this._label;
    },

    get stateChange() {
        return "hold";
    },

    /**
     * @param {boolean} isHeld
     */
    set isHeld(isHeld) {
        if (isHeld != this._isHeld)
            this.toggleState();
    },

     /**
     * @param {boolean} isEnabled
     */
     set isEnabled(isEnabled) {
        this._isEnabled = isEnabled;
    },

   toggleState() {
        if (this._isHeld) {
            this._variant = "destructive-text",
            this._label = "Hold"
        }
        else {
            this._variant = "success",
            this._label = "Pickup"
        }
        this._isHeld = !this._isHeld;
    }
}

export const recordButton = {
    _variant: "destructive-text",
    _label: "Pause",
    _isRecording: true,
    _isEnabled: false,

    get variant() {
        return this._variant;
    },

    get label() {
        return this._label;
    },

    get stateChange() {
        return "securePause";
    },

    /**
     * @param {boolean} isRecording
     */
    set isRecording(isRecording) {
        if (isRecording != this._isRecording)
            this.toggleState();
    },

    /**
     * @param {boolean} isEnabled
     */
    set isEnabled(isEnabled) {
        this._isEnabled = isEnabled;
    },

    toggleState() {
        this._isRecording = !this._isRecording;
        if (this._isRecording) {
            this._variant = "destructive-text",
            this._label = "Pause"
        }
        else {
            this._variant = "success",
            this._label = "Resume"
        }
    }
}