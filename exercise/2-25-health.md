# 2-25 A health route: find your way in the Node.js documentation

In 2-20 the exercise showed you the code of each route. In this exercise you write the code yourself, and find what
you need in the documentation of Node.js. The route is `/api/health`, and it tells how the server is doing.

This is what happens, step by step:

- You add a router for `/api/health` that answers that the server is up.
- You add one part at a time: how long the server has run, which Node.js it runs on, how much memory it uses and what
  the machine looks like. Each part says what the route should answer and where in the documentation to look; the
  solution is there if you get stuck.
- A part the route does not know gives 404, and `?details=true` gives all parts at once.
- You write the tests yourself, from templates. They check the shape of the answer, since the values change each time.

You need 2-20 done; you go on with its app. When you are done, `src/route/` has two new files:

```
src/
├── app.js               mounts the health router on /api/health
└── route/
    ├── api.js
    ├── health.js        the health routes, in a router
    └── health.test.js   your tests for the health routes
```

## Background: a health route

An app in production often has a route that only answers the question "are you alive, and how are you?". It is called
by the things around the app: a load balancer that sends traffic only to the servers that answer, `HEALTHCHECK` in
Docker that restarts a container that does not, and monitoring that warns when memory runs low. A health route answers
fast, as JSON, and needs no login.

What it tells comes from Node.js itself. Two parts of the Node.js API are enough here:

- `process` is a global object about the running Node.js process: its version, its id, how long it has run and how
  much memory it uses. You use it without `import`. The documentation: https://nodejs.org/api/process.html
- `node:os` is a module about the operating system and the machine: the host name, the CPUs, the memory. You import
  it: `import os from 'node:os'`. The documentation: https://nodejs.org/api/os.html

A page in the Node.js documentation has a list of contents on the left (or at the top), with one entry per method or
property, such as `process.uptime()`. Each entry says what it returns, with the type in `<>`: `Returns: <number>`. Read
that line first; it tells you what you get back.

## 1. See where you are

You have the API routes in `src/route/api.js`, mounted on `/api`, from 2-20. Start the server and leave it running,
and use a second terminal for `curl`:

```bash
export PORT=3000
npm run dev
```

## 2. A router that says ok

Create `src/route/health.js` with a router that answers `GET /` with the status and the time right now, and mount it
on `/api/health` in `src/app.js`, after the line for `/api`:

```bash
curl -i http://localhost:$PORT/api/health
```

```json
{ "status": "ok", "time": "2026-11-20T13:37:00.000Z" }
```

The time is in UTC in the format ISO 8601, the usual way to write a time in JSON.

Hint: the router is built as `src/route/api.js` is. A `Date` made with `new Date()` is the time right now, and it has
a method that gives exactly this format: look at the methods of `Date` on MDN,
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date.

<details>
<summary>A solution</summary>

`src/route/health.js`:

```js
import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

export default router
```

And in `src/app.js`:

```js
import healthRouter from './route/health.js'
```

```js
app.use('/api/health', healthRouter)
```

</details>

## 3. How long has the server run?

Add `uptime`: the number of seconds since the server started, as a whole number.

```json
{ "status": "ok", "time": "2026-11-20T13:37:00.000Z", "uptime": 42 }
```

Hint: look in the list of contents of `process` for a method that tells how long the process has run. What unit does
it return, and is it a whole number? `Math.round()` rounds a number.

<details>
<summary>A solution</summary>

```js
router.get('/', (req, res) => {
  const health = {
    status: 'ok',
    time: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  }
  res.json(health)
})
```

`process.uptime()` returns the seconds with decimals. The server restarts each time you save, so `uptime` starts again
from 0.

</details>

## 4. Which Node.js?

Add a route `GET /api/health/node` that answers with the version of Node.js, the platform (the operating system) and
the process id:

```json
{ "version": "v26.13.1", "platform": "linux", "pid": 4711 }
```

Write it as a function `nodeInfo()` that returns the object, and a route that answers with what the function returns.
You use the function again in step 7.

Hint: all three are properties of `process`, not methods: no `()` after them. Look for them in the list of contents.

<details>
<summary>A solution</summary>

```js
function nodeInfo() {
  return {
    version: process.version,
    platform: process.platform,
    pid: process.pid,
  }
}
```

```js
router.get('/node', (req, res) => {
  res.json(nodeInfo())
})
```

Put the function before the routes.

</details>

On Windows the platform is `win32`, also on 64 bits, and on macOS it is `darwin`.

## 5. How much memory?

Add a route `GET /api/health/memory` with a function `memoryInfo()` that answers with the memory the process uses, in
megabytes (MB) as whole numbers:

```json
{ "heapUsedMb": 9, "heapTotalMb": 12, "rssMb": 61 }
```

