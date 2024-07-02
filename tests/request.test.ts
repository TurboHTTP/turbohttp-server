import { TurboRawRequest } from "../src/types/request";
import { Request } from "../src/server/request/request";

describe('Request', () => {
    let rawRequest: TurboRawRequest
    let request: Request

    beforeEach(() => {
        rawRequest = {
            method: 'GET',
            url: 'http://localhost/test?name=value',
            headers: {
                'content-type': 'application/json',
                'cookie': 'key=value',
                'host': 'localhost'
            },
            socket: {
                remoteAddress: '127.0.0.1'
            },
            pause: jest.fn(),
            resume: jest.fn(),
            on: jest.fn()
        }
        request = new Request(rawRequest)
    })

    it('should parse method, url, path, query, headers, and cookies correctly', () => {
        expect(request.method).toBe('GET');
        expect(request.url).toBe('http://localhost/test?name=value');
        expect(request.path).toBe('/test');
        expect(request.query).toEqual({ name: 'value' });
        expect(request.headers['content-type']).toBe('application/json');
        expect(request.cookies['key']).toBe('value');
    });
})