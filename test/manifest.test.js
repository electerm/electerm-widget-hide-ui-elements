/**
 * The manifest: what electerm reads before it runs a line of this widget.
 *
 * Run: node --test test/*.test.js
 */

const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const conf = pkg.electerm
const { ALL, OPTIONS } = require('../options')

test('the id is what the widget folder is called', () => {
  assert.strictEqual(conf.id, 'hide-ui-elements')
  assert.strictEqual(pkg.name, conf.id)
  assert.match(conf.id, /^[a-z0-9-]+$/)
  // the repo is electerm-widget-<id>; on install the host copies the folder to
  // <data dir>/widgets/<id>, which is the name readWidget checks against
  assert.strictEqual(path.basename(ROOT), `electerm-widget-${conf.id}`)
})

test('it is an auto-runnable instance widget with one instance', () => {
  assert.strictEqual(conf.type, 'instance')
  assert.strictEqual(conf.singleInstance, true)
  assert.strictEqual(pkg.main, 'main.js')
  assert.strictEqual(fs.existsSync(path.join(ROOT, 'main.js')), true)
  // no stylesheet of its own: the css depends on the switches, so it comes from
  // api.css.apply at run time (a `styles` entry would be applied as-is)
  assert.strictEqual(conf.styles, undefined)
})

test('the form is exactly the switches the css builder knows', () => {
  const names = conf.configs.map(c => c.name)
  // hideAll is the preset, autoRun belongs to the host: neither has css
  const switches = names.filter(name => name !== ALL && name !== 'autoRun')
  assert.deepStrictEqual(switches, OPTIONS.map(o => o.name))
  // and the order the form renders in is the order they are declared
  assert.strictEqual(names[0], ALL)
  assert.strictEqual(names[names.length - 1], 'autoRun')
})

test('every switch is an off-by-default boolean that says what it hides', () => {
  for (const config of conf.configs) {
    assert.strictEqual(config.type, 'boolean', config.name)
    assert.ok(config.label && config.label.length, config.name)
    assert.ok(config.description && config.description.length, config.name)
    assert.strictEqual(config.default, config.name === 'autoRun')
  }
})

test('the entry is the file the manifest names, and it is not desktop-only', () => {
  // main.js requires the host's api shim, which only exists inside electerm:
  // test/main.test.js runs it against a stand-in. Here, just the contract:
  assert.strictEqual(pkg.main, 'main.js')
  const src = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8')
  assert.match(src, /exports\.widgetRun = widgetRun/)
  assert.match(src, /require\('@electerm\/widget-api'\)/)
  assert.doesNotMatch(src, /require\('electron'\)/)
})

test('the version in the manifest is the package version', () => {
  assert.strictEqual(conf.version, pkg.version)
})
