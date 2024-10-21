import { test, expect } from '@playwright/test';
import { ApiClient } from '../src/api.client';
import { TaskBuilder, toJSON, toXML, convertToBase64 } from '../src/helpers/index';

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


test("02 GET request on the `/challenges` end point (GET /challenges (200)) @API", async ({ }) => {
    const { status, challenges } = await client.challenges.getAllChallenges()
    expect(status).toEqual(200)
    expect(challenges).toHaveLength(59)
})

test("03 GET request on the `/todos` end point (GET /todos (200)) @API", async ({ }) => {
    const { status, tasks } = await client.toDos.getAllTasks();
    expect(status).toEqual(200)
    expect(tasks).toBeTruthy();
});

test("04 GET request on the `/todo` end point should 404 because nouns should be plural (GET /todo (404) not plural) @API", async ({ }) => {
    const { status } = await client.toDos.client.get('/todo');
    expect(status).toEqual(404)
});

test("05 GET request on the `/todos/{id}` end point to return a specific todo (GET /todos/{id} (200)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createdTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createdTaskStatus).toEqual(201);
    const { status, task } = await client.toDos.getTaskById(createdTask.id);
    expect(status).toEqual(200);
    expect(task.id).toEqual(createdTask.id)
});

test("06 GET request on the `/todos/{id}` end point for a todo that does not exist (GET /todos/{id} (404)) @API", async ({ }) => {
    const taskId = 2000001;
    const { status, task } = await client.toDos.getTaskById(taskId);
    expect(status).toEqual(404);
    expect(task).toBeUndefined();
});


test("07 GET request on the `/todos` end point with a query filter to get only todos which are 'done' (GET /todos (200) ?filter) @API", async ({ }) => {
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

test("08 HEAD request on the `/todos` end point (HEAD /todos (200)) @API", async ({ }) => {
    let { status } = await client.toDos.requestPoint();
    expect(status).toEqual(200);
});

test("09 POST request to successfully create a todo (POST /todos (201)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(201);
    expect(typeof task.id).toBe('number')
    expect(task.title).toEqual(newTask.title)
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual(newTask.description)
});

test("10 POST request to create a todo but fail validation on the `doneStatus` field (POST /todos (400) doneStatus) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDoneStatus("I did IT!!").create()
    let { status } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
});


test("11 POST request to create a todo with title exceeds maximum allowable characters (POST /todos (400) title too long) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addTitle(51).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50"]);
});

test("12 POST request to create a todo with description exceeds maximum allowable characters (POST /todos (400) title too long) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDescription(201).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200"]);
});

test("13 POST request to create a todo with description exceeds maximum allowable characters (POST /todos (201) max out content) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDescription(200).addTitle(50).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(201);
    expect(task.title).toEqual(newTask.title)
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual(newTask.description)
});

test("14 POST request to create a todo payload exceeds maximum allowable 5000 characters (POST /todos (413) content too long) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().addDescription(5001).create()
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(413);
    expect(task.errorMessages).toEqual(["Error: Request body too large, max allowed is 5000 bytes"]);
});

test("15 POST request to create a todo with payload contains an unrecognised field (POST /todos (400) extra) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create({ good: 'No' })
    let { status, task } = await client.toDos.createTask(newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["Could not find field: good"]);
});

test("16 PUT request to unsuccessfully create a todo (PUT /todos/{id} (400)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status } = await client.toDos.client.put("/todos/2001", { data: newTask });
    expect(status).toEqual(400);
});



