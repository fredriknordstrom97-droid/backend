import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { addTask, getTasks, clearTasks, deleteTask, getTasksAsJson } from './todo.js'

// The list lives in the module, so empty it before each test.
beforeEach(() => clearTasks())

test('a new list is empty', () => {
  assert.deepEqual(getTasks(), [])
});

test('addTask adds a task last in the list', () => {
  addTask('Wash clothes')
  addTask('Do the dishes')
  assert.deepEqual(getTasks(), ['Wash clothes', 'Do the dishes'])
});

test('addTask throws on an empty task', () => {
  assert.throws(() => addTask(''), /valid task/)
});

test("deleteTask removes by number, starting at 1", () => {
    addTask("Do the dishes");
    addTask("Go for walk");
    assert.deepEqual(deleteTask(1), ["Do the dishes"]);
    assert.deepEqual(getTasks(), ["Go for walk"]);
});

test('deleteTask throws on a number outside the list', () => {
    addTask("Go for walk");
    assert.throws(() => deleteTask(2), /outside/);
});

test('getTasksAsJson returns the list as JSON, numbered from 1', () => {
    addTask("Go for walk");
    assert.deepEqual(JSON.parse(getTasksAsJson()), [{number: 1, task: "Go for walk"}])
});

