import { ChallengerService, PlaywrightApiClient, ChallengesService, ToDosService, HeartbeatService, SecretService } from './services/index';

export class ApiClient {

    constructor(apiClient, options) {
        const defaultOptions = {
            baseURL: "https://apichallenges.herokuapp.com",
            headers: { Accept: "*/*" }
        }
        const mergeOptions = {
            ...defaultOptions,
            ...options,
        }
        this.client = new PlaywrightApiClient(apiClient, mergeOptions)
        this.challenger = new ChallengerService(this.client);
        this.challenges = new ChallengesService(this.client);
        this.toDos = new ToDosService(this.client);
        this.heartbeat = new HeartbeatService(this.client);
        this.secret = new SecretService(this.client);
    };

    static async loginAs(client) {
        const apiClient = this.unauthorized(client);
        const token = await apiClient.challenger.getToken();
        console.log('');
        console.log('>>>');
        console.log(`https://apichallenges.herokuapp.com/gui/challenges/${token}`)
        console.log('>>>');
        console.log('');
        return new ApiClient(client, { headers: { 'X-CHALLENGER': token } });
    }

    static unauthorized(client) {
        return new ApiClient(client);
    }
};