- `heapUsed` and `heapTotal`: the memory for your JavaScript objects, used and reserved.
- `rss`: all memory the process holds, Node.js itself included.

Hint: one method of `process` gives all three at once, in bytes. A megabyte here is 1024 × 1024 bytes. You need the
conversion in the next step too, so write it as a small function `toMb(bytes)`.

<details>
<summary>A solution</summary>

```js
function toMb(bytes) {
  return Math.round(bytes / 1024 / 1024)
}
```

```js
function memoryInfo() {
  const memory = process.memoryUsage()
  return {
    heapUsedMb: toMb(memory.heapUsed),
    heapTotalMb: toMb(memory.heapTotal),
    rssMb: toMb(memory.rss),
  }
}
```

```js
router.get('/memory', (req, res) => {
  res.json(memoryInfo())
})
```

</details>

## 6. What machine?

Add a route `GET /api/health/system` with a function `systemInfo()` that answers with facts about the machine: its
host name, how many CPUs Node.js can use, the free and the total memory in MB, and the load average.

```json
{
  "hostname": "my-laptop",
  "cpus": 8,
  "freeMemoryMb": 5120,
  "totalMemoryMb": 16384,
  "loadAverage": [0.52, 0.48, 0.41]
}
```

Hint: this is the module `node:os`, so start with `import os from 'node:os'` at the top of `health.js`. Each value is
one method in its list of contents. For the CPUs there are two ways: one gives a list of the CPUs, and one gives the
number directly. Which one did you choose?

<details>
<summary>A solution</summary>

```js
import os from 'node:os'
```

```js
function systemInfo() {
  return {
    hostname: os.hostname(),
    cpus: os.availableParallelism(),
    freeMemoryMb: toMb(os.freemem()),
    totalMemoryMb: toMb(os.totalmem()),
    loadAverage: os.loadavg(),
  }
}
```

```js
router.get('/system', (req, res) => {
  res.json(systemInfo())
})
```

`os.cpus().length` gives the same number on most machines. The documentation recommends
`os.availableParallelism()` when the question is how many things Node.js can do at the same time.

</details>

The load average is how many processes wanted the CPU, on average over the last 1, 5 and 15 minutes. It exists on
Linux and macOS. **On Windows `os.loadavg()` always returns `[0, 0, 0]`**: that is not a bug in your code, Windows has
no load average.

## 7. An unknown part gives 404

Now try a part that does not exist:

```bash
curl -i http://localhost:$PORT/api/health/nope
```

Express answers with its own 404 page in HTML. Make the health router answer with JSON instead, with the part in the
message:

```json
{ "error": "Unknown part: nope" }
```

Hint: a route with a route parameter, `/:part`, matches every path one level down, so `/node` too. Express tries the
routes in the order they are written: put it last in the router, after the routes for `/node`, `/memory` and
`/system`.

<details>
<summary>A solution</summary>

```js
router.get('/:part', (req, res) => {
  res.status(404).json({ error: `Unknown part: ${req.params.part}` })
})
```

</details>

Move the route first in the router for a moment and try `/api/health/node`. What happens, and why?

## 8. All parts at once

Let `GET /api/health?details=true` add all three parts to the answer, each under its own key. Without `details`, the
answer is as before.

```json
{
  "status": "ok",
  "time": "2026-11-20T13:37:00.000Z",
  "uptime": 42,
  "node": { "version": "v26.13.1", "platform": "linux", "pid": 4711 },
  "memory": { "heapUsedMb": 9, "heapTotalMb": 12, "rssMb": 61 },
  "system": { "hostname": "my-laptop", "cpus": 8, "...": "..." }
}
```

Hint: this is where the functions pay off. Remember that everything in the query string is a string: `details` is
`'true'`, not `true`.

<details>
<summary>A solution</summary>

```js
router.get('/', (req, res) => {
  const health = {
    status: 'ok',
    time: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  }
  if (req.query.details === 'true') {
    health.node = nodeInfo()
    health.memory = memoryInfo()
    health.system = systemInfo()
  }
  res.json(health)
})
```

</details>

Try `?details=true`, `?details=yes` and no `details`.

## 9. Test the health routes

The answers change each time: the time, the uptime, the memory. A test cannot compare them with fixed values. Instead
it checks the *shape* of the answer: that the right keys are there, that a value is a number, that a time can be read
as a time.

Create `src/route/health.test.js`. It starts the app as `src/app.test.js` does; note the path `'../app.js'`, one
directory up. The first test is given:

```js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import app from '../app.js'

let server
let baseUrl

// Start the app on a free port before the tests, stop it after.
before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve)
  })
  baseUrl = `http://localhost:${server.address().port}`
})

after(() => server.close())

