import { faker } from '@faker-js/faker';

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

    getNormalTask() {
        this.addTitle().addDoneStatus().addDescription()
        return this
    }

    create(addFields = {}) {
        const copied = structuredClone(
            {
                title: this.title,
                doneStatus: this.status,
                description: this.description,
                ...addFields
            }
        );
        return copied;
    }
}