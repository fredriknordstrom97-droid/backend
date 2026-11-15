const tasks = [];


export function addTask(task) {
//  if (!task) {
//    throw new Error('Please enter a valid task.')
//  }
//  tasks.push(task)
//  return tasks.length
//}
    if (!task) throw 'Invalid task';
    tasks.push(task);
    return tasks.length;
}

export function getTasks() {
    return [...tasks];
}

export function deleteTask(number) {
    if (number < 1 || number > tasks.length) throw "Index outside list";
    return tasks.splice(number-1, 1);
}

export function clearTasks() {
    tasks.length = 0;
}

export function getTasksAsJson() {
    const objTasks = [];
    let i = 1;
    for (let task of tasks) {
        console.log(task);
        objTasks.push({ number: i, task: task });
        i = i+1;
    }
    return JSON.stringify(objTasks, null, 2);
}
