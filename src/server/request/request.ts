import { Readable } from "node:stream";
import { parse as parseQuery } from 'node:querystring';
import { TurboRawRequest, type TurboParsedUrlQuery } from "../../types/request";

/**
 * Represents a middleware function.
 */
export type Middleware = (req: Request, next: () => Promise<void>) => Promise<void>

/**
 * Represents an HTTP request.
 */
export class Request extends Readable {
    #method: string;
    #url: string;
    #path: string;
    #query: TurboParsedUrlQuery;
    #headers: Record<string, string | string[]>;
    #cookies: Record<string, string>;
    #body: Buffer | null = null;
    #socket: {
        remoteAddress?: string
    }
    #middlewares: Middleware[] = []

    constructor(request: TurboRawRequest) {
        super();
        this.#method = this.#parseMethod(request.method);
        this.#url = request.url || '';
        this.#headers = request.headers;
        const { path, query } = this.#parseUrl(this.#url, this.#headers['host'] as string);
        this.#path = path;
        this.#socket = request.socket
        this.#query = query;
        this.#cookies = this.#parseCookies(this.#headers['cookie']?.toString() || '');
    }

    get method(): string {
        return this.#method;
    }

    get url(): string {
        return this.#url;
    }

    get path(): string {
        return this.#path;
    }

    get query(): TurboParsedUrlQuery {
        return this.#query;
    }

    get headers(): Record<string, string | string[]> {
        return this.#headers;
    }

    get cookies(): Record<string, string> {
        return this.#cookies;
    }

    #parseMethod(method?: string): string {
        return method?.toUpperCase() || '';
    }

    #parseUrl(url: string, host: string): { path: string; query: TurboParsedUrlQuery } {
        const parsedUrl = new URL(url, `http://${host}`);
        const path = parsedUrl.pathname;
        const query = parseQuery(parsedUrl.searchParams.toString()) as TurboParsedUrlQuery;
        return { path, query };
    }

    /**
     * Parses cookies from the Cookie header string.
     * @param cookieHeader - The Cookie header string.
     * @returns An object representing the parsed cookies.
     */
    #parseCookies(cookieHeader: string): Record<string, string> {
        const cookies: Record<string, string> = {};
        if (!cookieHeader) return cookies;

        const pairs = cookieHeader.split(';');
        for (const pair of pairs) {
            const [name, ...value] = pair.trim().split('=');
            if (name && value.length) {
                cookies[name] = value.join('=');
            }
        }

        return cookies;
    }

    /**
     * Signs a cookie value using the provided secret.
     * @param value - The value to sign.
     * @param secret - The secret to use for signing.
     * @returns The signed cookie value.
     */
    signCookie(value: string, secret: string): string {
        const hmac = this.#createHmac(secret, value);
        return `s:${value}.${hmac}`;
    }

    /**
     * Unsigns a signed cookie value using the provided secret.
     * @param signedValue - The signed cookie value to unsign.
     * @param secret - The secret to use for unsigning.
     * @returns The original value if the signature is valid, or false if invalid.
     */
    unsignCookie(signedValue: string, secret: string): string | false {
        const [value, hmac] = signedValue.slice(2).split('.');
        if (this.#createHmac(secret, value) === hmac) {
            return value;
        }
        return false;
    }

    /**
     * Creates an HMAC hash using the provided secret and value.
     * @param secret - The secret to use for hashing.
     * @param value - The value to hash.
     * @returns The HMAC hash.
     */
    #createHmac(secret: string, value: string): string {
        const crypto = require('crypto');
        return crypto.createHmac('sha256', secret).update(value).digest('hex');
    }

    /**
     * Parses the body as a raw buffer.
     * @returns A promise that resolves to the raw buffer.
     */
    async parseBodyAsBuffer(): Promise<Buffer> {
        if (this.#body) return this.#body;
        this.#body = await this.#getRawBody();
        return this.#body;
    }

    /**
     * Parses the body as a JSON object.
     * @returns A promise that resolves to the parsed JSON object.
     */
    async parseBodyAsJson<T = any>(): Promise<T> {
        const buffer = await this.parseBodyAsBuffer();
        return JSON.parse(buffer.toString());
    }

    /**
     * Parses the body as URL-encoded data.
     * @returns A promise that resolves to the parsed URL-encoded object.
     */
    async parseBodyAsUrlEncoded(): Promise<Record<string, any>> {
        const buffer = await this.parseBodyAsBuffer();
        return parseQuery(buffer.toString());
    }

    /**
     * Helper method to read the raw body from the request.
     * @returns A promise that resolves to the raw buffer.
     */
    #getRawBody(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            this.on('data', chunk => chunks.push(Buffer.from(chunk)));
            this.on('end', () => resolve(Buffer.concat(chunks)));
            this.on('error', reject);
        });
    }

    /**
     * Gets the client's IP address.
     * @returns {string} The client's IP address.
     */
    getClientIp(): string {
        return this.#headers['x-forwarded-for']
            ? (this.#headers['x-forwarded-for'] as string).split(',')[0].trim()
            : this.#socket.remoteAddress || '';
    }

    /**
     * Gets the proxy IP address.
     * @returns {string} The proxy IP address, or an empty string if no proxy is used.
     */
    getProxyIp(): string {
        return this.#headers['x-forwarded-for']
            ? this.#socket.remoteAddress || ''
            : '';
    }
}