# Express 5 in short

Express is a small framework on top of the web server in `node:http`. You give it routes, "when a `GET` comes for
this path, run this function", and it does the rest: it reads the URL, finds the route, and helps you send the
answer. This article goes through how an Express 5 app is built and how a request travels through it, with the same
names and files as the exercises.

You start with Express in exercise [2-10 Hello Express](../exercise/2-10-hello-express.md), and every server in the
course after that is an Express app.

## From `node:http` to Express

In [1-30](../exercise/1-30-hello-web-server.md) you wrote one function that got every request, and an `if` for each
route:

```js
http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Hello World' }))
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not Found\n')
})
```

The same route in Express:

```js
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' })
})
```

- `app.get()` says the method and the path; Express does the `if`.
- `res.json()` turns the object into JSON, and sets the status 200 and the `Content-Type`.
- A request that no route answers gets a 404 from Express, without a line of code from you.

`req` and `res` are the same objects as in `node:http`, with more methods added. Under the hood an Express app is
still a `node:http` server.

## The app and the server

As in 1-30 the app and the start of the server are two files. `src/app.js` creates the app and its routes, and
exports it:

```js
import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World\n')
})

export default app
```

`src/server.js` starts it on a port:

```js
import app from './app.js'

const port = process.env.PORT ?? 3000

app.listen(port, (error) => {
  if (error) {
    throw error
  }
  console.log(`Server listening on http://localhost:${port}`)
})
```

- `app.listen()` creates the `node:http` server and starts it. It returns that server, which the tests use.
- The function after the port gets an `error` when the server could not start, for example when the port is busy
  (`EADDRINUSE`). Without the `if` the program would say "Server listening" even then.
- Because `app.js` does not start anything, a test can import the app and start it on a port of its own.

## A request goes through the app in order

An Express app is a list of functions. A request starts at the top and goes down the list until a function sends an
answer. Every `app.use()` and `app.get()` adds to the list, in the order they are in the file.

A function that takes `(req, res, next)` and calls `next()` is a **middleware**: it does something with every request
and lets it go on. This one logs each request when its answer is sent:

```js
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start} ms`)
  })
  next()
})
```

```text
GET /api/hello 200 1 ms
GET /api/hello/Ada?lang=fi 400 0 ms
GET /nope 404 0 ms
```

A whole `src/app.js` shows the order. Read it from the top, as a request does:

```js
import path from 'node:path'
import express from 'express'
import apiRouter from './route/api.js'

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(import.meta.dirname, 'views'))

// 1. Middleware: for every request
app.use(express.json())
app.use(express.static(path.join(import.meta.dirname, '..', 'public')))

// 2. Routes
app.get('/', (req, res) => {
  res.send('Hello World\n')
})
app.use('/api', apiRouter)

// 3. No route answered: 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 4. An error in a route: 500
app.use((error, req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server' })
})

export default app
```

1. **Middleware first.** `express.json()` reads a JSON body into `req.body`. `express.static()` answers with a file
   from `public/` when there is one, `/style.css` gives `public/style.css`, and otherwise calls `next()`.
2. **The routes.** The first one that matches the method and the path answers.
3. **The 404 handler.** An `app.use()` without a path matches everything, so it must be after all the routes: it
   gets only what no route answered.
4. **The error handler**, last. More about it below.

The order is the most common source of surprises: a 404 handler above a route means the route is never reached, and
`express.json()` below a route means that route has no `req.body`.

## Routes

A route is a method, a path and a function:

```js
app.get('/books', (req, res) => { ... })     // read
app.post('/books', (req, res) => { ... })    // create
app.put('/books/:id', (req, res) => { ... }) // replace
app.delete('/books/:id', (req, res) => { ... })
```

### Route parameters

A part of the path that starts with `:` is a **route parameter**. It matches any value in that place, and the value
ends up in `req.params`:

```js
router.get('/users/:userId/books/:bookId', (req, res) => {
  res.json(req.params)
})
```

`GET /users/7/books/42` gives `{"userId":"7","bookId":"42"}`. The values are always **strings**: turn an id into a
number yourself, and answer 400 when it is not one, as in 2-20 and 2-50.

Express 5 has two more forms you may meet:

- `{...}` makes a part optional: `/report{.:format}` matches both `/report` and `/report.csv`, and `req.params.format`
  is `undefined` or `'csv'`.
- `*name` matches the rest of the path, slashes and all: `/docs/*path` matches `/docs/a/b/c.md`, and
  `req.params.path` is the array `['a', 'b', 'c.md']`. The `*` always has a name.

### The query string

The part of the URL after `?` is the **query string**. Express reads it into `req.query`, an object with a key for
each name:

```js
router.get('/hello/:name', (req, res) => {
  const lang = req.query.lang ?? 'en'
  if (!Object.hasOwn(greetings, lang)) {
    return res.status(400).json({ error: `Unknown language: ${lang}` })
  }
  res.json({ message: `${greetings[lang]} ${req.params.name}` })
})
```

`GET /hello/Ada?lang=sv` gives `{"message":"Hej Ada"}`. A name that is not in the URL is `undefined`, so `??` gives
the default. These values are strings too.

A rule of thumb: the route parameter says **which** thing (`/books/42`), the query string **how** you want the list
(`/books?author_id=1&before=1950`), with filters, sorting or a language.

### The body

A `POST` or `PUT` sends its data in the body. With `app.use(express.json())` a JSON body is in `req.body`:

```js
router.post('/echo', (req, res) => {
  res.status(201).json({ got: req.body })
})
```

```bash
curl -i -X POST -H 'Content-Type: application/json' -d '{"title":"Mio"}' http://localhost:3000/api/echo
```

