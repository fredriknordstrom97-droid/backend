# Testing with Node.js

A test is a small program that runs your code and checks the result. Once written it answers "does this still work?"
in a second, every time you change something. Node.js has a test runner built in, so the course needs no test package:
the tests import `node:test` and `node:assert`, and `npm test` runs them.

You write your first tests in exercise [1-20 Modules](../exercise/1-20-modules.md) and test a web server in
[1-30 Hello web server](../exercise/1-30-hello-web-server.md). This article explains the parts so you can write tests
of your own.

## A first test

A test file imports `test` and `assert`, and the code it tests:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTask, getTasks } from './todo.js'

test('addTask adds a task last in the list', () => {
  addTask('Wash clothes')
  addTask('Do the dishes')
  assert.deepEqual(getTasks(), ['Wash clothes', 'Do the dishes'])
})
```

`test()` takes a name and a function. The name is a sentence that says what should be true, so that a failing test
tells you what broke. The function does three things, often in this order:

1. **Arrange**: get to the starting point, here an empty list.
2. **Act**: call the code you test, `addTask()` twice.
3. **Assert**: check the result. If the check fails, `assert` throws an error and the test fails.

## Where the tests are, and how they run

In the course a test file lives next to the code it tests and has the same name with `.test.js`:
`practice/1-20/todo.js` and `practice/1-20/todo.test.js`, `src/http-app.js` and `src/http-app.test.js`.

`npm test` runs `node --test`, which finds every file named like `*.test.js` in the repo (outside `node_modules`) and
runs them. Name a directory to run only the tests in it:

```bash
npm test                     # all the tests
npm test -- practice/1-20    # only the tests in practice/1-20
npm test -- src              # only the app's tests
npm run check                # ESLint, Prettier and all the tests
```

The `--` tells npm that what follows is for `node --test`, not for npm itself.

### Only one file, or only some tests

Name a file instead of a directory to run only that file. To run only some tests, give a part of their names with
`--test-name-pattern`: only the tests whose name contains it run, the others are left out of the output.

```bash
npm test -- src/model/todo.test.js                      # only the tests in this file
npm test -- --test-name-pattern="addTask" practice/1-20 # only the tests with addTask in the name
```

The pattern is matched against the name you gave the test, `test('addTask adds a task last in the list', ...)`, so
good test names make it easy to pick the ones you work on. Run all the tests again when you are done, as
`npm run check` does.

## Reading the output

Each test gets a line: `✔` passed, `✖` failed. A summary follows, and last the failing tests with the reason:

```text
✖ sum adds two numbers (1.303188ms)
✔ later rejects a negative value (0.474579ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:

test at src/sum.test.js:5:1
✖ sum adds two numbers (1.303188ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  5 !== 6

      at TestContext.<anonymous> (file:///.../src/sum.test.js:6:10)
```

Read it from the top: which test (`sum adds two numbers`), where (`sum.test.js:5`), and what: the code gave `5`, the
test expected `6`. The first `at` line points at the assert that failed; the lines after it are Node's own code and
can be skipped. Then decide which is wrong, the code or the test.

## Assertions

Import `node:assert/strict`, the strict variant: it compares with `===`, so `1` and `'1'` are not equal. The ones you
need most:

| Assertion | Passes when |
|---|---|
| `assert.equal(actual, expected)` | The values are the same (`===`): numbers, strings, booleans |
| `assert.deepEqual(actual, expected)` | Arrays or objects have the same content |
| `assert.notEqual(actual, expected)` | The values differ |
| `assert.ok(value)` | The value is truthy |
| `assert.match(string, /regexp/)` | The string matches the regular expression |
| `assert.throws(() => code, /message/)` | The function throws an error whose message matches |
| `await assert.rejects(promise, /message/)` | The promise is rejected with a matching error |

Put the value from your code first and the expected value second; the error message is written that way round.

`equal` on two arrays fails even when they look the same, since two arrays are two different objects. Use
`deepEqual` for arrays and objects:

```js
assert.deepEqual(getTasks(), [])          // passes for an empty list
assert.equal(getTasks(), [])              // fails: not the same array
```

### Test the errors too

Code that should throw needs a test that it does. Give `assert.throws()` a function that calls the code, not the call
itself, or the error is thrown before `assert` can catch it:

```js
test('deleteTask throws on a number outside the list', () => {
  addTask('Wash clothes')
  assert.throws(() => deleteTask(2), /valid task number/)
})
```

## Before and after: hooks

A module runs once and keeps its variables (see [ES modules in Node.js](es-modules.md)), so all the tests in
`todo.test.js` share the same list. A task added in one test is still there in the next, and the tests start to depend
on the order they run in. A **hook** fixes that by running code around the tests:

```js
import { test, beforeEach } from 'node:test'

beforeEach(() => clearTasks())
```

| Hook | Runs |
|---|---|
| `before(fn)` | Once, before the first test in the file |
| `after(fn)` | Once, after the last test |
| `beforeEach(fn)` | Before every test |
| `afterEach(fn)` | After every test |

Each test should be able to run alone and in any order. If a test passes only after another one, it is the setup that
is missing.

## Async tests

Code that waits, such as `fetch()` or a database query (week 3), is tested with an `async` function and `await`. The
test runner waits for the function to finish:

```js
test('GET /api/hello answers with JSON', async () => {
  const res = await fetch(`${baseUrl}/api/hello`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { message: 'Hello World' })
})
```

Forget an `await` and the test may finish, and pass, before the check has run.

## Testing a web server

To test a server, start it in the test file, send it requests with `fetch()` and check the responses. This is how
`src/http-app.test.js` in 1-30 does it:

```js
let server
let baseUrl

before(async () => {
  server = createApp()
  await new Promise((resolve) => server.listen(0, resolve))
  baseUrl = `http://localhost:${server.address().port}`
})

after(() => server.close())
```

- `createApp()` comes from `src/http-app.js`, which only creates the server. `src/http-server.js` starts it on
  `$PORT`. Because the two are apart, the test can start its own server.
- Port `0` means "any free port". The tests never clash with a server you are running yourself, and
  `server.address().port` tells which port it got.
- `after()` closes the server, or the test run would not end.

A response from `fetch()` has the status in `res.status`, the headers in `res.headers.get('content-type')`, and the
body through `await res.text()` or `await res.json()`. Week 2 tests the Express app the same way.

## Useful when you work

```bash
node --test --watch                        # run the tests again when a file is saved
node --test --test-name-pattern=deleteTask # only the tests whose name matches
npm run test:coverage                      # which lines of your code the tests ran
```

The coverage report shows, per file, how many of the lines, branches and functions ran during the tests. A line that
never ran is a line no test checks. It does not tell you if the checks are good, only where there are none.

`describe()` and `it()` are in `node:test` too, for grouping tests, if you know them from other test tools:

```js
import { describe, it } from 'node:test'

describe('deleteTask', () => {
  it('removes by number, starting at 1', () => {
    // ...
  })
})
```

## What makes code easy to test

- **Return instead of print.** `getTasksAsJson()` returns a string that a test can check; `printTasks()` writes to
  the terminal, and a test cannot easily see that. Keep the printing at the edge of the program, in `main.js`.
- **Split creating from starting.** `createApp()` without `listen()` lets the test start the server its own way.
- **One behaviour per test.** Several small tests with clear names tell you more when one fails than one large test.
- **Test the edges.** An empty list, the first and the last task, a number outside the list, an empty string.

## Summary

- A test runs the code and checks the result with `assert`; `npm test` runs every `*.test.js` file.
- Use `node:assert/strict`: `equal` for values, `deepEqual` for arrays and objects, `throws` and `rejects` for errors.
- Hooks (`before`, `beforeEach` …) give every test the same starting point.
- `async` and `await` for code that waits; a server is tested on port 0 with `fetch()`.
- Code that returns values is easier to test than code that prints.

## Read more

- Node.js, the test runner: https://nodejs.org/api/test.html
- Node.js, assert: https://nodejs.org/api/assert.html
- MDN, Using the Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