test("17 POST request to successfully update a todo (POST /todos/{id} (200)) @API", async ({ }) => {
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

test("18 POST request for a todo which does not exist (POST /todos/{id} (404)) @API", async ({ }) => {
    const updateTask = new TaskBuilder().getNormalTask().create()
    let { status, task } = await client.toDos.updateTaskPost(20012, updateTask);
    expect(status).toEqual(404);
    expect(task.errorMessages).toEqual(['No such todo entity instance with id == 20012 found']);
});

test("19 PUT request to update an existing todo with a complete payload i.e. title, description and doneStatus (PUT /todos/{id} full (200)) @API", async ({ }) => {
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

test("20 PUT request to update an existing todo with just mandatory items - title. (PUT /todos/{id} partial (200)) @API", async ({ }) => {
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

test("21 PUT request to fail to update an existing todo because title is missing in payload (PUT /todos/{id} no title (400)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    delete (newTask['title'])
    let { status, task } = await client.toDos.updateTaskPut(taskId, newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual(["title : field is mandatory"])

});

test("22 PUT request to fail to update an existing todo because id different in payload (PUT /todos/{id} no amend id (400)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    newTask.id = taskId + 1
    let { status, task } = await client.toDos.updateTaskPut(taskId, newTask);
    expect(status).toEqual(400);
    expect(task.errorMessages).toEqual([`Can not amend id from ${taskId} to ${taskId + 1}`])
});

test("23 DELETE request to successfully delete a todo (DELETE /todos/{id} (200)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    let { status: createTaskStatus, task: createdTask } = await client.toDos.createTask(newTask);
    expect(createTaskStatus).toEqual(201);
    const taskId = createdTask.id
    let { status } = await client.toDos.deleteTask(taskId);
    expect(status).toEqual(200);
    const { status: noTask } = await client.toDos.getTaskById(taskId);
    expect(noTask).toEqual(404);
});



test("25 GET request on the `/todos` to receive results in XML format (GET /todos (200) XML) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: 'application/xml' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/xml');
});

test("26 GET request on the `/todos` to receive results in JSON format (GET /todos (200) XML) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: 'application/json' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/json');
});

test("27 GET request on the `/todos` to receive results in ANY(get JSON) format (GET /todos (200) ANY) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: '*/*' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/json');
});


test("28 GET request on the `/todos` to results in the preferred XML format (GET /todos (200) GET /todos (200) XML pref) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: 'application/xml, application/json' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/xml');
});


test("29 GET request on the `/todos` with empty Accept to results in default JSON format (GET /todos (200) no accept) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: '' }
    let { status, headers: responseHeaders } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(200);
    expect(responseHeaders['content-type']).toEqual('application/json');
});


test("30 GET request on the `/todos` end point with an `Accept` header `application/gzip` to receive 406 'NOT ACCEPTABLE' status code (GET /todos (406)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { Accept: `application/gzip` }
    let { status } = await client.toDos.getAllTasks(headers);
    expect(status).toEqual(406);
});


test("31 POST request on the `/todos` end point to create a todo using Content-Type `application/xml`, and Accepting only XML (POST /todos XML) @API", async ({ }) => {
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


test("32 POST request on the `/todos` end point to create a todo using Content-Type `application/json`, and Accepting only JSON (POST /todos XML) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
    let { status, task } = await client.toDos.createTask(newTask, headers);
    expect(status).toEqual(201);
    expect(task.title).toEqual(newTask.title)
    expect(task.doneStatus).toEqual(newTask.doneStatus)
    expect(task.description).toEqual(newTask.description)
});


test("33 POST request on the `/todos` end point with an unsupported content type to generate a 415 status code (POST /todos (415)) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'bob' }
    let { status, task } = await client.toDos.createTask(newTask, headers);
    expect(status).toEqual(415);
    expect(task.errorMessages).toEqual(['Unsupported Content Type - bob']);
});

test("34 GET request on the `/challenger/{guid}` end point, with an existing challenger GUID. This will return the progress data payload that can be used to later restore your progress to this status (GET /challenger/guid (existing X-CHALLENGER)) @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgress();
    expect(status).toEqual(200);
    expect(body).toHaveProperty("xChallenger");
    expect(body).toHaveProperty("xAuthToken");
    expect(body).toHaveProperty("secretNote");
    expect(body).toHaveProperty("challengeStatus");
});


test("35 PUT request on the `/challenger/{guid}` end point, with an existing challenger GUID to restore that challenger's progress into memory (PUT /challenger/guid RESTORE) @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgress();
    expect(status).toEqual(200);
    let { status: statusRestoreProgress, body: bodyRestoreProgress } = await client.challenger.restoreProgress(body)
    expect(statusRestoreProgress).toEqual(200);
    expect(bodyRestoreProgress).toHaveProperty("xChallenger");
    expect(bodyRestoreProgress).toHaveProperty("xAuthToken");
    expect(bodyRestoreProgress).toHaveProperty("secretNote");
    expect(bodyRestoreProgress).toHaveProperty("challengeStatus");
});

