import crypto from 'crypto';
import { expect, test } from '@playwright/test';

import { ApiClient } from '../src/api.client';
import { convertToBase64, TaskBuilder, toJSON, toXML } from '../src/helpers/index';

let client;
let apiContext;

test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext();
    client = await ApiClient.loginAs(apiContext);

    //  clear all tasks before start tests
    await client.toDos.deleteAllTasks();

});


test.afterAll(async ({ }) => {
    await apiContext.dispose();
});

// GET /challenges (200)
test("02 Fetch challenges list @API", async ({ }) => {
    const { status, challenges } = await client.challenges.getAllChallenges()
    expect(status).toEqual(200)
    expect(challenges).toHaveLength(59)
})

// GET /todos (200)
test("03 Retrieve all todos @API", async ({ }) => {
    const { status, tasks } = await client.toDos.getAllTasks();
    expect(status).toEqual(200)
    expect(tasks).toBeTruthy();
});

// GET /todo (404)
test("04 Access non-existent endpoint @API", async ({ }) => {
    const { status } = await client.toDos.client.get('/todo');
    expect(status).toEqual(404)
});

// GET /todos/{id} (200)
test("05 Get specific todo @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createdTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createdTaskStatus).toEqual(201);
    const { status, task } = await client.toDos.getTaskById(createdTask.id);
    expect(status).toEqual(200);
    expect(task.id).toEqual(createdTask.id)
});

// GET /todos/{id} (404)
test("06 Request non-existent todo @API", async ({ }) => {
    const taskId = 2000001;
    const { status, task } = await client.toDos.getTaskById(taskId);
    expect(status).toEqual(404);
    expect(task).toBeUndefined();
});


// GET /todos (200) ?filter
test("07 Filter completed todos @API", async ({ }) => {
    // add task with status done
    const newDoneTask = new TaskBuilder().getNormalTask().create({ doneStatus: true })
    let { status: DoneTaskStatus } = await client.toDos.createTask(newDoneTask);
    expect(DoneTaskStatus).toEqual(201);
    // add task with status undone
    const newUnDoneTask = new TaskBuilder().getNormalTask().create()
    let { status: UnDoneTaskStatus } = await client.toDos.createTask(newUnDoneTask);
    expect(UnDoneTaskStatus).toEqual(201);

    const { status, tasks: filteredTasks } = await client.toDos.getTasksWithStatus(true);
    expect(status).toEqual(200);
    const { tasks: allTasks } = await client.toDos.getAllTasks();
    expect(filteredTasks).toEqual(allTasks.filter((task) => !!task.doneStatus))

});

// HEAD /todos (200)
test("08 Check todos endpoint availability @API", async ({ }) => {
    let { status } = await client.toDos.requestPoint();
    expect(status).toEqual(200);
});

// POST /todos (201)
test("09 Create todo successfully @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(201);
    expect(typeof task.id).toBe('number')
    expect(task.title).toEqual(newTask.title)
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual(newTask.description)
});

// POST /todos (400) doneStatus
test("10 Validation error on done status @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDoneStatus("I did IT!!").create()
    let { status } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
});


// POST /todos (400) title too long
test("11 Error with overly long title @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addTitle(51).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50"]);
});

// POST /todos (400) description too long
test("12 Error with overly long description @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDescription(201).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200"]);
});

// POST /todos (201) max out content
test("13 Create todo with maximum allowed content @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDescription(200).addTitle(50).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(201);
    expect(task.title).toEqual(newTask.title)
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual(newTask.description)
});

// POST /todos (413) content too long
test("14 Error exceeding maximum request size @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDescription(5001).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(413);
    expect(task.errorMessages).toEqual(["Error: Request body too large, max allowed is 5000 bytes"]);
});

// POST /todos (400) extra
test("15 Error with unknown field @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create({ good: 'No' })
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["Could not find field: good"]);
});

// PUT /todos/{id} (400)
test("16 Unsuccessful todo update via PUT @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status } = await client.toDos.client.put("/todos/2001", { data: newTask });
    expect(status).toEqual(400);
});


