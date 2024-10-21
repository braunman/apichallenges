import { BaseService } from "./base.service";

export class ChallengesService extends BaseService {
    constructor(client) {
        super(client);
        this.endpoint = `/challenges`;
    }

    async getAllChallenges() {
        const { status, body } = await this.client.get(this.endpoint);
        return { status, challenges: body.challenges }
    }
}
