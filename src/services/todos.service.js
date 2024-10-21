import { BaseService } from "./base.service";
// import * as allure from "allure-js-commons";

export class ToDosService extends BaseService {
    constructor(client) {
        super(client)
        this.endpoint = `/todos`
    }

    async getAllTasks(requestHeaders = {}) {
        const { status, body, headers } = await this.client.get(this.endpoint, { 'headers': requestHeaders });
        return { status, tasks: body.todos, headers }
    }

    async getTaskById(id) {
        const { status, body } = await this.client.get(`${this.endpoint}/${id}`);
        return { status, task: body.todos?.[0] };
    }

    async getTasksWithStatus(taskStatus) {
        const { status, body } = await this.client.get(this.endpoint, { params: { doneStatus: taskStatus } });
        return { status, tasks: body.todos };
    }

    async createTask(task, responseHeaders) {
        const { status, body, headers } = await this.client.post(this.endpoint, { data: task, headers: responseHeaders });
        return { status, task: body, headers };
    }


    async updateTaskPost(id, task) {
        const { status, body } = await this.client.post(`${this.endpoint}/${id}`, { data: task });
        return { status, task: body };
    }

    async updateTaskPut(id, task) {
        const { status, body } = await this.client.put(`${this.endpoint}/${id}`, { data: task });
        return { status, task: body };
    }

    async deleteTask(id) {
        const { status, body } = await this.client.delete(`${this.endpoint}/${id}`);
        return { status, task: body };
    }

    async requestPoint() {
        const { status, body } = await this.client.head(this.endpoint);
        return { status, task: body };
    }

    async deleteAllTasks() {
        const { tasks } = await this.getAllTasks();
        const deletePromises = tasks.map((task) => this.deleteTask(task.id));
        await Promise.all(deletePromises);
    }
}