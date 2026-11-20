/**
 * What each switch hides, and the stylesheet they add up to.
 *
 * The switches are the manifest's `electerm.configs` (package.json); this file
 * only knows their names and the elements each one hides, so a test can hold the
 * two in step. Every rule is `display: none !important`: electerm's own
 * stylesheets are specific (`.is-mobile .main-footer`, `.type-tab.ssh`, ...) and
 * a widget stylesheet is appended to <head> after them, which is not the same
 * as out-ranking them.
 *
 * Selectors only ever name single buttons and single footer cells — inline or
 * flex children, where the neighbours simply close the gap. Nothing here hides a
 * row whose height the layout measures in JS (the session toolbar, the footer
 * itself, the tab bar): a css rule there would leave an empty strip behind
 * instead of giving the terminal the space back.
 */

// Turn every switch on without finding them all: "the tab bar and the terminal"
// in one press.
const ALL = 'hideAll'

const DECLARATION = 'display: none !important;'

// Never hidden, not even by `hideAll`: the + at the end of the tab row is the
// way into new tabs, bookmarks and quick connect. Without it there is no way
// to open another session from the keyboard-free UI, so it is not a switch.
const KEEP = ['.tabs-add-btn']

const OPTIONS = [
  {
    name: 'hideTabBarMenu',
    // the layout menu at the right end of the tab row
    selectors: ['.tabs-extra']
  },
  {
    name: 'hidePaneSwitch',
    // the "Terminal / File manager" tabs above the terminal
    selectors: ['.term-sftp-tabs']
  },
  {
    name: 'hideSessionIcons',
    // split view, sftp path follows ssh, keepalive, broadcast, wrap, exit
    selectors: ['.sess-icon']
  },
  {
    name: 'hideSearchFullscreen',
    // the right end of the session toolbar, and the touch font-size icons
    selectors: ['.term-controls']
  },
  {
    name: 'hideFooterAi',
    selectors: ['.terminal-footer-ai']
  },
  {
    name: 'hideFooterButtons',
    // command history, quick commands, triggers, and the arrow that reopens a
    // collapsed sidebar (it only exists while the sidebar is hidden)
    selectors: [
      '.terminal-footer-history',
      '.terminal-footer-qm',
      '.terminal-footer-triggers',
      '.terminal-footer-show-sidebar'
    ]
  },
  {
    name: 'hideFooterBatchInput',
    // one command, several tabs
    selectors: ['.terminal-footer-center']
  },
  {
    name: 'hideFooterEncoding',
    // the encoding dropdown and the session-info icon: both footer cells share
    // this class, and both are "about the session", not "about the input"
    selectors: ['.terminal-footer-info']
  }
]

const HEADER = '/* electerm widget: hide-ui-elements */'

// The three switches that empty the session toolbar. Electerm sizes the
// terminal in JS from the window height, not from its container, so a toolbar
// that collapses to 0px does not hand the 32px to the terminal: it only moves
// the terminal up and leaves the strip at the bottom. Keeping the row's height
// instead means hiding these buttons never shifts the terminal, and nothing is
// lost that a css-only widget could have given back anyway.
const TOOLBAR = ['hidePaneSwitch', 'hideSessionIcons', 'hideSearchFullscreen']
const TOOLBAR_GUARD = '.terminal-control { min-height: 32px; }'

function rowGuards (names) {
  return TOOLBAR.every(name => names.includes(name)) ? [TOOLBAR_GUARD] : []
}

function ruleOf (option) {
  return `${option.selectors.join(',\n')} { ${DECLARATION} }`
}

function isOn (config, name) {
  return !!config && config[name] === true
}

// Which switches are in effect: `hideAll` wins, so ticking it hides everything
// and the individual ones only matter while it is off. A switch that would hide
// a KEEP element is dropped even when `hideAll` asks for it.
function selected (config) {
  const all = isOn(config, ALL)
  return OPTIONS.filter(option =>
    (all || isOn(config, option.name)) &&
    !option.selectors.some(sel => KEEP.includes(sel))
  )
}

// The stylesheet for one run of the widget. '' when nothing is switched on,
// which is also how electerm is told to drop the stylesheet it applied.
function buildCss (config) {
  const on = selected(config)
  if (!on.length) {
    return ''
  }
  const names = on.map(option => option.name)
  return [
    HEADER,
    ...on.map(ruleOf),
    ...rowGuards(names)
  ].join('\n')
}

module.exports = {
  ALL,
  DECLARATION,
  KEEP,
  OPTIONS,
  HEADER,
  TOOLBAR,
  TOOLBAR_GUARD,
  ruleOf,
  rowGuards,
  selected,
  buildCss
}
