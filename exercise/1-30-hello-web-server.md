# 1-30 Hello World: a web server with node:http

You start the app that grows in `src/` through the course. This week it is the smallest web server there is, written
with only Node's built-in `node:http`: it answers `Hello World` as text on `/`, the same as JSON on `/api/hello`, and
404 on everything else. You meet the request and the response, status codes, the `Content-Type` header, and how to
test a server.

When you are done, `src/` has three files:

```
src/
├── http-app.js        creates the server and decides what to answer
├── http-app.test.js   tests that call the server over HTTP
└── http-server.js     starts the server on a port
```

The names start with `http-` because this server uses `node:http`. Next week the app moves to Express in `app.js` and
`server.js`, and this week's server stays next to it, so you can compare the two.

## Background: request and response

A web server waits for requests. A client (the browser, `curl`, a test) sends a request with a **method** (`GET`) and
a **path** (`/api/hello`). The server sends back a response with a **status code** (`200` OK, `404` Not Found),
**headers** such as `Content-Type`, and a **body**.

```mermaid
sequenceDiagram
  participant C as Client (browser, curl)
  participant S as Server (node:http)
  C->>S: GET /api/hello
  S-->>C: 200, Content-Type: application/json<br>{"message":"Hello World"}
  C->>S: GET /nope
  S-->>C: 404, Not Found
```

In `node:http` you write one function that receives every request (`req`) and writes the response (`res`). What path
gives what answer is up to you. Next week Express takes over that part.

## 1. See where you are

`package.json` has two scripts for the app, `npm start` and `npm run dev`. They start `src/server.js`, which is the
Express app from next week, so they do not work yet: if you try, you get a long error that starts with
`Error: Cannot find module '.../src/server.js'` (code `MODULE_NOT_FOUND`), after a line `.env not found. Continuing
without it.` that you can ignore. That is expected. This week you start the
server with `node` directly.

## 2. Create the app

`http-app.js` creates the server but does not start it. Keeping the two apart lets the tests start their own server.

Create `src/http-app.js`:

```js
import http from 'node:http'

export function createApp() {
  return http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Hello World\n')
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found\n')
  })
}
```

`res.writeHead()` sets the status code and the headers, `res.end()` sends the body and ends the response. The `return`
makes sure only one response is sent.

## 3. Start the server

`http-server.js` starts the app on a port. Create `src/http-server.js`:

```js
import { createApp } from './http-app.js'

const port = process.env.PORT ?? 3000

createApp().listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
```

`process.env.PORT ?? 3000` uses the port from the environment variable `PORT` if it is set, otherwise 3000.

Choose the port in the terminal by setting `PORT`. `export` makes the variable visible to the programs you start from
that terminal, the server included, and the commands below use it as `$PORT`:

```bash
export PORT=3000
echo $PORT
```

Start the server with `--watch`, so it restarts when you save a file:

```bash
node --watch src/http-server.js
```

Open http://localhost:3000/ in the browser (use your port if you chose another). Then open a second terminal, go to
your repo, set the port there too, and try the server:

```bash
export PORT=3000
curl -i http://localhost:$PORT/
curl -i http://localhost:$PORT/nope
```

A variable you set with `export` lives only in that terminal, until you close it. In a new terminal, run
`export PORT=3000` again.

`-i` shows the status line and the headers as well as the body. Find `200`, `404` and `Content-Type` in the output.

## 4. Answer with JSON

An API answers with JSON instead of text. Add a route for `GET /api/hello` in `src/http-app.js`, after the route for
`/`, that answers status 200 with this body:

```json
{ "message": "Hello World" }
```

Two things differ from the text route: the `Content-Type` is `application/json`, and the body is an object turned
into a string with `JSON.stringify()`.

<details>
<summary>The route</summary>

```js
if (req.method === 'GET' && req.url === '/api/hello') {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'Hello World' }))
  return
}
```

</details>

Save, and the server restarts. Try it:

```bash
curl -i http://localhost:$PORT/api/hello
```

## 5. Test the server

The tests start the app on port 0, which means "any free port", and call it with `fetch()`, which is built into Node.
The tests do not use `$PORT`, so they work while your own server is running.

### 5.1 The first tests

Create `src/http-app.test.js`:

