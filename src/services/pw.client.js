export class PlaywrightApiClient {
    constructor(client, options) {
        this.client = client;
        this.baseURL = options.baseURL;
        this.headers = options.headers || {}
    }

    async post(endpoint, options) {
        const response = await this.client.post(`${this.baseURL}${endpoint}`, this.createOptions(options))
        return await this.convertResponse(response)
    }

    async get(endpoint, options) {
        const response = await this.client.get(`${this.baseURL}${endpoint}`, this.createOptions(options))

        return await this.convertResponse(response)
    }

    async put(endpoint, options) {
        const response = await this.client.put(`${this.baseURL}${endpoint}`, this.createOptions(options))
        return await this.convertResponse(response)
    }

    async delete(endpoint, options) {
        const response = await this.client.delete(`${this.baseURL}${endpoint}`, this.createOptions(options))
        return await this.convertResponse(response)
    }

    async patch(endpoint, options) {
        const response = await this.client.patch(`${this.baseURL}${endpoint}`, this.createOptions(options))
        return await this.convertResponse(response)
    }

    async head(endpoint, options) {
        const response = await this.client.head(`${this.baseURL}${endpoint}`, this.createOptions(options))
        return await this.convertResponse(response)
    }

    async convertResponse(response) {
        let body;
        try {
            body = await response.json();
        } catch (error) {
            body = await response.text();
        }
        const status = response.status()
        const headers = response.headers()
        return { status, body, headers }

    }

    createOptions(requestData) {
        const possibleOptions = ['headers', 'data', 'params']
        const options = {}
        for (const key in requestData) {
            if (possibleOptions.includes(key)) {
                if (!!requestData[key]) {
                    options[key] = requestData[key]
                }
            }
            else {
                throw new Error(`Request option could not have key ${key}`)
            }
        }
        options['headers'] = {
            ...this.headers,
            ...options?.['headers'],
        };
        return options
    }

}