# Troubleshooting

Problems that show up in more than one exercise, and what to do about them. Each exercise also has a few boxes of its
own at the end, for the problems that belong to that exercise. Look there first, then here.

## The terminal and the tools

### `node: command not found` in Git Bash after installing Node

Git Bash was open during the install. Close all Git Bash windows and open a new one. If it still fails, restart the
computer, so Windows updates the `PATH`.

### `node --version` shows v24 or older, or `npm` says `EBADENGINE`

The course needs Node.js 26 or later, and `package.json` says so, which is why `npm` warns with `EBADENGINE` or stops
with `npm error engine`. An older Node is installed and found first. On Linux, install with nvm and run
`nvm install 26`. On Windows and macOS, install v26 LTS from https://nodejs.org/; it replaces the old one. See
[1-05 Lab environment](../exercise/1-05-lab-environment.md).

### `npm install` says "3 moderate severity vulnerabilities"

Leave it. It concerns the tools that check your code (ESLint), not the app, and `npm audit fix` is not needed.

### `.env not found. Continuing without it.`

Printed by `npm start` and `npm run dev`, sometimes twice. The scripts read a `.env` file if there is one; until you
have one, the line is only information.

## The server and the port

### `Error: listen EADDRINUSE: address already in use :::3000`

Another program is already listening on the port, nearly always a server of yours that is still running: in another
terminal, in a hidden terminal in your editor, or one started in the background. Stopping a program frees its port at
once, so the port is never "locked"; something is still using it.

Stop the server with `Ctrl+C` in the terminal where it runs. If you cannot find that terminal, find the process that
holds the port and stop it:

```bash
# Git Bash on Windows: the last column is the process id (PID)
netstat -ano | grep :3000
taskkill //PID <pid> //F

# macOS and Linux
lsof -i :3000
kill <pid>
```

`taskkill` takes `//PID` with two slashes in Git Bash; in PowerShell or `cmd` it is `/PID`.

Or leave it running and choose another port with `export PORT=3001` in both terminals, then start the server again.

### `curl` says "Failed to connect to localhost port 80"

`$PORT` is empty in this terminal, so the URL becomes `http://localhost:/` and `curl` tries the default port 80. A
variable set with `export` lives only in the terminal where you set it. Run `export PORT=3000` (or the port you
chose) in this terminal and try again.

### `curl` answers "no matches found", or the command hangs

The URL has a `?` or `&` without quotes, and the terminal reads them as its own characters. Put the whole URL in double
quotes: `curl -i "http://localhost:$PORT/api/hello/Ada?lang=sv"`.

### The browser or `curl` shows the old answer after you changed the code

The server runs the code it had when it started. Start it with `npm run dev` (or `node --watch`), which restarts it
when you save a file, or stop it and start it again.

### `npm test` or `curl` hangs and never ends

A route never answers: there is a way through it that reaches no `res.json()` or `res.send()`, for example an `if`
without the answer in one of its branches. Run the request with `curl` to find which route it is, stop with
`Ctrl+C`, and follow the code of that route step by step.

### `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`

A route answered twice, for example first an error and then the normal answer. Put `return` after the first answer,
so the route stops there.

## Modules and imports

### `SyntaxError: Cannot use import statement outside a module`

Node treats the file as CommonJS. Check that `package.json` has `"type": "module"` and that you run the file from
inside your repo.

### `Cannot find module '.../todo'`

The import path of a file of your own needs the file ending: `'./todo.js'`, not `'./todo'`. The path is relative to
the file that imports.

### `Cannot find package 'express'`

The package is not installed in this repo. Run `npm install` from the root of the repo (where `package.json` is), and
check that `package.json` lists the package under `dependencies`. A package you have not added yet is installed with
`npm install <name>`.

### `does not provide an export named 'default'`

The file has no `export default`, or you import a named export without `{ }`. A default export is imported without
`{ }` (`import app from './app.js'`), a named one with (`import { addTask } from './todo.js'`). See
[ES modules in Node.js](es-modules.md).

## Git

### `git pull` says "Need to specify how to reconcile divergent branches"

Git does not know whether to merge or rebase your commits with the new ones. Tell it to merge, once, and pull again:

```bash
git config --global pull.rebase false
git pull upstream main
```

### `git pull upstream main` gives a merge conflict

You have edited a file the teacher also changed, one in `doc/` or `exercise/`. Take the teacher's version of that file
and finish the merge:

```bash
git checkout --theirs <file>
git add <file>
git commit
```

### `git pull` opens an editor

Git merges the new material with your own commits and asks for a message for the merge commit. The message is fine as
it is: save and close the editor. If it opens in Vim, type `:wq` and press Enter. To skip the editor, pull with
`git pull --no-edit upstream main`.

### `Permission denied (publickey)` from `git push` or `ssh -T`

Only if you push to a remote of your own. Your SSH key is not added to GitHub or GitLab, or you added another key than
the one in `~/.ssh/id_ed25519.pub`. Print it with `cat ~/.ssh/id_ed25519.pub`, compare it with the key in your account
settings, and add it if it is missing. Or switch to the HTTPS address of your repo:

```bash
git remote set-url origin <https-url-of-your-repo>
```
