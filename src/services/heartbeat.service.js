import { step } from "allure-js-commons";

import { BaseService } from "./base.service";

export class HeartbeatService extends BaseService {
    constructor(client) {
        super(client);
        this.endpoint = `/heartbeat`;
    }

    async delete() {
        return step("Delete heartbeat", async () => {
            const { status, body } = await this.client.delete(this.endpoint);
            return { status, body };
        });
    }

    async patch() {
        return await step("Patch heartbeat", async () => {
            const { status, body } = await this.client.patch(this.endpoint);
            return { status, body };
        });
    }

    async serverRunning() {
        return step("Check if server is running", async () => {
            const { status, body } = await this.client.get(this.endpoint);
            return { status, body };
        });
    }

    async overrideMethod(requestOptions) {
        return step("Override heartbeat method", async () => {
            const { status, body } = await this.client.post(this.endpoint, { headers: requestOptions });
            return { status, body };
        });
    }
}
