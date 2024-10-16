export class ApiBaseClient {
    constructor(options) {
        this.options = options;
        this.baseURL = this.options.URL;
        this.lastResponse = NaN;
    }
    async get(endpoint) {
        throw new Error('Method not implemented');
    }

    async post(endpoint, data) {
        throw new Error('Method not implemented');
    }

    // async delete(endpoint) {
    //     throw new Error('Method not implemented');
    // }
}

