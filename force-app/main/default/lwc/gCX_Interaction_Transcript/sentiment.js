export class sentiment {
    _sentiment = sentiments.NEUTRAL;
    _icon = icons.NEUTRAL;
    _theme = themes.NEUTRAL;
    _visible = false;

    constructor() {
        return this;
    }
    
    get sentiment() {
        return this._sentiment;
    }

    get icon() {
        return this._icon;
    }

    get theme() {
        return this._theme;
    }

    get visible() {
        return this._visible;
    }

    /**
     * @param {sentiments} sentiment
     */
    set sentiment(sentiment) {
        console.log("GCX Interaction Transcript: setting sentiment to " + sentiment);
        this._sentiment = sentiment;
        switch (this._sentiment) {
            case "POSITIVE":
                this._icon = icons.POSITIVE;
                this._theme = themes.POSITIVE;
                break;
            case "NEGATIVE":
                this._icon = icons.NEGATIVE;
                this._theme = themes.NEGATIVE;
                break;
            case "NEUTRAL":
                this._icon = icons.NEUTRAL;
                this._themes = themes.NEUTRAL;
                break;
            case "MIXED":
                this._icon = icons.MIXED;
                this._theme = themes.MIXED;
                break;
            default:
                console.log("GCX Interaction Transcript: caught by default");
        }
        console.log("GCX Transcript: " + this._icon + ", " + this._theme);
    }

    /**
     * @param {boolean} visible
     */
    set visible(visible) {
        this._visible = visible;
    }
}

export const sentiments = Object.freeze({
    NEUTRAL: "NEUTRAL",
    POSITIVE: "POSITIVE",
    NEGATIVE: "NEGATIVE",
    MIXED: "MIXED"
});

export const icons = Object.freeze({
    NEUTRAL: "utility:sentiment_neutral",
    POSITIVE: "utility:smiley_and_people",
    NEGATIVE: "utility:sentiment_negative",
    MIXED: "utility:sentiment_neutral"
});

export const themes = Object.freeze({
    NEUTRAL: "slds-text-color_weak",
    POSITIVE: "slds-text-color_success",
    NEGATIVE: "slds-text-color_error",
    MIXED: "slds-text-color_weak"
});