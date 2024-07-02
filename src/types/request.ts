import { Readable } from "node:stream";

/**
 * Represents a multipart field in a form data submission.
 */
export interface TurboMultipartField {
    name: string;
    value: string | Readable;
    info: Record<string, any>;
}

/**
 * Represents the raw response object.
 */
export interface TurboRawResponse {
    pause: () => void;
    resume: () => void;
    on: (event: string, listener: (chunk: any) => void) => void;
}

/**
 * Represents the raw request object.
 */
export interface TurboRawRequest {
    method?: string;
    url?: string;
    headers: Record<string, string | string[]>;
    socket: {
        remoteAddress?: string;
    };
    pause: () => void;
    resume: () => void;
    on: (event: string, listener: (chunk: any) => void) => void;
}

/**
 * Represents parsed URL query parameters.
 */
export type TurboParsedUrlQuery = Record<string, string | string[] | undefined>;

/**
 * Options for parsing cookies.
 */
export interface TurboCookieParseOptions {
    decode?: (value: string) => string;
}