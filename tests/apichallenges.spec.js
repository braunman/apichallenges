import { test, expect } from '@playwright/test';
import { ApiClient } from '../src/api.client';
import { ApiPwClient, ApiAxiosClient } from '../src/api/index';
import { TaskBuilder, getTasksIdByStatus } from '../src/helpers/index';




test.describe('Test API challenges', () => {
    let client;
    test.beforeAll(async () => {
        ApiClient.httpClient = ApiPwClient;
        // ApiClient.httpClient = ApiAxiosClient;
        client = await ApiClient.authorized();

    })

    test.afterAll(async () => {
        client.resultURL();

    })

    test("Get all challenges /challenges @API", async ({ }) => {
        const challenges = await client.challenges.getAllChallenges();
        expect(client.challenges.getLastResponseStatus()).toEqual(200);
        expect(challenges).toHaveLength(59);
    })

    test("Get all tasks /todos (200) @API", async ({ }) => {
        const tasks = await client.toDos.getAllTasks();
        expect(client.toDos.getLastResponseStatus()).toEqual(200);
        expect(tasks).toBeTruthy();
    });

    test("Get error on wrong endpoint /todo (404) @API", async ({ }) => {
        const toDos = await client.toDos.wrongEndpoint();
        expect(client.toDos.getLastResponseStatus()).toEqual(404);
    });

    test("Get task by id /todos/{id} (200) GET @API", async ({ }) => {
        const taskId = 1;
        const { id } = await client.toDos.getTaskById(taskId);
        expect(client.toDos.getLastResponseStatus(id)).toEqual(200);
        expect(id).toEqual(taskId)
    });

    test("Get task by wrong id /todos/{id} (200) GET @API", async ({ }) => {
        const taskId = 2000001;
        const task = await client.toDos.getTaskById(taskId);
        expect(client.toDos.getLastResponseStatus()).toEqual(404);
        expect(task).toBeUndefined();
    });

    test("Get task with status 'done' /todos ? (200) GET @API", async ({ }) => {
        const newDoneTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus(true).build()

        await client.toDos.createTask(newDoneTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(201);

        const newTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus().build()
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(201);

        const filteredTasks = await client.toDos.getTasksWithStatus(true);
        expect(client.toDos.getLastResponseStatus()).toEqual(200);
        const allTasks = await client.toDos.getAllTasks();
        const allFilteredTasks = getTasksIdByStatus(allTasks, { doneStatus: true });
        expect(filteredTasks).toEqual(allFilteredTasks)
    });

    test("Create task with wrong doneStatus /todos (400) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus('I did it').build()
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(400);
        expect(client.toDos.getLastResponseError()).toEqual(["Failed Validation: doneStatus should be BOOLEAN but was STRING"]);

    });

    test("Create task with title exceeds maximum allowable characters /todos (400) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle(51).addDescription().addDoneStatus().build()
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(400);
        expect(client.toDos.getLastResponseError()).toEqual(["Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50"]);

    });

    test("Create task with description exceeds maximum allowable characters /todos (400) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle().addDescription(201).addDoneStatus().build()
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(400);
        expect(client.toDos.getLastResponseError()).toEqual(["Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200"]);

    });

    test("Create task with  description nd title maximum allowable characters /todos (201) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle(50).addDescription(200).addDoneStatus().build()
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(201);
        expect(client.toDos.getLastResponseError()).toEqual(NaN);

    });

    test("Create task with  description nd title maximum allowable characters /todos (413) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle().addDescription(5001).addDoneStatus().build()
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(413);
        expect(client.toDos.getLastResponseError()).toEqual(["Error: Request body too large, max allowed is 5000 bytes"]);

    });

    test("Create task with contains an unrecognised field /todos (400) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus().build({ test: "me" })
        await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(400);
        expect(client.toDos.getLastResponseError()).toEqual(['Could not find field: test']);

    });

    test("Update task  /todos/{id} (200) POST @API", async ({ }) => {
        const newTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus().build()
        const { id } = await client.toDos.createTask(newTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(201);
        const updateTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus(true).build()
        const { title, description, doneStatus } = await client.toDos.updateTask(id, updateTask)
        expect(client.toDos.getLastResponseStatus()).toEqual(200);
        expect(title).toEqual(updateTask.title)
        expect(description).toEqual(updateTask.description)
        expect(doneStatus).toEqual(updateTask.doneStatus)

    });

    test("Update not exist task  /todos/{id} (404) POST @API", async ({ }) => {
        const updateTask = await new TaskBuilder().addTitle().addDescription().addDoneStatus(true).build()
        await client.toDos.updateTask(2000001, updateTask);
        expect(client.toDos.getLastResponseStatus()).toEqual(404);

    });



})