The answer is `201 Created` with `{"got":{"title":"Mio"}}`. Without the header `Content-Type: application/json`,
`express.json()` leaves the body alone and `req.body` is `undefined`.

## The answer

Each request gets exactly **one** answer. The methods of `res` that you use most:

| Method | Does |
|---|---|
| `res.json(value)` | sends the value as JSON, with `Content-Type: application/json` |
| `res.send(text)` | sends a text, as HTML unless you say otherwise |
| `res.status(code)` | sets the status code; returns `res`, so you go on with `.json()` or `.send()` |
| `res.sendStatus(code)` | sends only the status code, `res.sendStatus(204)` |
| `res.type('text')` | sets the `Content-Type`, here `text/plain` |
| `res.redirect(path)` | sends `302 Found` with a `Location` header |
| `res.render(view, data)` | fills a template and sends the HTML |

The status is 200 unless you set it. Put `return` in front of an answer in the middle of a route, as in
`return res.status(400).json(...)`: the function stops there, and the route never tries to answer twice. If it does,
the server logs `Cannot set headers after they are sent to the client`.

## A router

All routes in `app.js` soon make a long file. A **router** is a group of routes in a file of its own, which the app
mounts on a path. `src/route/api.js`:

```js
import express from 'express'

const router = express.Router()

router.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' })
})

export default router
```

In `src/app.js`:

```js
import apiRouter from './route/api.js'

app.use('/api', apiRouter)
```

`app.use('/api', apiRouter)` sends every request whose path starts with `/api` to the router, with `/api` taken off.
The router does not know where it is mounted: its route `/hello` answers on `/api/hello`. A router can have
middleware of its own with `router.use()`, which then runs only for its routes.

## Routes that wait: `async`

A route that reads a database or a file waits for a promise. Make the function `async` and `await` the result:

```js
router.get('/books', async (req, res) => {
  const books = await getBooks()
  res.json(books)
})
```

Forget the `await`, and `res.json()` gets the promise instead of the rows. A promise has no keys of its own, so the
answer is `{}` with status 200, and no error. When a route answers `{}`, look for the missing `await` first.

If the promise is *rejected*, for example when the database does not answer, `await` throws. Express 5 catches the
error and sends it to the error handler: you need no `try`/`catch` in the route for that.

## The error handler

A function with **four** parameters is an error handler. Express knows it by the count, so all four must be there,
also the `next` you do not use (the `_` tells ESLint that it is unused on purpose):

```js
app.use((error, req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server' })
})
```

It gets every error from the routes above it: an error that is thrown, and a promise that is rejected in an `async`
route. `console.error()` writes the whole error, with the stack trace, in the terminal of the server; the client gets
only the short message.

Without an error handler of your own, Express answers 500 with an HTML page that shows the stack trace, the lines of
your code with their paths. Fine on your own computer, but not something to show a client of a JSON API.

Some errors carry their own status code. `express.json()` gives a body that is not valid JSON an error with
`status` 400, and the error handler can use it:

```js
app.use((error, req, res, _next) => {
  const status = error.status ?? 500
  if (status === 500) {
    console.error(error)
  }
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server' : error.message })
})
```

## Static files and templates

Two kinds of answers are not JSON: files, and web pages built from a template. Exercise
[2-30](../exercise/2-30-ejs.md) goes through both.

- `app.use(express.static(dir))` answers with the files in a directory: CSS, images, JavaScript for the browser.
- `res.render('hello', { name })` fills the template `src/views/hello.ejs` with the values and sends the HTML. The
  template engine is set with `app.set('view engine', 'ejs')`, and the directory with `app.set('views', ...)`.

```html
<h1>Hello <%= name %></h1>
```

`<%=` escapes the value: `/hello?name=<b>Ada</b>` gives `<h1>Hello &lt;b&gt;Ada&lt;/b&gt;</h1>`, so the text is shown
as text and never runs as HTML. That is the protection against XSS; `<%-` does not escape, and is only for HTML you
wrote yourself.

## Testing the app

The tests start the app on port 0, any free port, and send requests with `fetch()`, as you tested the `node:http`
server in 1-30:

```js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import app from './app.js'

let server
let baseUrl

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve)
  })
  baseUrl = `http://localhost:${server.address().port}`
})

after(() => server.close())

test('GET /api/hello/Ada?lang=sv answers in Swedish', async () => {
  const res = await fetch(`${baseUrl}/api/hello/Ada?lang=sv`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { message: 'Hej Ada' })
})
```

The tests call the app over HTTP, so they do not care which file a route is in: move routes to a router, and the
same tests tell you that nothing broke. More in [Testing with Node.js](testing-with-node.md), "Testing a web server".

## Summary

- `src/app.js` creates the app and exports it; `src/server.js` starts it with `app.listen()`.
- A request goes through the middleware and the routes in the order of the file, until one of them answers.
- The method and the path pick the route. `req.params` has the route parameters, `req.query` the query string,
  `req.body` the JSON body, all as strings from the client.
- One answer per request: `res.status()`, then `res.json()` or `res.send()`, with `return` when you answer early.
- A router groups routes in a file, and `app.use('/api', router)` mounts it.
- `async` routes `await` their data; a rejected promise goes to the error handler, the function with four
  parameters, last in `app.js` after the 404 handler.

## Read more

- Express 5, the API: https://expressjs.com/en/5x/api.html
- Routing, route parameters and `express.Router()`: https://expressjs.com/en/guide/routing.html
- Writing middleware: https://expressjs.com/en/guide/writing-middleware.html
- Using middleware, and the order: https://expressjs.com/en/guide/using-middleware.html
- Error handling: https://expressjs.com/en/guide/error-handling.html
- Static files: https://expressjs.com/en/starter/static-files.html
- Template engines: https://expressjs.com/en/guide/using-template-engines.html
- MDN, HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
