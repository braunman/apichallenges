export class BaseService {
    constructor(client, options) {
        this.client = client;
        this.options = options;
        this.endpoint;
    }

    getLastResponseStatus() {
        return this.client.lastResponse.status
    }
    getLastResponseError() {
        return this.client.lastResponse.error
    }
}