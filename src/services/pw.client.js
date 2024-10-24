import { step } from "allure-js-commons";

export class PlaywrightApiClient {
    constructor(client, options) {
        this.client = client;
        this.baseURL = options.baseURL;
        this.headers = options.headers || {}
    }

    async post(endpoint, options) {
        return step(`POST request to ${endpoint}`, async () => {
            const response = await this.client.post(`${this.baseURL}${endpoint}`, await this.createOptions(options));
            const result = await this.convertResponse(response);
            return result;
        });
    }

    async get(endpoint, options) {
        return step(`GET request to ${endpoint}`, async () => {
            const response = await this.client.get(`${this.baseURL}${endpoint}`, await this.createOptions(options));
            const result = await this.convertResponse(response);
            return result;
        });
    }

    async put(endpoint, options) {
        return step(`PUT request to ${endpoint}`, async () => {
            const response = await this.client.put(`${this.baseURL}${endpoint}`, await this.createOptions(options));
            const result = await this.convertResponse(response);
            return result;
        });
    }

    async delete(endpoint, options) {
        return step(`DELETE request to ${endpoint}`, async () => {
            const response = await this.client.delete(`${this.baseURL}${endpoint}`, await this.createOptions(options));
            const result = await this.convertResponse(response);
            return result;
        });
    }

    async patch(endpoint, options) {
        return await step(`PATCH request to ${endpoint}`, async () => {
            const response = await this.client.patch(`${this.baseURL}${endpoint}`, await this.createOptions(options));
            const result = await this.convertResponse(response);
            return result;
        });
    }

    async head(endpoint, options) {
        return step(`HEAD request to ${endpoint}`, async () => {
            const response = await this.client.head(`${this.baseURL}${endpoint}`, await this.createOptions(options));
            const result = await this.convertResponse(response);
            return result;
        });
    }

    async convertResponse(response) {
        let body;
        let bodyAsString;
        try {
            body = await response.json();
            bodyAsString = JSON.stringify(body, null, 2)
        } catch {
            body = await response.text();
            bodyAsString = body;
        }
        const status = response.status();
        const headers = response.headers();
        const headerAsString = JSON.stringify(headers, null, 2);
        await step(`Response Status:  ${status}`, async () => { });
        await step(`Response Headers:  ${headerAsString}`, async () => { });
        await step(`Response Body: ${bodyAsString}`, async () => { });
        return { status, body, headers };
    }

    async createOptions(requestData) {
        const possibleOptions = ['headers', 'data', 'params'];
        const options = {};
        for (const key in requestData) {
            if (possibleOptions.includes(key)) {
                if (requestData[key]) {
                    options[key] = requestData[key];
                }
            }
            else {
                throw new Error(`Request option could not have key ${key}`);
            }
        }
        options['headers'] = {
            ...this.headers,
            ...options?.['headers'],
        };
        const optionsAsString = JSON.stringify(options, null, 2);
        await step(`Request options ${optionsAsString}`, async () => { });
        return options;
    }
}