// POST /todos/{id} (200)
test("17 Successful todo update via POST @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    const updateTask = new TaskBuilder().getNormalTask().create()
    let { status, task } = await client.toDos.updateTaskPost(taskId, updateTask);
    expect(status).toEqual(200);
    expect(task.id).toEqual(taskId)
    expect(task.title).toEqual(updateTask.title)
    expect(task.doneStatus).toEqual(updateTask.doneStatus)
    expect(task.description).toEqual(updateTask.description)
});

// POST /todos/{id} (404)
test("18 Update non-existent todo @API", async ({ }) => {
    const updateTask = new TaskBuilder().getNormalTask().create()
    let { status, task } = await client.toDos.updateTaskPost(20012, updateTask);
    expect(status).toEqual(404);
    expect(task.errorMessages).toEqual(['No such todo entity instance with id == 20012 found']);
});

// PUT /todos/{id} full (200)
test("19 Full todo update via PUT @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    const updateTask = new TaskBuilder().getNormalTask().addDoneStatus(true).create()
    let { status, task } = await client.toDos.updateTaskPut(taskId, updateTask);
    expect(status).toEqual(200);
    expect(task.id).toEqual(taskId)
    expect(task.title).toEqual(updateTask.title)
    expect(task.doneStatus).toEqual(updateTask.doneStatus)
    expect(task.description).toEqual(updateTask.description)
});

// PUT /todos/{id} partial (200)
test("20 Partial todo update via PUT @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    let { status, task } = await client.toDos.updateTaskPut(taskId, { title: "New Task" });
    expect(status).toEqual(200);
    expect(task.id).toEqual(taskId)
    expect(task.title).toEqual("New Task")
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual('')
});


// PUT /todos/{id} no title (400)
test("21 Update error without title @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    delete (newTask['title'])
    let { status, task } = await client.toDos.updateTaskPut(taskId, newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["title : field is mandatory"])

});

// PUT /todos/{id} no amend id (400)
test("22 Error attempting to change todo ID @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    newTask.id = taskId + 1
    let { status, task } = await client.toDos.updateTaskPut(taskId, newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual([`Can not amend id from ${taskId} to ${taskId + 1}`])
});

// DELETE /todos/{id} (200)
test("23 Delete todo successfully @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    let { status } = await client.toDos.deleteTask(taskId);
    expect(status).toEqual(200);
    const { status: noTask } = await client.toDos.getTaskById(taskId);
    expect(noTask).toEqual(404);
});

// GET /todos (200) XML
test("25 Get todos list in XML format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: 'application/xml' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/xml');
});

// GET /todos (200) JSON
test("26 Get todos list in JSON format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: 'application/json' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/json');
});

// GET /todos (200) ANY
test("27 Get todos list in any format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: '*/*' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/json');
});

// GET /todos (200) XML pref
test("28 Get todos list with XML preference @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: 'application/xml, application/json' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/xml');
});

// GET /todos (200) no accept
test("29 Get todos list without specifying format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: '' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/json');
});


// GET /todos (406)
test("30 Error requesting unsupported format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: `application/gzip` }
    let { status } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(406);
});


// POST /todos XML
test("31 Create todo in XML format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const newTaskXML = toXML(newTask)
    const headers = { 'Content-Type': 'application/xml', Accept: 'application/xml' }
    let { status, task } = await client.toDos.createTask(newTaskXML, headers);
    const responseTask = toJSON(task)['todo']
    expect(status).toEqual(201);
    expect(responseTask.title).toEqual(newTask.title)
    expect(responseTask.doneStatus).toEqual(newTask.doneStatus)
    expect(responseTask.description).toEqual(newTask.description)

});

// POST /todos JSON
test("32 Create todo in JSON format @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
    let { status, task } = await client.toDos.createTask(newTask, headers);
    expect(status).toEqual(201);
    expect(task.title).toEqual(newTask.title)
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual(newTask.description)
});

// POST /todos (415)
test("33 Error with unsupported content type @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'bob' }
    let { status, task } = await client.toDos.createTask(newTask, headers);
    expect(status).toEqual(415);
    expect(task.errorMessages).toEqual(['Unsupported Content Type - bob']);
});

