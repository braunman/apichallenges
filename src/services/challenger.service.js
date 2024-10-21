import { BaseService } from "./base.service";
import { step } from "allure-js-commons";

export class ChallengerService extends BaseService {
    constructor(client) {
        super(client);
        this.endpoint = `/challenger`;
    }

    async getToken() {
        return step("Get challenger token", async () => {
            const { headers } = await this.client.post(this.endpoint);
            return headers['x-challenger'];
        });
    }

    async getProgress() {
        const guid = this.client.headers['X-CHALLENGER'];
        return step("Get challenger progress", async () => {
            const { status, body } = await this.client.get(`${this.endpoint}/${guid}`);
            return { status, body };
        });
    }

    async restoreProgress(progress, guid = null) {
        const _guid = guid ? guid : this.client.headers['X-CHALLENGER'];
        return step("Restore challenger progress", async () => {
            const { status, body } = await this.client.put(`${this.endpoint}/${_guid}`, { data: progress });
            return { status, body };
        });
    }

    async getProgressDB() {
        const guid = this.client.headers['X-CHALLENGER'];
        return step("Get progress from database", async () => {
            const { status, body } = await this.client.get(`${this.endpoint}/database/${guid}`);
            return { status, body };
        });
    }

    async restoreProgressDB(progress, guid = null) {
        const _guid = guid ? guid : this.client.headers['X-CHALLENGER'];
        return step("Restore progress in database", async () => {
            const { status, body } = await this.client.put(`${this.endpoint}/database/${_guid}`, { data: progress });
            return { status, body };
        });
    }
}
