import { Readable } from "node:stream";
import { parse as parseQuery } from 'node:querystring';
import { parseCookies } from "../../utils/parseCookies";
import { TurboRawRequest, type TurboParsedUrlQuery } from "../../types/request";

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

    constructor(request: TurboRawRequest) {
        super();
        this.#method = this.#parseMethod(request.method);
        this.#url = request.url || '';
        this.#headers = request.headers;
        const { path, query } = this.#parseUrl(this.#url, this.#headers['host'] as string);
        this.#path = path;
        this.#query = query;
        this.#cookies = parseCookies(this.#headers['cookie']?.toString() || '');
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
}