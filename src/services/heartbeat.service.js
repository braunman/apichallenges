import { BaseService } from "./base.service";

export class HeartbeatService extends BaseService {
    constructor(client) {
        super(client);
        this.endpoint = `/heartbeat`;
    }

    async delete() {
        const { status, body } = await this.client.delete(this.endpoint);
        return { status, body }
    }

    async patch() {
        const { status, body } = await this.client.patch(this.endpoint);
        return { status, body }
    }

    async serverRunning() {
        const { status, body } = await this.client.get(this.endpoint);
        return { status, body }
    }
    async overrideMethod(requestOptions) {
        const { status, body } = await this.client.post(this.endpoint, { headers: requestOptions })
        return { status, body };
    }
}
