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
displayTasks();

const removed = deleteTask(2)
console.log(`${removed} was removed`);

try {
  deleteTask(42)
} catch (error) {
  console.log(error.message)
}

console.log(getTasksAsJson());
printTasksFromJson();




