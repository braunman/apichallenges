import { test as setup } from '@playwright/test';

import { ApiClient } from '../src/api.client';

setup('Create token for tests', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext();
    const client = await ApiClient.loginAs(apiContext);
    await client.toDos.deleteAllTasks();
    await client.setTokenToStorage()
});