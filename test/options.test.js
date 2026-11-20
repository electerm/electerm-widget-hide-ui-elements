/**
 * The stylesheet the switches add up to.
 *
 * Run: node --test test/*.test.js
 */

const test = require('node:test')
const assert = require('node:assert')
const {
  ALL,
  DECLARATION,
  OPTIONS,
  HEADER,
  TOOLBAR_GUARD,
  ruleOf,
  rowGuards,
  selected,
  buildCss
} = require('../options')

const everyOn = () => {
  const conf = { [ALL]: true }
  for (const option of OPTIONS) {
    conf[option.name] = false
  }
  return conf
}

test('nothing switched on: no stylesheet at all', () => {
  assert.strictEqual(buildCss({}), '')
  assert.strictEqual(buildCss(undefined), '')
  assert.strictEqual(buildCss(null), '')
  // the host reads '' as "remove what this widget applied"
  assert.strictEqual(buildCss({ autoRun: true }), '')
})

test('one switch, one rule, and only that rule', () => {
  const css = buildCss({ hidePaneSwitch: true })
  assert.strictEqual(css, [
    HEADER,
    '.term-sftp-tabs { display: none !important; }'
  ].join('\n'))
  assert.strictEqual(selected({ hidePaneSwitch: true }).length, 1)
})

test('switches add up in declaration order, each once', () => {
  const css = buildCss({ hideAddTabButton: true, hideFooterAi: true })
  assert.strictEqual(css.split('\n').length, 3)
  assert.ok(css.includes(ruleOf(OPTIONS[0])))
  assert.ok(css.indexOf('.tabs-add-btn') < css.indexOf('.terminal-footer-ai'))
})

test('one switch can hide several cells, as one rule', () => {
  const css = buildCss({ hideFooterButtons: true })
  assert.strictEqual(css, [
    HEADER,
    '.terminal-footer-history,\n' +
      '.terminal-footer-qm,\n' +
      '.terminal-footer-triggers,\n' +
      '.terminal-footer-show-sidebar { display: none !important; }'
  ].join('\n'))
})

test('hideAll wins over the individual switches', () => {
  const all = buildCss(everyOn())
  for (const option of OPTIONS) {
    assert.ok(all.includes(ruleOf(option)), `hideAll is missing ${option.name}`)
  }
  // it does not care whether the individual ones were ticked
  assert.strictEqual(buildCss(everyOn()), all)
  assert.strictEqual(selected(everyOn()).length, OPTIONS.length)
})

test('only true is on: a string or a 1 is not a ticked switch', () => {
  assert.strictEqual(buildCss({ hideFooterAi: 'true' }), '')
  assert.strictEqual(buildCss({ hideFooterAi: 1 }), '')
  assert.strictEqual(buildCss({ hideFooterAi: false }), '')
})

test('every selector is a plain class, and never a measured container', () => {
  // The rows whose height the app computes in JS: hiding one would leave an
  // empty strip instead of giving the space back (see options.js).
  const measured = [
    '.terminal-control',
    '.main-footer',
    '.tabs',
    '.sessions',
    '.session-wrap',
    '.layout-wrap',
    '.terms-box',
    '.term-wrap'
  ]
  for (const option of OPTIONS) {
    assert.ok(option.selectors.length, option.name)
    for (const sel of option.selectors) {
      assert.match(sel, /^\.[a-z][a-z0-9-]*$/, `${option.name}: odd selector ${sel}`)
      assert.ok(!measured.includes(sel), `${option.name}: ${sel} is a measured container`)
    }
  }
})

test('every rule hides, and hides nothing else', () => {
  for (const option of OPTIONS) {
    const rule = ruleOf(option)
    assert.ok(rule.endsWith(`{ ${DECLARATION} }`), option.name)
    // one declaration, no other property smuggled in
    assert.strictEqual(rule.match(/:/g).length, 1, option.name)
  }
})

test('an emptied session toolbar keeps its height, so the terminal does not jump', () => {
  const names = ['hidePaneSwitch', 'hideSessionIcons', 'hideSearchFullscreen']
  const conf = {}
  for (const name of names) {
    conf[name] = true
  }
  assert.ok(buildCss(conf).includes(TOOLBAR_GUARD))
  assert.deepStrictEqual(rowGuards(names), [TOOLBAR_GUARD])
  // one switch short of empty: the row still has a button in it, so no guard
  assert.ok(!buildCss({ hidePaneSwitch: true, hideSessionIcons: true }).includes('min-height'))
  assert.match(TOOLBAR_GUARD, /\.terminal-control \{ min-height: 32px; \}/)
})