test("36 PUT request on the `/challenger/{guid}` end point, with a challenger GUID not currently in memory to restore that challenger's progress into memory (PUT /challenger/guid CREATE) @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgress();
    expect(status).toEqual(200);
    body.challengeStatus.PUT_NEW_RESTORED_CHALLENGER_PROGRESS_STATUS = true;
    let { status: statusRestoreProgress, body: bodyRestoreProgress } = await client.challenger.restoreProgress(body);
    expect(statusRestoreProgress).toEqual(200);
    expect(bodyRestoreProgress).toHaveProperty("xChallenger");
    expect(bodyRestoreProgress).toHaveProperty("xAuthToken");
    expect(bodyRestoreProgress).toHaveProperty("secretNote");
    expect(bodyRestoreProgress).toHaveProperty("challengeStatus");
});

test("37 GET request on the `/challenger/database/{guid}` end point, to retrieve the current todos database for the user.(GET /challenger/database/guid (200)) @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgressDB();
    expect(status).toEqual(200);
    expect(body).toHaveProperty("todos");
});


test("38 PUT request on the `/challenger/database/{guid}` end point, with a payload to restore the Todos database in memory.(PUT /challenger/database/guid (Update)) @API", async ({ }) => {
    let { status, body } = await client.challenger.getProgressDB();
    expect(status).toEqual(200);
    let { status: statusRestoreProgress } = await client.challenger.restoreProgressDB(body);
    expect(statusRestoreProgress).toEqual(204);
});


test("39 POST request on the `/todos` end point to create a todo using Content-Type `application/xml` but Accept `application/json` (POST /todos XML to JSON) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'application/xml', Accept: 'application/json' }
    let { status, headers: responseHeaders } = await client.toDos.createTask(toXML(newTask), headers);
    expect(status).toEqual(201);
    expect(responseHeaders['content-type']).toEqual('application/json');
});

test("40 POST request on the `/todos` end point to create a todo using Content-Type `application/json` but Accept `application/xml` (POST /todos JSON to XML) @API", async ({ }) => {
    const newTask = new TaskBuilder().getNormalTask().create()
    const headers = { 'Content-Type': 'application/json', Accept: 'application/xml' }
    let { status, headers: responseHeaders } = await client.toDos.createTask(newTask, headers);
    expect(status).toEqual(201);
    expect(responseHeaders['content-type']).toEqual('application/xml');
});


test("41 DELETE request on the `/heartbeat` end point and receive 405 (Method Not Allowed) (DELETE /heartbeat (405)) @API", async ({ }) => {
    let { status } = await client.heartbeat.delete();
    expect(status).toEqual(405);
});

test("42 PATCH request on the `/heartbeat` end point and receive 500 (internal server error) (PATCH /heartbeat (500)) @API", async ({ }) => {
    let { status } = await client.heartbeat.patch();
    expect(status).toEqual(500);
});

test("44  GET request on the `/heartbeat` end point and receive 204 when server is running (GET /heartbeat (204)) @API", async ({ }) => {
    let { status } = await client.heartbeat.serverRunning();
    expect(status).toEqual(204);
});


test("45 POST request on the `/heartbeat` end point and receive 405 when you override the Method Verb to a DELETE (POST /heartbeat as DELETE (405)) @API", async ({ }) => {
    const headers = { 'X-HTTP-Method-Override': 'DELETE' }
    let { status } = await client.heartbeat.overrideMethod(headers);
    expect(status).toEqual(405);
});

test("46 POST request on the `/heartbeat` end point and receive 500 when you override the Method Verb to a PATCH (POST /heartbeat as PATCH (500)) @API", async ({ }) => {
    const headers = { 'X-HTTP-Method-Override': 'PATCH' }
    let { status } = await client.heartbeat.overrideMethod(headers);
    expect(status).toEqual(500);
});

test("47 POST request on the `/heartbeat` end point and receive 501 (Not Implemented) when you override the Method Verb to a TRACE (POST /heartbeat as Trace (501)) @API", async ({ }) => {
    const headers = { 'X-HTTP-Method-Override': 'TRACE' }
    let { status } = await client.heartbeat.overrideMethod(headers);
    expect(status).toEqual(501);
});


