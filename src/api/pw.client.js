import { request } from 'playwright';
import { ApiBaseClient } from './base.client';
import { Response } from './default.response';
import * as allure from "allure-js-commons";


export class ApiPwClient extends ApiBaseClient {
    constructor(options) {
        super(options);
    }

    async get(endpoint) {
        await this._createContext();
        try {
            await allure.step(`Send GET request to endpoint '${endpoint}' headers: ${JSON.stringify(this.headers, null, 2)}`, async () => { })
            const response = await this.requestContext.get(endpoint);
            return await this.convertResponse(response);
        } finally {
            await this._closeContext();
        }
    }

    async post(endpoint, data) {
        await this._createContext();
        try {
            await allure.step(`Send POST request to endpoint '${endpoint}' headers: ${JSON.stringify(this.headers, null, 2)} data: ${JSON.stringify(data, null, 2)}`, async () => { })
            const response = await this.requestContext.post(endpoint, { data });
            return await this.convertResponse(response);
        } finally {
            await this._closeContext();
        }

    }


    async _createContext(extraHeaders) {
        this.headers = this.options.headers
        if (extraHeaders) {
            this.headers = {
                ...this.headers,
                ...extraHeaders,
            }
        }
        const content = {
            baseURL: this.baseURL,
            extraHTTPHeaders: this.headers,
        }
        this.requestContext = await request.newContext(content);
    }

    async _closeContext() {
        if (this.requestContext) {
            await this.requestContext.dispose();
        }
    }
    async convertResponse(response) {
        const status = response.status();
        const headers = response.headers();

        const contentType = await response.headers()['content-type'] || '';
        let body = null;
        if (contentType.includes('application/json')) {
            try {
                body = await response.json();
            } catch (error) {
                body = null;
            }
        } else {
            body = await response.text();
        }
        this.lastResponse = new Response(status, headers, body);
        await allure.step(`Get response ${JSON.stringify(this.lastResponse, null, 2)}`, async () => { });
        return this.lastResponse
    }
}