# 1-20 JavaScript modules: split the to-do list

You take the to-do list from lecture 2, which is one file, and split it into a module and a main program. The module
holds the list and the functions; the main program imports them and prints. On the way you meet ES modules
(`import`/`export`), the difference between returning a value and printing it, exceptions, and your first tests.

You work in `practice/1-20/`. When you are done it has these files:

```
practice/1-20/
├── lecture.js     the code from the lecture, your starting point (remove it when done)
├── todo.js        the module: the list and the functions
├── todo.test.js   tests for the module
└── main.js        the main program: uses the module and prints
```

## Background: ES modules

A module is a file that shares some of its code with other files. What it shares, it `export`s; the file that wants
it, `import`s it:

```js
// math.js
export function add(a, b) {
  return a + b
}
```

```js
// main.js
import { add } from './math.js'
console.log(add(1, 2))
```

The repo uses ES modules because `package.json` has `"type": "module"`. You may meet the older CommonJS form
(`require()` and `module.exports`) in the lectures and in older code on the web; it does the same job, but in this
course we write `import` and `export`. Note that the path in `import` is relative and ends in `.js`.

Everything in a module that is not exported stays private to it. That lets the module keep the list to itself and
decide how others may change it.

## 1. See where you are

This is the code from lecture 2. It is all in one file, and every function prints its result with `console.log()`:

```js
const toDoList = [];

function addTask(task) {
    if (task) {
        toDoList.push(task)
        console.log(`Task ${task} was added.`)
    }
    else {
        console.log("Please enter a valid task.")
    }
}

function displayTasks() {
    if (toDoList.length === 0) {
        console.log("Your to-do list is empty.")
    }
    else {
        console.log("Your to-do list:")
        toDoList.forEach((element, index) => {
            console.log(`${index + 1}.  ${element}`)
        });
    }
}

function deleteTask(index) {
    if (index > 0 && index <= toDoList.length) {
        const removed = toDoList.splice(index - 1, 1)
        console.log(`Task ${removed} was removed.`)
    }
    else {
        console.log("Please enter a valid task number.")
    }
}

addTask("Wash clothes");
addTask("Do the dishes");
addTask("Go for walk")
displayTasks();

deleteTask(2)
displayTasks();
```

1. Create `practice/1-20/lecture.js` and paste the code into it.
2. Run it from the root of your repo:

   ```bash
   node practice/1-20/lecture.js
   ```

3. Run the checks and see what ESLint and Prettier think about it:

   ```bash
   npm run check
   ```

   Prettier complains about the format; ESLint has nothing to say about this code. Run `npm run format`, open the file
   again and see what changed.

The code works, but it is hard to reuse and hard to test: the only result of a function is text on the screen. That is
what you change.

## 2. Create the module

The module `todo.js` keeps the list and exports the functions. The functions **return** values or **throw** an error;
they never print. The caller decides what to show.

Create `practice/1-20/todo.js` with this shape and fill in each numbered part:

```js
const tasks = []

export function addTask(task) {
  // 1. Throw an Error if task is empty
  // 2. Add the task last in the list
  // 3. Return the new length of the list
}

export function getTasks() {
  // 4. Return a copy of the list, so nobody outside can change it
}

export function deleteTask(number) {
  // 5. Throw an Error if number is outside 1 .. tasks.length
  // 6. Remove the task and return it
}

export function clearTasks() {
  // 7. Empty the list (the tests need this)
}
```

Do one function at a time. If you get stuck, open the solution for that function only, and try the next one
yourself.

<details>
<summary>A solution: <code>addTask()</code></summary>

```js
export function addTask(task) {
  if (!task) {
    throw new Error('Please enter a valid task.')
  }
  tasks.push(task)
  return tasks.length
}
```

</details>

<details>
<summary>A solution: <code>getTasks()</code></summary>

```js
export function getTasks() {
  return [...tasks]
}
```

</details>

<details>
<summary>A solution: <code>deleteTask()</code></summary>

```js
export function deleteTask(number) {
  if (number < 1 || number > tasks.length) {
    throw new Error('Please enter a valid task number.')
  }
  return tasks.splice(number - 1, 1)[0]
}
```

</details>

<details>
<summary>A solution: <code>clearTasks()</code></summary>

```js
export function clearTasks() {
  tasks.length = 0
}
```

</details>

`[...tasks]` makes a new array with the same items. If `getTasks()` returned `tasks` itself, the caller could change
the list without going through your functions.

## 3. Write the main program

The main program `main.js` imports the functions it needs and does all the printing. You build it in small steps and
run it after each one. Try each step yourself first; the solution is there if you get stuck.

