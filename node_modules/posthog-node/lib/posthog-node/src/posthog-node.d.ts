import { PosthogCoreOptions, PostHogFetchOptions, PostHogFetchResponse } from '../../posthog-core/src';
import { EventMessageV1, GroupIdentifyMessage, IdentifyMessageV1, PostHogNodeV1 } from './types';
export declare type PostHogOptions = PosthogCoreOptions & {
    persistence?: 'memory';
    personalApiKey?: string;
    featureFlagsPollingInterval?: number;
    requestTimeout?: number;
    maxCacheSize?: number;
    fetch?: (url: string, options: PostHogFetchOptions) => Promise<PostHogFetchResponse>;
};
export declare class PostHog implements PostHogNodeV1 {
    private _sharedClient;
    private featureFlagsPoller?;
    private maxCacheSize;
    distinctIdHasSentFlagCalls: Record<string, string[]>;
    constructor(apiKey: string, options?: PostHogOptions);
    private reInit;
    enable(): void;
    disable(): void;
    capture({ distinctId, event, properties, groups, sendFeatureFlags }: EventMessageV1): void;
    identify({ distinctId, properties }: IdentifyMessageV1): void;
    alias(data: {
        distinctId: string;
        alias: string;
    }): void;
    getFeatureFlag(key: string, distinctId: string, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
        sendFeatureFlagEvents?: boolean;
    }): Promise<string | boolean | undefined>;
    isFeatureEnabled(key: string, distinctId: string, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
        sendFeatureFlagEvents?: boolean;
    }): Promise<boolean | undefined>;
    getAllFlags(distinctId: string, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
    }): Promise<Record<string, string | boolean>>;
    groupIdentify({ groupType, groupKey, properties }: GroupIdentifyMessage): void;
    reloadFeatureFlags(): Promise<void>;
    flush(): void;
    shutdown(): void;
    shutdownAsync(): Promise<void>;
    debug(enabled?: boolean): void;
}