test("48 POST request on the `/secret/token` end point and receive 401 when Basic auth username/password is not admin/password (POST /secret/token (401)) @API", async ({ }) => {
    const userPassword = convertToBase64('admin:admin')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status } = await client.secret.authorization(credential);
    expect(status).toEqual(401);
});


test("49 POST request on the `/secret/token` end point and receive 201 when Basic auth username/password is admin/password (POST /secret/token (201)) @API", async ({ }) => {
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    expect(headers).toHaveProperty('x-auth-token');
    expect(headers['x-auth-token'].length).toBeGreaterThan(0)
});

test("50 GET request on the `/secret/note` end point and receive 403 when X-AUTH-TOKEN does not match a valid token (GET /secret/note (403)) @API", async ({ }) => {
    const credential = { 'X-AUTH-TOKEN': `SuperPuperToken` }
    let { status } = await client.secret.getNote(credential);
    expect(status).toEqual(403);
});

test("51 GET request on the `/secret/note` end point and receive 401 when no X-AUTH-TOKEN header present (GET /secret/note (401)) @API", async ({ }) => {
    let { status } = await client.secret.getNote();
    expect(status).toEqual(401);
});

test("52 GET request on the `/secret/note` end point receive 200 when valid X-AUTH-TOKEN used - response body should contain the note (GET /secret/note (200)) @API", async ({ }) => {
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    const auth = { 'X-AUTH-TOKEN': headers['x-auth-token'] }
    let { status: getNoteStatus, body } = await client.secret.getNote(auth);
    expect(getNoteStatus).toEqual(200);
    expect(body).toHaveProperty('note');
});


test("53 POST request on the `/secret/note` end point with a note payload e.g. {'note':'my note'} and receive 200 when valid X-AUTH-TOKEN used (POST /secret/note (200)) @API", async ({ }) => {
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

test("54 POST request on the `/secret/note` end point with a note payload {'note':'my note'} and receive 401 when no X-AUTH-TOKEN present (POST /secret/note (401)) @API", async ({ }) => {
    const noteText = "My NEW notE"
    let { status: getNoteStatus, body } = await client.secret.postNote(noteText);
    expect(getNoteStatus).toEqual(401);
});


test("55  POST request on the `/secret/note` end point with a note payload {'note':'my note'} and receive 403 when X-AUTH-TOKEN does not match a valid token (POST /secret/note (403)) @API", async ({ }) => {
    const noteText = "My NEW notE"
    const auth = { 'X-AUTH-TOKEN': "bob" }
    let { status: getNoteStatus, body } = await client.secret.postNote(noteText, auth);
    expect(getNoteStatus).toEqual(403);
});


test("56 GET request on the `/secret/note` end point receive 200 when using the X-AUTH-TOKEN value as an Authorization Bearer token - response body should contain the note (GET /secret/note (200)) @API", async ({ }) => {
    const userPassword = convertToBase64('admin:password')
    const credential = { 'Authorization': `Basic ${userPassword}` }
    let { status, headers } = await client.secret.authorization(credential);
    expect(status).toEqual(201);
    const auth = { 'Authorization': `Bearer ${headers['x-auth-token']}` }
    let { status: getNoteStatus, body } = await client.secret.getNote(auth);
    expect(getNoteStatus).toEqual(200);
    expect(body).toHaveProperty('note');
});


test("57 POST request on the `/secret/note` end point with a note payload e.g. {'note':'my note'} and receive 200 when valid X-AUTH-TOKEN value used as an Authorization Bearer token. Status code 200 received. Note is maximum length 100 chars and will be truncated when stored (POST /secret/note (Bearer)) @API", async ({ }) => {
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


test("58 DELETE request to successfully delete the last todo in system so that there are no more todos in the system (DELETE /todos/{id} (200) all) @API", async ({ }) => {
    await client.toDos.deleteAllTasks();
    const { status, tasks } = await client.toDos.getAllTasks();
    expect(status).toEqual(200);
    expect(tasks).toHaveLength(0);
});

test("59 many POST requests as it takes to add the maximum number of TODOS allowed for a user (DELETE /todos/{id} (200) all) @API", async ({ }) => {
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