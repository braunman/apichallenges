import { ChallengerService, PlaywrightApiClient, ChallengesService, ToDosService, HeartbeatService, SecretService } from './services/index';
import { writeJson, isFileRecentlyCreated, readJson } from './helpers/index';

const tokenFileName = 'token.json'

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
        const isGoodFile = await isFileRecentlyCreated(tokenFileName)
        let token;
        if (isGoodFile) {
            const data = await readJson(tokenFileName);
            token = data.token;
        } else {
            const apiClient = this.unauthorized(client);
            token = await apiClient.challenger.getToken();
        }
        return new ApiClient(client, { headers: { 'X-CHALLENGER': token } });
    }

    async setTokenToStorage() {
        const isGoodFile = await isFileRecentlyCreated(tokenFileName)
        if (!isGoodFile) {
            const token = this.client.headers['X-CHALLENGER'];
            await writeJson(tokenFileName, { token })
            console.log('');
            console.log('>>>');
            console.log(`https://apichallenges.herokuapp.com/gui/challenges/${token}`)
            console.log('>>>');
            console.log('');
        }
    }

    static unauthorized(client) {
        return new ApiClient(client);
    }
};