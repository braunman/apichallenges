import { faker } from '@faker-js/faker';
import * as allure from "allure-js-commons";

export class TaskBuilder {
    addTitle(stringLength = 25) {
        this.title = faker.string.alpha({ length: stringLength });
        return this;
    }

    addDoneStatus(done = false) {
        this.status = done;
        return this;
    }
    addDescription(stringLength = 100) {
        this.description = faker.string.alpha({ length: stringLength })
        return this;
    }

    async build(addFields = {}) {
        let copied;
        // allure.step("Create data for task", async () => {
        copied = structuredClone(
            {
                title: this.title,
                doneStatus: this.status,
                description: this.description,
                ...addFields
            }
        );
        // console.log(copied)
        //     allure.attachment("Create task with", JSON.stringify(copied), ContentType.JSON);
        // })
        // allure.step(`Create task with params ${JSON.stringify(copied)}`, async () => { })
        await allure.logStep(`Create task with params\n ${JSON.stringify(copied, null, 2)}`)
        return copied;
    }
}