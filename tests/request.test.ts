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

    describe('Body Parsing', () => {
        beforeEach(() => {
            rawRequest.method = 'POST'
        })

        it('should parse body as raw buffer', async () => {
            const rawData = Buffer.from('test buffer data')
            request.push(rawData)
            request.push(null)
            const buffer = await request.parseBodyAsBuffer()
            expect(buffer).toEqual(rawData)
        })

        it('should parse body as JSON', async () => {
            const jsonData = { key: 'value'}
            request.push(Buffer.from(JSON.stringify(jsonData)))
            request.push(null);
            const json = await request.parseBodyAsJson();
            expect(json).toEqual(jsonData);
        })

        it('should throw error for invalid JSON body', async () => {
            request.push(Buffer.from('invalid JSON'));
            request.push(null);
            await expect(request.parseBodyAsJson()).rejects.toThrow(SyntaxError);
        });

        it('should handle empty body for URL-encoded parsing', async () => {
            const emptyData = '';
            request.push(Buffer.from(emptyData));
            request.push(null);
            const parsedData = await request.parseBodyAsUrlEncoded();
            expect(parsedData).toEqual({});
        });

        it('should handle large body for raw buffer parsing', async () => {
            const largeData = Buffer.alloc(1024 * 1024, 'a');
            request.push(largeData);
            request.push(null);
            const buffer = await request.parseBodyAsBuffer();
            expect(buffer).toEqual(largeData);
        });

        it('should handle large body for JSON parsing', async () => {
            const largeData = { data: 'a'.repeat(1024 * 1024) }; // 1MB of 'a'
            request.push(Buffer.from(JSON.stringify(largeData)));
            request.push(null);
            const json = await request.parseBodyAsJson();
            expect(json).toEqual(largeData);
        });

        it('should handle large body for URL-encoded parsing', async () => {
            const largeData = 'key=' + 'a'.repeat(1024 * 1024); // 1MB of 'a'
            request.push(Buffer.from(largeData));
            request.push(null);
            const parsedData = await request.parseBodyAsUrlEncoded();
            expect(parsedData).toEqual({ key: 'a'.repeat(1024 * 1024) });
        });


        it('should parse body as URL-encoded data', async () => {
            const formData = 'key=value&anotherKey=anotherValue';
            request.push(Buffer.from(formData));
            request.push(null);
            const parsedData = await request.parseBodyAsUrlEncoded();
            expect(parsedData).toEqual({
                key: 'value',
                anotherKey: 'anotherValue'
            });
        });
    })

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