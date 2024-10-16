import axios from 'axios';
import { ApiBaseClient } from './base.client';
import { Response } from './default.response';
import * as allure from "allure-js-commons";


export class ApiAxiosClient extends ApiBaseClient {
    constructor(options) {
        super(options);
        this.client = axios.create({ baseURL: this.baseURL, headers: this.options.headers })

    }

    async get(endpoint) {
        let response
        await allure.step(`Send GET request to endpoint '${endpoint}' headers: ${JSON.stringify(this.headers, null, 2)}`, async () => { });
        try {
            response = await this.client.get(endpoint, this.config)
        } catch (error) {
            if (error.response) {
                response = error.response;
            }
        }
        // console.log(response.data)
        return await this.convertResponse(response)

    }

    async post(endpoint, data) {
        let response
        await allure.step(`Send POST request to endpoint '${endpoint}' headers: ${JSON.stringify(this.headers, null, 2)} data: ${JSON.stringify(data, null, 2)}`, async () => { })
        try {
            response = await this.client.post(endpoint, data);
        } catch (error) {
            if (error.response) {
                response = error.response;
            }

        }
        return await this.convertResponse(response);


    }



    async convertResponse(response) {
        const status = response.status;
        const headers = response.headers;
        const body = response.data;
        this.lastResponse = new Response(status, headers, body);
        await allure.step(`Get response ${JSON.stringify(this.lastResponse, null, 2)}`, async () => { });
        return this.lastResponse
    }
}