### 3.1 A start that runs

Create `practice/1-20/main.js` with this code, which adds one task and prints the list as it is:

```js
import { addTask, getTasks } from './todo.js'

addTask('Wash clothes')
console.log(getTasks())
```

Run it:

```bash
node practice/1-20/main.js
```

```text
[ 'Wash clothes' ]
```

`getTasks()` returns an array, and `console.log()` prints it the way Node shows arrays.

### 3.2 Add more tasks

Add the tasks `Do the dishes` and `Go for a walk` after the first one, and run again. The array now has three items.

<details>
<summary>A solution</summary>

```js
addTask('Wash clothes')
addTask('Do the dishes')
addTask('Go for a walk')
console.log(getTasks())
```

</details>

### 3.3 Print the list nicely

Write a function `printTasks()` in `main.js` that gets the list and prints it numbered from 1, or a message when the
list is empty. Replace `console.log(getTasks())` with a call to it:

```text
Your to-do list:
1. Wash clothes
2. Do the dishes
3. Go for a walk
```

Hint: a `for` loop with `i` from 0 to `tasks.length - 1` gives you each task as `tasks[i]`. The index starts at
0, so the number to print is `i + 1`.

<details>
<summary>A solution</summary>

```js
function printTasks() {
  const tasks = getTasks()
  if (tasks.length === 0) {
    console.log('Your to-do list is empty.')
    return
  }
  console.log('Your to-do list:')
  for (let i = 0; i < tasks.length; i++) {
    console.log(`${i + 1}. ${tasks[i]}`)
  }
  // The same loop, written shorter with forEach and an arrow function:
  // tasks.forEach((task, index) => console.log(`${index + 1}. ${task}`))
}
```

Put the function after the `import` line, and call it with `printTasks()` after the tasks are added.

</details>

### 3.4 Remove a task

Import `deleteTask` too, remove task number 2, print which task was removed, and print the list again:

```text
Your to-do list:
1. Wash clothes
2. Do the dishes
3. Go for a walk
Task "Do the dishes" was removed.
Your to-do list:
1. Wash clothes
2. Go for a walk
```

Hint: `deleteTask()` returns the task it removed.

<details>
<summary>A solution</summary>

```js
import { addTask, getTasks, deleteTask } from './todo.js'
```

and last in the file:

```js
const removed = deleteTask(2)
console.log(`Task "${removed}" was removed.`)
printTasks()
```

</details>

<details>
<summary>The whole <code>main.js</code> after step 3</summary>

```js
import { addTask, getTasks, deleteTask } from './todo.js'

function printTasks() {
  const tasks = getTasks()
  if (tasks.length === 0) {
    console.log('Your to-do list is empty.')
    return
  }
  console.log('Your to-do list:')
  for (let i = 0; i < tasks.length; i++) {
    console.log(`${i + 1}. ${tasks[i]}`)
  }
  // The same loop, written shorter with forEach and an arrow function:
  // tasks.forEach((task, index) => console.log(`${index + 1}. ${task}`))
}

addTask('Wash clothes')
addTask('Do the dishes')
addTask('Go for a walk')
printTasks()

const removed = deleteTask(2)
console.log(`Task "${removed}" was removed.`)
printTasks()
```

</details>

The output is almost the same as from the lecture code, but now the list lives in one file and the printing in
another.

## 4. Catch an error

`deleteTask()` throws when the number is wrong. Add this last in `main.js` and run it again:

```js
try {
  deleteTask(42)
} catch (error) {
  console.log(error.message)
}
```

Try what happens without `try`/`catch`: the program stops with a stack trace. Put the `try` back.

## 5. Refactor: the list as JSON

`printTasks()` uses the list, so why not put it in `todo.js` next to the other functions? Think about it for a
moment:

- What if the list should be shown on a web page, or sent as JSON from a server, instead of printed in the terminal?
- How would you write a test for `printTasks()`, compared with a test for `getTasks()`?

Now try the other way. JSON is a text format for data that a web server can send, as you will do in 1-30. Add a
function to the module that returns the list as JSON. The module still does not print; `main.js` does.

### 5.1 A function in the module

Add this to `todo.js` and fill in the numbered parts:

```js
export function getTasksAsJson() {
  // 1. Make a new array with one object per task, like { number: 1, task: 'Wash clothes' }
  // 2. Return the array as a JSON string, indented with 2 spaces
}
```

Hint: `JSON.stringify(list, null, 2)` turns `list` into a JSON string; the `2` is the indentation.

<details>
<summary>A solution</summary>

