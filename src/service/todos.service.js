import { BaseService } from "./base.service";
import * as allure from "allure-js-commons";

export class ToDosService extends BaseService {
    constructor(client, options) {
        super(client, options)
        this.endpoint = `/todos`
    }

    async getAllTasks() {
        let response;
        await allure.step("Get all tacks ", async () => {
            response = await this.client.get(this.endpoint);
        })
        return response.body.todos;
    }

    async wrongEndpoint() {
        let response;
        await allure.step("Get request to wrong endpoint", async () => {
            response = await this.client.get('/todo');
        })
        return response;
    }

    async getTaskById(id) {
        let response;
        await allure.step("Get task by ID", async () => {
            response = await this.client.get(`${this.endpoint}/${id}`);
        })
        return response.body.todos?.[0];
    }

    async getTasksWithStatus(status) {
        let response;
        await allure.step(`Get task by Status ${status}`, async () => {
            response = await this.client.get(`${this.endpoint}?doneStatus=${status}`);
        })
        return response.body.todos;
    }

    async createTask(task) {
        let response;
        await allure.step(`Create task with params  ${JSON.stringify(task, null, 2)}`, async () => {
            response = await this.client.post(this.endpoint, task);
        })
        return response.body;
    }

    async updateTask(id, task) {
        let response;
        await allure.step(`Update task ${id} with params  ${JSON.stringify(task, null, 2)}`, async () => {
            response = await this.client.post(`${this.endpoint}/${id}`, task);
        })
        console.log(response)
        return response.body;
    }
}