export declare enum UltravoxSessionStatus {
    DISCONNECTED = "disconnected",
    DISCONNECTING = "disconnecting",
    CONNECTING = "connecting",
    IDLE = "idle",
    LISTENING = "listening",
    THINKING = "thinking",
    SPEAKING = "speaking"
}
export declare enum Role {
    USER = "user",
    AGENT = "agent"
}
export declare enum Medium {
    VOICE = "voice",
    TEXT = "text"
}
/** A transcription of a single utterance. */
export declare class Transcript {
    readonly text: string;
    readonly isFinal: boolean;
    readonly speaker: Role;
    readonly medium: Medium;
    constructor(text: string, isFinal: boolean, speaker: Role, medium: Medium);
}
export declare class UltravoxSessionStatusChangedEvent extends Event {
    constructor();
}
export declare class UltravoxTranscriptsChangedEvent extends Event {
    constructor();
}
export declare class UltravoxExperimentalMessageEvent extends Event {
    readonly message: any;
    constructor(message: any);
}
/**
 * Event emitted by an UltravoxSession when any data message is received, including those typically
 * handled by this SDK.
 *
 * See https://docs.ultravox.ai/datamessages for message types.
 */
export declare class UltravoxDataMessageEvent extends Event {
    readonly message: any;
    constructor(message: any);
}
type ClientToolReturnType = string | {
    result: string;
    responseType: string;
};
export type ClientToolImplementation = (parameters: {
    [key: string]: any;
}) => ClientToolReturnType | Promise<ClientToolReturnType>;
/**
 * Manages a single session with Ultravox and emits events to notify consumers of
 * state changes. The following events are emitted:
 *
 * - status: The status of the session has changed.
 * - transcripts: A transcript was added or updated.
 * - experimental_message: An experimental message was received. The message is included in the event.
 *
 */
export declare class UltravoxSession extends EventTarget {
    private static CONNECTED_STATUSES;
    private readonly _transcripts;
    private _status;
    private readonly registeredTools;
    private socket?;
    private room?;
    private audioElement;
    private localAudioTrack?;
    private micSourceNode?;
    private agentSourceNode?;
    private delayedSpeakingState;
    private readonly textDecoder;
    private readonly textEncoder;
    private readonly audioContext;
    private readonly experimentalMessages;
    private _isMicMuted;
    private _isSpeakerMuted;
    /**
     * Constructor for UltravoxSession.
     * @param audioContext An AudioContext to use for audio processing. If not provided, a new AudioContext will be created.
     * @param experimentalMessages A set of experimental message types to enable. Empty by default.
     */
    constructor({ audioContext, experimentalMessages, }?: {
        audioContext?: AudioContext;
        experimentalMessages?: Set<string>;
    });
    /** Returns all transcripts for the current session. */
    get transcripts(): Transcript[];
    /** Returns the session's current status. */
    get status(): UltravoxSessionStatus;
    /**
     * Indicates whether the user's mic is currently muted for the session. (Does not inspect
     * hardware state.)
     */
    get isMicMuted(): boolean;
    /**
     * Indicates whether the user's speaker (e.g. agent output audio) is currently muted for the
     * session. (Does not inspect system volume or hardware state.)
     */
    get isSpeakerMuted(): boolean;
    /**
     * Registers a client tool implementation with the given name. If the call is
     * started with a client-implemented tool, this implementation will be invoked
     * when the model calls the tool.
     *
     * See https://docs.ultravox.ai/tools for more information.
     */
    registerToolImplementation(name: string, implementation: ClientToolImplementation): void;
    /** Convenience batch wrapper for registerToolImplementation. */
    registerToolImplementations(implementationMap: {
        [name: string]: ClientToolImplementation;
    }): void;
    /** Connects to a call using the given joinUrl. */
    joinCall(joinUrl: string, clientVersion?: string): void;
    /** Leaves the current call (if any). */
    leaveCall(): Promise<void>;
    /**
     * Sets the agent's output medium. If the agent is currently speaking, this will take effect at
     * the end of the agent's utterance. Also see muteSpeaker and unmuteSpeaker below.
     */
    setOutputMedium(medium: Medium): void;
    /** Sends a message via text. */
    sendText(text: string): void;
    sendData(obj: any): void;
    /** Mutes audio input from the user. */
    muteMic(): void;
    /** Unmutes audio input from the user. */
    unmuteMic(): void;
    /** Toggles the mute state of the user's audio input. */
    toggleMicMute(): void;
    /** Mutes audio output from the agent. */
    muteSpeaker(): void;
    /** Unmutes audio output from the agent. */
    unmuteSpeaker(): void;
    /** Toggles the mute state of the agent's output audio. */
    toggleSpeakerMute(): void;
    private handleSocketMessage;
    private handleSocketClose;
    private disconnect;
    private handleTrackSubscribed;
    private setStatus;
    private handleDataReceived;
    private addOrUpdateTranscript;
    private invokeClientTool;
    private handleClientToolResult;
    private handleClientToolFailure;
}
export {};
//# sourceMappingURL=index.d.ts.map