// GET /challenger/guid (existing X-CHALLENGER)
test("34 Fetch user progress @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgress();
    expect(status).toEqual(200);
    expect(body).toHaveProperty("xChallenger");
    expect(body).toHaveProperty("xAuthToken");
    expect(body).toHaveProperty("secretNote");
    expect(body).toHaveProperty("challengeStatus");
});

// PUT /challenger/guid RESTORE
test("35 Restore user progress @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgress();
    expect(status).toEqual(200);
    let { status: statusRestoreProgress, body: bodyRestoreProgress } = await client.challenger.restoreProgress(body)
    expect(statusRestoreProgress).toEqual(200);
    expect(bodyRestoreProgress).toHaveProperty("xChallenger");
    expect(bodyRestoreProgress).toHaveProperty("xAuthToken");
    expect(bodyRestoreProgress).toHaveProperty("secretNote");
    expect(bodyRestoreProgress).toHaveProperty("challengeStatus");
});


// PUT /challenger/guid CREATE
test("36  v2 Create new user progress @API", async ({ }) => {
    const uuid = crypto.randomUUID();
    let { status, body } = await client.challenger.getProgress();
    expect(status).toEqual(200);
    body['xChallenger'] = uuid;
    delete (body.xAuthToken);
    const headers = { "X-CHALLENGER": uuid };
    let { status: statusRestoreProgress } = await client.challenger.restoreProgress(body, uuid, headers);
    expect(statusRestoreProgress).toEqual(201);
});

// GET /challenger/database/guid (200)
test("37 Fetch user's todos database @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgressDB();
    expect(status).toEqual(200);
    expect(body).toHaveProperty("todos");
});

// PUT /challenger/database/guid (Update)
test("38 Restore user's todos database @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgressDB();
    expect(status).toEqual(200);
    let { status: statusRestoreProgress } = await client.challenger.restoreProgressDB(body);
    expect(statusRestoreProgress).toEqual(204);
});

// POST /todos XML to JSON
test("39 Create todo in XML, receive JSON response @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'application/xml', Accept: 'application/json' }
    let { status, headers: responseHeaders } = await client.toDos.createTask(toXML(newTask), headers);
    expect(status).toEqual(201);
    expect(responseHeaders['content-type']).toEqual('application/json');
});

// POST /todos JSON to XML
test("40 Create todo in JSON, receive XML response @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'application/json', Accept: 'application/xml' }
    let { status, headers: responseHeaders } = await client.toDos.createTask(newTask, headers);
    expect(status).toEqual(201);
    expect(responseHeaders['content-type']).toEqual('application/xml');
});

// DELETE /heartbeat (405)
test("41 Invalid DELETE method for server check @API", async ({ }) => {
    let { status } = await client.heartbeat.delete();
    expect(status).toEqual(405);
});

// PATCH /heartbeat (500)
test("42 Internal server error with PATCH method @API", async ({ }) => {
    let { status } = await client.heartbeat.patch();
    expect(status).toEqual(500);
});

// GET /heartbeat (204)
test("44 Verify server functionality @API", async ({ }) => {
    let { status } = await client.heartbeat.serverRunning();
    expect(status).toEqual(204);
});

// POST /heartbeat as DELETE (405)
test("45 Override method to DELETE @API", async ({ }) => {
    const headers = { 'X-HTTP-Method-Override': 'DELETE' }
    let { status } = await client.heartbeat.overrideMethod(headers);
    expect(status).toEqual(405);
});

// POST /heartbeat as PATCH (500)
test("46 Override method to PATCH @API", async ({ }) => {
    const headers = { 'X-HTTP-Method-Override': 'PATCH' }
    let { status } = await client.heartbeat.overrideMethod(headers);
    expect(status).toEqual(500);
});

// POST /heartbeat as Trace (501)
test("47 Override method to TRACE @API", async ({ }) => {
    const headers = { 'X-HTTP-Method-Override': 'TRACE' }
    let { status } = await client.heartbeat.overrideMethod(headers);
    expect(status).toEqual(501);
});

