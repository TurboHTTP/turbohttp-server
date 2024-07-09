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
                'cookie': 'name=value; signed_name=s:signedsamplevalue',
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

    describe('Request Initialization', () => {
        it('should parse method correctly', () => {
            expect(request.method).toBe('GET');
        });

        it('should parse url correctly', () => {
            expect(request.url).toBe('http://localhost/test?name=value');
        });

        it('should parse path correctly', () => {
            expect(request.path).toBe('/test');
        });

        it('should parse query correctly', () => {
            expect(request.query).toEqual({ name: 'value' });
        });

        it('should parse headers correctly', () => {
            expect(request.headers['content-type']).toBe('application/json');
        });

        it('should parse cookies correctly', () => {
            expect(request.cookies['name']).toBe('value');
        });
    });

    describe('Cookie Parsing', () => {
        it('should parse cookies from the headers', () => {
            expect(request.cookies).toEqual({
                name: 'value',
                signed_name: 's:signedsamplevalue'
            });
        });
    });

    describe('Cookie Signing and Unsigning', () => {
        const secret = 'testsecret';

        it('should sign a cookie value', () => {
            const signedValue = request.signCookie('value', secret);
            expect(signedValue).toBeTruthy();
            expect(signedValue).toMatch(/^s:.*\..*$/);
        });

        it('should unsign a valid signed cookie value', () => {
            const signedValue = request.signCookie('value', secret);
            const unsignedValue = request.unsignCookie(signedValue, secret);
            expect(unsignedValue).toBe('value');
        });

        it('should not unsign an invalid signed cookie value', () => {
            const unsignedValue = request.unsignCookie('s:invalidvalue.signature', secret);
            expect(unsignedValue).toBe(false);
        });
    });

    describe('Utility Methods', () => {
        it('should parse the method correctly', () => {
            expect(request.method).toBe('GET');
        });

        it('should parse the URL correctly', () => {
            expect(request.url).toBe('http://localhost/test?name=value');
        });

        it('should parse the path correctly', () => {
            expect(request.path).toBe('/test');
        });

        it('should parse the query correctly', () => {
            expect(request.query).toEqual({ name: 'value' });
        });

        it('should parse the headers correctly', () => {
            expect(request.headers['content-type']).toBe('application/json');
        });

        it('should parse cookies correctly', () => {
            expect(request.cookies['name']).toBe('value');
        });
    });

    describe('Error Handling', () => {
        it('should return empty object if no cookies are present', () => {
            rawRequest.headers['cookie'] = '';
            request = new Request(rawRequest);
            expect(request.cookies).toEqual({});
        });

        it('should handle malformed cookie headers gracefully', () => {
            rawRequest.headers['cookie'] = 'malformedcookie';
            request = new Request(rawRequest);
            expect(request.cookies).toEqual({});
        });
    });
})