import { BaseService } from "./base.service";
import { step } from "allure-js-commons";

export class ToDosService extends BaseService {
    constructor(client) {
        super(client);
        this.endpoint = `/todos`;
    }

    async getAllTasks(requestHeaders = {}) {
        return step("Get all tasks", async () => {
            const { status, body, headers } = await this.client.get(this.endpoint, { 'headers': requestHeaders });
            return { status, tasks: body.todos, headers };
        });
    }

    async getTaskById(id) {
        return step("Get task by ID", async () => {
            const { status, body } = await this.client.get(`${this.endpoint}/${id}`);
            return { status, task: body.todos?.[0] };
        });
    }

    async getTasksWithStatus(taskStatus) {
        return step("Get tasks with status", async () => {
            const { status, body } = await this.client.get(this.endpoint, { params: { doneStatus: taskStatus } });
            return { status, tasks: body.todos };
        });
    }

    async createTask(task, responseHeaders) {
        return step("Create task", async () => {
            const { status, body, headers } = await this.client.post(this.endpoint, { data: task, headers: responseHeaders });
            return { status, task: body, headers };
        });
    }

    async updateTaskPost(id, task) {
        return step("Update task via POST", async () => {
            const { status, body } = await this.client.post(`${this.endpoint}/${id}`, { data: task });
            return { status, task: body };
        });
    }

    async updateTaskPut(id, task) {
        return step("Update task via PUT", async () => {
            const { status, body } = await this.client.put(`${this.endpoint}/${id}`, { data: task });
            return { status, task: body };
        });
    }

    async deleteTask(id) {
        return step("Delete task", async () => {
            const { status, body } = await this.client.delete(`${this.endpoint}/${id}`);
            return { status, task: body };
        });
    }

    async requestPoint() {
        return step("Request endpoint via HEAD", async () => {
            const { status, body } = await this.client.head(this.endpoint);
            return { status, task: body };
        });
    }

    async deleteAllTasks() {
        return step("Delete all tasks", async () => {
            const { tasks } = await this.getAllTasks();
            const deletePromises = tasks.map((task) => this.deleteTask(task.id));
            await Promise.all(deletePromises);
        });
    }
}
