/**
 * main.js, run against a stand-in for the host's api shim.
 *
 * The real `@electerm/widget-api` is written into the widget folder by electerm
 * itself, so it does not exist here; everything else about the module is the
 * code that runs inside the app, including what it hands to `css.apply`.
 *
 * Run: node --test test/*.test.js
 */

const test = require('node:test')
const assert = require('node:assert')
const Module = require('node:module')

const applied = []
const logs = []
const fakeApi = {
  id: 'hide-ui-elements',
  log: (level, msg) => logs.push([level, msg]),
  css: {
    apply: css => {
      applied.push(css)
      return css
    },
    remove: () => {
      applied.push('')
      return ''
    }
  }
}

const load = Module._load
Module._load = function (request, ...rest) {
  if (request === '@electerm/widget-api') {
    return fakeApi
  }
  return load.call(this, request, ...rest)
}
const { widgetRun } = require('../main')
const { ALL, OPTIONS, buildCss } = require('../options')

const reset = () => {
  applied.length = 0
  logs.length = 0
}

test('a run is an instance the host can key and stop', () => {
  const a = widgetRun({ hideAll: true })
  const b = widgetRun({ hideAll: true })
  assert.strictEqual(typeof a.instanceId, 'string')
  assert.ok(a.instanceId.startsWith('hide-ui-elements-'))
  assert.notStrictEqual(a.instanceId, b.instanceId)
  assert.strictEqual(typeof a.start, 'function')
  assert.strictEqual(typeof a.stop, 'function')
})

test('start applies the stylesheet for the switches, once', async () => {
  reset()
  const instance = widgetRun({ hideAll: true })
  const result = await instance.start()
  assert.deepStrictEqual(applied, [buildCss({ [ALL]: true })])
  assert.strictEqual(result.success, true)
  assert.match(result.msg, new RegExp(`${OPTIONS.length} element groups hidden`))
  // the log line names the switches, which is what the panel's log shows
  assert.strictEqual(logs.length, 1)
  assert.strictEqual(logs[0][0], 'info')
  assert.match(logs[0][1], /hideAddTabButton/)
})

test('a single switch applies its own rule and nothing else', async () => {
  reset()
  const instance = widgetRun({ hideFooterAi: true })
  const result = await instance.start()
  assert.deepStrictEqual(applied, [buildCss({ hideFooterAi: true })])
  assert.match(result.msg, /^1 element group hidden/)
})

test('nothing ticked clears what an earlier run applied', async () => {
  reset()
  const instance = widgetRun({})
  const result = await instance.start()
  // '' is how the host is told to drop the widget's stylesheet
  assert.deepStrictEqual(applied, [''])
  assert.match(result.msg, /nothing is hidden/i)
  assert.deepStrictEqual(logs, [])
})

test('stop takes the stylesheet off', async () => {
  reset()
  const instance = widgetRun({ hideAll: true })
  await instance.start()
  await instance.stop()
  assert.deepStrictEqual(applied, [buildCss({ [ALL]: true }), ''])
})

test('the config object is not mutated and not shared between runs', async () => {
  reset()
  const config = { hideFooterAi: true }
  const frozen = JSON.stringify(config)
  const first = widgetRun(config)
  const second = widgetRun({ hideAll: true })
  await first.start()
  await second.start()
  assert.strictEqual(JSON.stringify(config), frozen)
  assert.deepStrictEqual(applied, [
    buildCss({ hideFooterAi: true }),
    buildCss({ [ALL]: true })
  ])
})
