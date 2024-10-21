import { BaseService } from "./base.service";

export class SecretService extends BaseService {
    constructor(client) {
        super(client);
        this.token_endpoint = `/secret/token`;
        this.note_endpoint = '/secret/note';
    }

    async authorization(credential) {
        const { status, body, headers } = await this.client.post(this.token_endpoint, { headers: credential });
        return { status, body, headers }
    }

    async getNote(credential = {}) {
        const { status, body, headers } = await this.client.get(this.note_endpoint, { headers: credential });
        return { status, body }
    }

    async postNote(noteText, credential = {}) {
        const { status, body, headers } = await this.client.post(this.note_endpoint, { headers: credential, data: { note: noteText } });
        return { status, body }
    }

}