// POST /secret/token (401)
test("48 Invalid authentication for token retrieval @API", async ({ }) => {
    const userPassword = convertToBase64('admin:admin')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status } = await client.secret.authorization(credential);
    expect(status).toEqual(401);
});


// POST /secret/token (201)
test("49 Successfully obtain authentication token @API", async ({ }) => {
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    expect(headers).toHaveProperty('x-auth-token');
    expect(headers['x-auth-token'].length).toBeGreaterThan(0)
});

// GET /secret/note (403)
test("50 Access denied with invalid token @API", async ({ }) => {
    const credential = { 'X-AUTH-TOKEN': `SuperPuperToken` }
    let { status } = await client.secret.getNote(credential);
    expect(status).toEqual(403);
});

// GET /secret/note (401)
test("51 Missing authentication token @API", async ({ }) => {
    let { status } = await client.secret.getNote();
    expect(status).toEqual(401);
});

// GET /secret/note (200)
test("52 Successfully retrieve secret note @API", async ({ }) => {
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    const auth = { 'X-AUTH-TOKEN': headers['x-auth-token'] }
    let { status: getNoteStatus, body } = await client.secret.getNote(auth);
    expect(getNoteStatus).toEqual(200);
    expect(body).toHaveProperty('note');
});

// POST /secret/note (200)
test("53 Successfully create secret note @API", async ({ }) => {
    const noteText = "My NEW notE"
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    const auth = { 'X-AUTH-TOKEN': headers['x-auth-token'] }
    let { status: getNoteStatus, body } = await client.secret.postNote(noteText, auth);
    expect(getNoteStatus).toEqual(200);
    expect(body).toHaveProperty('note', noteText);
});

// POST /secret/note (401)
test("54 Create note without authentication token @API", async ({ }) => {
    const noteText = "My NEW notE"
    let { status: getNoteStatus, body } = await client.secret.postNote(noteText);
    expect(getNoteStatus).toEqual(401);
});

// POST /secret/note (403)
test("55 Create note with invalid token @API", async ({ }) => {
    const noteText = "My NEW notE"
    const auth = { 'X-AUTH-TOKEN': "bob" }
    let { status: getNoteStatus, body } = await client.secret.postNote(noteText, auth);
    expect(getNoteStatus).toEqual(403);
});

// GET /secret/note (200)
test("56 Retrieve note using Bearer token @API", async ({ }) => {
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    const auth = { 'Authorization': `Bearer ${headers['x-auth-token']}` }
    let { status: getNoteStatus, body } = await client.secret.getNote(auth);
    expect(getNoteStatus).toEqual(200);
    expect(body).toHaveProperty('note');
});

// POST /secret/note (Bearer)
test("57 Create note using Bearer token @API", async ({ }) => {
    const noteText = "My NEW notE"
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    const auth = { 'Authorization': `Bearer ${headers['x-auth-token']}` }
    let { status: getNoteStatus, body } = await client.secret.postNote(noteText, auth);
    expect(getNoteStatus).toEqual(200);
    expect(body).toHaveProperty('note', noteText);
});

// DELETE /todos/{id} (200) all
test("58 Delete all todos @API", async ({ }) => {
    await client.toDos.deleteAllTasks();
    const { status, tasks } = await client.toDos.getAllTasks();
    expect(status).toEqual(200);
    expect(tasks).toHaveLength(0);
});

// POST /todos (201) all
test("59 Create maximum number of todos @API", async ({ }) => {
    await client.toDos.deleteAllTasks();
    const maxNumberOfTasks = 20
    const createTaskPromises = [];
    for (let i = 0; i < maxNumberOfTasks; i++) {
        const newTask = new TaskBuilder().getNormalTask().create();
        createTaskPromises.push(client.toDos.createTask(newTask));
    }
    const createTasksResults = await Promise.all(createTaskPromises);
    for (const { status: taskStatus } of createTasksResults) {
        expect(taskStatus).toEqual(201);
    }

    let newTask = new TaskBuilder().getNormalTask().create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task).toHaveProperty('errorMessages', [`ERROR: Cannot add instance, maximum limit of ${maxNumberOfTasks} reached`]);

});