```js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './http-app.js'

let server
let baseUrl

// Start the server on a free port before the tests, stop it after.
before(async () => {
  server = createApp()
  await new Promise((resolve) => server.listen(0, resolve))
  baseUrl = `http://localhost:${server.address().port}`
})

after(() => server.close())

test('GET / says Hello World', async () => {
  const res = await fetch(`${baseUrl}/`)
  assert.equal(res.status, 200)
  assert.equal(await res.text(), 'Hello World\n')
})

test('an unknown path gives 404', async () => {
  const res = await fetch(`${baseUrl}/nope`)
  assert.equal(res.status, 404)
})
```

Run the tests with `npm test`, or only the app's tests with `npm test -- src`.

Each test sends a request with `fetch()` and checks the response: `res.status` is the status code, and
`await res.text()` reads the body as text.

### 5.2 Test the JSON route

Add a test of your own last in `src/http-app.test.js`, for `GET /api/hello`:

```js
test('GET /api/hello answers with JSON', async () => {
  // 1. Send a request to /api/hello with fetch()
  // 2. Check that the status is 200
  // 3. Check that the content-type header contains application/json
  // 4. Check that the body is { message: 'Hello World' }
})
```

Hint: `res.headers.get('content-type')` gives the header as a string, and `assert.match()` checks a string against a
regular expression. `await res.json()` reads the body and turns the JSON into data.

<details>
<summary>A solution</summary>

```js
test('GET /api/hello answers with JSON', async () => {
  const res = await fetch(`${baseUrl}/api/hello`)
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await res.json(), { message: 'Hello World' })
})
```

`/application\/json/` is a regular expression; the `\/` is a `/` that does not end it. `assert.match()` passes if the
header contains the text anywhere, so it also works if the server adds `; charset=utf-8`.

</details>

Run `npm test -- src` again. All three tests should pass.

## Check and commit

Stop the server with `Ctrl+C`, then:

```bash
npm run check
git add src
git commit -m "1-30 Hello World with node:http"
```

If you have a remote of your own, push with `git push`.

### Verify

- [ ] `node src/http-server.js` starts the server, and `/`, `/api/hello` and `/nope` answer as they should in the
      browser and with `curl -i`.
- [ ] `npm run check` passes, with your test for `/api/hello` included.
- [ ] You can explain method, path, status code, `Content-Type` and body, using the output of `curl -i`.
- [ ] You can say why `http-app.js` and `http-server.js` are two files.

<details>
<summary><code>Error: listen EADDRINUSE: address already in use :::3000</code></summary>

A server is already running on port 3000, maybe in another terminal. Stop it with `Ctrl+C`, or choose another port
with `export PORT=3001` in both terminals and start the server again. If you cannot find the terminal, find the
process that holds the port and stop it:

```bash
# Git Bash on Windows: the last column is the process id (PID)
netstat -ano | grep :3000
taskkill //PID <pid> //F

# macOS and Linux
lsof -i :3000
kill <pid>
```

More in [Troubleshooting](../doc/troubleshooting.md).

</details>

<details>
<summary><code>curl</code> says "Failed to connect to localhost port 80"</summary>

`$PORT` is empty in this terminal, so the URL becomes `http://localhost:/` and `curl` tries the default port 80. Run
`export PORT=3000` (or the port you chose) in this terminal and try again.

</details>

<details>
<summary>The browser shows the old answer after you changed the code</summary>

`node src/http-server.js` without `--watch` does not restart on changes. Use `node --watch src/http-server.js`, or
stop and start the server again.

</details>

## Challenge

Add a route `GET /` that sends the file `public/index.html` instead of text. Read the file with `readFile` from
`node:fs/promises` and use the `Content-Type` `text/html; charset=utf-8`. What happens with a CSS file the page links
to? That is the problem Express solves next week.

## Write your report

This was the last exercise of the week. Write your report in `report/week-01.md`: [report/README.md](../report/README.md)
tells you how, and the week page in Canvas has the points for the week. Commit it.

## Read more

- The recorded lectures in Canvas for this week.
- [Testing with Node.js](../doc/testing-with-node.md), the section "Testing a web server".
- HTTP in Node.js: https://nodejs.org/api/http.html
- An overview of HTTP: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
