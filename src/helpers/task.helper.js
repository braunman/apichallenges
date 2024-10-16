
export const getTasksIdByStatus = (taskList, filterParam) => {
    const filterTasks = taskList.filter(task => task[Object.keys(filterParam)[0]] === Object.values(filterParam)[0]);
    return filterTasks
}