```js
export function getTasksAsJson() {
  const list = []
  for (let i = 0; i < tasks.length; i++) {
    list.push({ number: i + 1, task: tasks[i] })
  }
  return JSON.stringify(list, null, 2)
}
```

</details>

### 5.2 Print the JSON from the main program

Import `getTasksAsJson` in `main.js` and print what it returns, last in the file. Run it; the output now ends with:

```text
[
  {
    "number": 1,
    "task": "Wash clothes"
  },
  {
    "number": 2,
    "task": "Go for a walk"
  }
]
```

<details>
<summary>A solution</summary>

```js
import { addTask, getTasks, deleteTask, getTasksAsJson } from './todo.js'
```

and last in the file:

```js
console.log(getTasksAsJson())
```

</details>

### 5.3 Print the list from the JSON

`printTasks()` numbers the tasks itself. Write a second function in `main.js`, `printTasksFromJson()`, that gets the
list from `getTasksAsJson()` instead, turns the string back into data with `JSON.parse()`, and prints each task with
its `number`. Call it last in the file. It should print the list the same way as `printTasks()` does:

```text
Your to-do list:
1. Wash clothes
2. Go for a walk
```

Hint: after `JSON.parse()` you have an array of objects, so `list[i].number` and `list[i].task` give you the parts.

<details>
<summary>A solution</summary>

```js
function printTasksFromJson() {
  const list = JSON.parse(getTasksAsJson())
  if (list.length === 0) {
    console.log('Your to-do list is empty.')
    return
  }
  console.log('Your to-do list:')
  for (let i = 0; i < list.length; i++) {
    console.log(`${list[i].number}. ${list[i].task}`)
  }
}
```

and last in the file:

```js
printTasksFromJson()
```

</details>

<details>
<summary>The whole <code>main.js</code> after step 5</summary>

```js
import { addTask, getTasks, deleteTask, getTasksAsJson } from './todo.js'

function printTasks() {
  const tasks = getTasks()
  if (tasks.length === 0) {
    console.log('Your to-do list is empty.')
    return
  }
  console.log('Your to-do list:')
  for (let i = 0; i < tasks.length; i++) {
    console.log(`${i + 1}. ${tasks[i]}`)
  }
  // The same loop, written shorter with forEach and an arrow function:
  // tasks.forEach((task, index) => console.log(`${index + 1}. ${task}`))
}

function printTasksFromJson() {
  const list = JSON.parse(getTasksAsJson())
  if (list.length === 0) {
    console.log('Your to-do list is empty.')
    return
  }
  console.log('Your to-do list:')
  for (let i = 0; i < list.length; i++) {
    console.log(`${list[i].number}. ${list[i].task}`)
  }
}

addTask('Wash clothes')
addTask('Do the dishes')
addTask('Go for a walk')
printTasks()

const removed = deleteTask(2)
console.log(`Task "${removed}" was removed.`)
printTasks()

try {
  deleteTask(42)
} catch (error) {
  console.log(error.message)
}

console.log(getTasksAsJson())
printTasksFromJson()
```

</details>

Compare the two print functions. They print the same, but in `printTasksFromJson()` the numbering comes from the
module: `todo.js` decides what the data is and how it is numbered, and `main.js` only decides how to show it. Which
function, `printTasks()` or `getTasksAsJson()`, could a web server use as it is?

<details>
<summary>One way to see it</summary>

The module answers *what* is in the list; the caller decides *how* to show it. `getTasks()` returns an array and
`getTasksAsJson()` a string, and a terminal program, a web page and a JSON API can all use them. A `printTasks()`
inside `todo.js` would tie the module to the terminal: a web server has no use for text printed on its own screen. It
is also harder to test: a test can compare what `getTasks()` or `getTasksAsJson()` returns with what it expects, but
the only result of `printTasks()` is text on the screen.

The idea has a name, *separation of concerns*: each part of the code has one job. You meet it again in 1-30, where a
server sends JSON, and in the coming weeks with routes and views in Express.

</details>

## 6. Test the module

A test calls a function and checks the result. Since the module returns values instead of printing, it is easy to
test. Node has a test runner built in: `node:test` runs the tests and `node:assert` checks the results.

### 6.1 The first tests

Create `practice/1-20/todo.test.js` next to the module:

```js
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { addTask, getTasks, clearTasks } from './todo.js'

// The list lives in the module, so empty it before each test.
beforeEach(() => clearTasks())

test('a new list is empty', () => {
  assert.deepEqual(getTasks(), [])
})

test('addTask adds a task last in the list', () => {
  addTask('Wash clothes')
  addTask('Do the dishes')
  assert.deepEqual(getTasks(), ['Wash clothes', 'Do the dishes'])
})

test('addTask throws on an empty task', () => {
  assert.throws(() => addTask(''), /valid task/)
})
```

