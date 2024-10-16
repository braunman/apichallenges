export class Response {
    constructor(status, headers, body) {
        this.status = status;
        this.headers = headers;
        this.body = body;
        this.error = this.body?.errorMessages ?? NaN
    }

    toString() {
        return `Response:\n\nStatus ${this.status}\n\nHeaders: ${JSON.stringify(this.headers, null, 2)}\n\nBody: ${this.body}`;
    }
}