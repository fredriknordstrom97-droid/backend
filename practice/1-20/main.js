import { addTask, getTasks, deleteTask, clearTasks, getTasksAsJson } from "./todo.js";

function printTasksFromJson() {
    let data = JSON.parse(getTasksAsJson());
    console.log("Your todo-list: ");
    for (let i = 0; i < data.length; i++) {
        console.log(`${data[i].number}. ${data[i].task}`);
    }
}

function displayTasks() {
    const tasks = getTasks()
    if (tasks.length === 0) {
        console.log("Your to-do list is empty.")
    }
    else {
        console.log("Your to-do list:")
        tasks.forEach((element, index) => {
            console.log(`${index + 1}.  ${element}`)
        });
    }
}

addTask("Wash clothes");
addTask("Do the dishes");
addTask("Go for walk");
addTask("");
displayTasks();
deleteTask(2)
displayTasks();
printTasksFromJson();
clearTasks();




