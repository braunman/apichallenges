import { BaseService } from "./base.service";
import * as allure from "allure-js-commons";

export class ChallengesService extends BaseService {
    constructor(client, options) {
        super(client, options)
        this.endpoint = `/challenges`
    }

    async getAllChallenges() {
        let response;
        await allure.step("Get token ", async () => {
            response = await this.client.get(this.endpoint);
        })
        console.log(response)
        return response.body.challenges;
    }
}