Run the tests:

```bash
npm test
```

`npm test` runs every test file in the repo. To run only the tests of this exercise, give the directory after `--`:

```bash
npm test -- practice/1-20
```

Each `test()` has a name that says what should be true, and a function that sets things up and checks the result. The
name is what you see in the output when a test fails.

### 6.2 Test that `deleteTask()` removes a task

Add a test last in `todo.test.js`. Import `deleteTask` too, on the `import` line from `./todo.js`.

```js
test('deleteTask removes by number, starting at 1', () => {
  // 1. Add two tasks
  // 2. Delete task number 1 and check that it returns the first task
  // 3. Check that only the second task is left in the list
})
```

Run `npm test -- practice/1-20` and see your test pass.

<details>
<summary>A solution</summary>

```js
test('deleteTask removes by number, starting at 1', () => {
  addTask('Wash clothes')
  addTask('Do the dishes')
  assert.equal(deleteTask(1), 'Wash clothes')
  assert.deepEqual(getTasks(), ['Do the dishes'])
})
```

`assert.equal()` compares single values, like the string `deleteTask()` returns. `assert.deepEqual()` compares the
content of arrays and objects.

</details>

### 6.3 Test that `deleteTask()` throws

Add a test that `deleteTask()` throws when the number is outside the list.

```js
test('deleteTask throws on a number outside the list', () => {
  // 1. Add one task
  // 2. Check that deleting task number 2 throws an error
})
```

Hint: look at the test `addTask throws on an empty task` above.

<details>
<summary>A solution</summary>

```js
test('deleteTask throws on a number outside the list', () => {
  addTask('Wash clothes')
  assert.throws(() => deleteTask(2), /valid task number/)
})
```

`assert.throws()` takes a function, not a call: `() => deleteTask(2)`. It calls the function itself and checks that it
throws, and the regular expression `/valid task number/` checks the error message.

</details>

### 6.4 Test `getTasksAsJson()`

Add a test that `getTasksAsJson()` returns the list numbered from 1. Import `getTasksAsJson` too.

```js
test('getTasksAsJson returns the list as JSON, numbered from 1', () => {
  // 1. Add one task
  // 2. Turn the JSON string back into data with JSON.parse()
  // 3. Check that it is an array with one object: { number: 1, task: ... }
})
```

<details>
<summary>A solution</summary>

```js
test('getTasksAsJson returns the list as JSON, numbered from 1', () => {
  addTask('Wash clothes')
  assert.deepEqual(JSON.parse(getTasksAsJson()), [{ number: 1, task: 'Wash clothes' }])
})
```

`JSON.parse()` turns the string back into data, so the test compares the content and not the spaces.

</details>

Run all the tests of the exercise again with `npm test -- practice/1-20`. All of them should pass.

## Check and commit

Remove `lecture.js` if you like, it has done its job. Then run all checks and commit:

```bash
npm run check
git add practice/1-20
git commit -m "1-20 Split the to-do list into a module"
```

If you have a remote of your own, push with `git push`.

### Verify

- [ ] `node practice/1-20/main.js` prints the list, removes a task, catches the error and prints the list as JSON.
- [ ] `printTasksFromJson()` prints the list from `getTasksAsJson()` the same way as `printTasks()` does.
- [ ] You can say why `printTasks()` is in `main.js` and `getTasksAsJson()` in `todo.js`.
- [ ] `npm run check` passes, with your tests included.
- [ ] You can say why a function that returns a value is easier to test than one that prints.
- [ ] You can say what `export` and `import` do, and why `tasks` is not exported.

<details>
<summary><code>SyntaxError: Cannot use import statement outside a module</code></summary>

Node treats the file as CommonJS. Check that `package.json` has `"type": "module"` and that you run the file from
inside your repo.

</details>

<details>
<summary><code>Cannot find module '.../todo'</code></summary>

The import path needs the file ending: `'./todo.js'`, not `'./todo'`.

</details>

## Challenge

Add a function `findTasks(word)` to the module that returns the tasks whose text contains the word, and an empty
array when none does. Write the test first, then the function, and use it from `main.js`. Look at `filter()` and
`includes()` on MDN.

## Read more

- The recorded lectures 2 and 3 in Canvas.
- [ES modules in Node.js](../doc/es-modules.md), the course's article on `import` and `export`.
- [Testing with Node.js](../doc/testing-with-node.md), the course's article on `node:test` and `assert`.
- Modules in JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- Node's test runner: https://nodejs.org/api/test.html
