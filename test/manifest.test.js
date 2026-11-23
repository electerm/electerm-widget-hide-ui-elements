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
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8')

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
  assert.strictEqual(pkg.main, undefined)
  assert.deepStrictEqual(conf.assets.css, ['style.css'])
})

test('each visibility switch has a CSS rule and the new-tab button stays available', () => {
  const names = conf.configs.map(c => c.name).filter(name => name !== 'autoRun')
  assert.deepStrictEqual(conf.assets.settings, names)
  for (const name of names) {
    assert.ok(css.includes(`[data-widget-hide-ui-elements~="${name}"]`), name)
  }
  assert.doesNotMatch(css, /\.tabs-add-btn/)
  const targets = {
    hideTabBarMenu: ['tabs-extra'],
    hidePaneSwitch: ['term-sftp-tabs'],
    hideSessionIcons: ['sess-icon'],
    hideSearchFullscreen: ['term-controls'],
    hideFooterAi: ['terminal-footer-ai'],
    hideFooterButtons: ['terminal-footer-history', 'terminal-footer-qm', 'terminal-footer-triggers', 'terminal-footer-show-sidebar'],
    hideFooterBatchInput: ['terminal-footer-center'],
    hideFooterEncoding: ['terminal-footer-info']
  }
  for (const [name, selectors] of Object.entries(targets)) {
    const rule = css.split('}').find(rule => rule.includes(`~="${name}"`))
    assert.ok(rule.includes('~="hideAll"'))
    for (const selector of selectors) {
      assert.ok(rule.includes('.' + selector))
    }
    assert.ok(rule.includes('display: none !important'))
  }
  assert.match(css, /min-height: 32px/)
})

test('every switch is an off-by-default boolean that says what it hides', () => {
  for (const config of conf.configs) {
    assert.strictEqual(config.type, 'boolean', config.name)
    assert.ok(config.label && config.label.length, config.name)
    assert.ok(config.description && config.description.length, config.name)
    assert.strictEqual(config.default, config.name === 'autoRun')
  }
})

test('the version in the manifest is the package version', () => {
  assert.strictEqual(conf.version, pkg.version)
})
