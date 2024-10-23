import { BaseService } from "./base.service";
import { step } from "allure-js-commons";

export class SecretService extends BaseService {
    constructor(client) {
        super(client);
        this.token_endpoint = `/secret/token`;
        this.note_endpoint = '/secret/note';
    }

    async authorization(credential) {
        return step("Authorize with credentials", async () => {
            const { status, body, headers } = await this.client.post(this.token_endpoint, { headers: credential });
            return { status, body, headers };
        });
    }

    async getNote(credential = {}) {
        return step("Get secret note", async () => {
            const { status, body } = await this.client.get(this.note_endpoint, { headers: credential });
            return { status, body };
        });
    }

    async postNote(noteText, credential = {}) {
        return step("Post secret note", async () => {
            const { status, body } = await this.client.post(this.note_endpoint, { headers: credential, data: { note: noteText } });
            return { status, body };
        });
    }
}