test('GET /api/health says ok and the time', async () => {
  const res = await fetch(`${baseUrl}/api/health`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.status, 'ok')
  assert.ok(!Number.isNaN(Date.parse(body.time)))
})
```

`assert.ok()` passes when its value is true. `Date.parse()` returns the time as a number, or `NaN` when the string is
not a time, so the last line checks that `time` is a real time.

Run the tests of the exercise with `npm test -- src/route`. Then add the four tests below, one at a time, and run them
after each.

```js
test('uptime is a number of seconds', async () => {
  // 1. Fetch /api/health and get the body
  // 2. Check that uptime is a number (typeof)
  // 3. Check that it is 0 or more
})

test('GET /api/health/memory gives the memory in MB', async () => {
  // 1. Fetch /api/health/memory and check that the status is 200
  // 2. Check that heapUsedMb is a number
  // 3. Check that rssMb is more than 0
})

test('an unknown part gives 404', async () => {
  // 1. Fetch /api/health/nope
  // 2. Check that the status is 404 and the body is { error: 'Unknown part: nope' }
})

test('?details=true gives all the parts', async () => {
  // 1. Fetch /api/health?details=true and get the body
  // 2. Check that its keys are exactly status, time, uptime, node, memory and system
})
```

Hint for the last one: `Object.keys(body)` gives the keys of an object as an array, in the order they were added.

<details>
<summary>A solution: uptime</summary>

```js
test('uptime is a number of seconds', async () => {
  const res = await fetch(`${baseUrl}/api/health`)
  const body = await res.json()
  assert.equal(typeof body.uptime, 'number')
  assert.ok(body.uptime >= 0)
})
```

</details>

<details>
<summary>A solution: the memory</summary>

```js
test('GET /api/health/memory gives the memory in MB', async () => {
  const res = await fetch(`${baseUrl}/api/health/memory`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(typeof body.heapUsedMb, 'number')
  assert.ok(body.rssMb > 0)
})
```

</details>

<details>
<summary>A solution: an unknown part</summary>

```js
test('an unknown part gives 404', async () => {
  const res = await fetch(`${baseUrl}/api/health/nope`)
  assert.equal(res.status, 404)
  assert.deepEqual(await res.json(), { error: 'Unknown part: nope' })
})
```

</details>

<details>
<summary>A solution: <code>?details=true</code></summary>

```js
test('?details=true gives all the parts', async () => {
  const res = await fetch(`${baseUrl}/api/health?details=true`)
  const body = await res.json()
  assert.deepEqual(Object.keys(body), ['status', 'time', 'uptime', 'node', 'memory', 'system'])
})
```

</details>

## Check and commit

Stop the server with `Ctrl+C`, then:

```bash
npm run check
git add src
git commit -m "2-25 A health route with facts from process and os"
```

If you have a remote of your own, push with `git push`.

### Verify

- [ ] `/api/health` answers `status`, `time` and `uptime`, and with `?details=true` also `node`, `memory` and
      `system`.
- [ ] `/api/health/node`, `/api/health/memory` and `/api/health/system` answer with their part, and an unknown part
      gives `404` with an error as JSON.
- [ ] `npm run check` passes, with your five tests in `src/route/health.test.js`.
- [ ] You can find a method in the Node.js documentation and tell what it returns.
- [ ] You can say how a test checks an answer whose values change each time.

<details>
<summary><code>ReferenceError: os is not defined</code></summary>

`process` is global, but `os` must be imported. Put `import os from 'node:os'` at the top of `src/route/health.js`.

</details>

<details>
<summary><code>/api/health/node</code> answers "Unknown part: node"</summary>

The route `/:part` is before the route `/node` in the router, so it takes the request first. Move `/:part` last.

</details>

<details>
<summary><code>?details=true</code> gives no details</summary>

Check that you compare with the string: `req.query.details === 'true'`. With `=== true` it is never equal, since
everything in the query string is a string.

</details>

<details>
<summary>The test cannot find the app: <code>Cannot find module '.../src/route/app.js'</code></summary>

The test is in `src/route/`, one directory below `app.js`. Import it with `'../app.js'`.

</details>

## Challenge

Let `/api/health` answer `503 Service Unavailable` with `status: 'degraded'` when the free memory of the machine is
below a limit given in the query string, for example `?minFreeMb=500`. Without `minFreeMb` it is always `ok`. Write a
test for it: how do you make the server answer 503 in a test, whatever machine it runs on?

## Read more

- `process` in the Node.js API: https://nodejs.org/api/process.html
- `os` in the Node.js API: https://nodejs.org/api/os.html
- `Date.prototype.toISOString()`:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
- Health checks in Docker, `HEALTHCHECK`: https://docs.docker.com/reference/dockerfile/#healthcheck
- HTTP status codes, 503 Service Unavailable: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503
