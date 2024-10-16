import { BaseService } from "./base.service";
import * as allure from "allure-js-commons";

export class ChallengerService extends BaseService {
    constructor(client, options) {
        super(client, options)
        this.endpoint = `/challenger`
    }

    async post() {
        let response;
        await allure.step("Get token ", async () => {
            response = await this.client.post(this.endpoint);
        })
        return response;
    }
}