const tasks = [];


export function addTask(task) {
    if (!task) throw new Error('Invalid task');
    tasks.push(task);
    return tasks.length;
}

export function getTasks() {
    return [...tasks];
}

export function deleteTask(number) {
    if (number < 1 || number > tasks.length) throw new Error("Index outside list");
    return tasks.splice(number-1, 1);
}

export function clearTasks() {
    tasks.length = 0;
}

export function getTasksAsJson() {
    const objTasks = [];
    let i = 1;
    for (let task of tasks) {
        objTasks.push({ number: i, task: task });
        i = i+1;
    }
    return JSON.stringify(objTasks, null, 2);
}
