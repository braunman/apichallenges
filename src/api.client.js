import { ChallengerService, ChallengesService, ToDosService } from "./service/index";
import { ApiPwClient } from "./api/pw.client";

export class ApiClient {
    static httpClient;
    constructor(options) {
        const defaultOptions = {
            URL: "https://apichallenges.herokuapp.com/",
            Accept: "*/*",
        }
        const mergeOptions = {
            ...defaultOptions,
            ...options,
        }
        this.token = mergeOptions.token
        this.client = new ApiClient.httpClient(mergeOptions)
        this.challenger = new ChallengerService(this.client, mergeOptions);
        this.challenges = new ChallengesService(this.client, mergeOptions);
        this.toDos = new ToDosService(this.client, mergeOptions);
    }
    async resultURL() {
        console.log('');
        console.log('>>>');
        console.log(`https://apichallenges.herokuapp.com/gui/challenges/${this.token}`)
        console.log('>>>');
        console.log('');
    }

    static async authorized() {
        const client = this.unauthorized();
        const response = await client.challenger.post()
        const { headers } = response;
        const token = headers["x-challenger"];
        return new ApiClient({ headers: { 'X-CHALLENGER': token }, token });
    }

    static unauthorized() {
        return new ApiClient();
    }

}