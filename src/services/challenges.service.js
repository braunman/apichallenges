import { BaseService } from "./base.service";
import { step } from "allure-js-commons";

export class ChallengesService extends BaseService {
    constructor(client) {
        super(client);
        this.endpoint = `/challenges`;
    }

    async getAllChallenges() {
        return step("Get all challenges", async () => {
            const { status, body } = await this.client.get(this.endpoint);
            return { status, challenges: body.challenges };
        });
    }
}