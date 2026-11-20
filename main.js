/**
 * The widget's server script.
 *
 * A config-mode instance widget: electerm draws the form from this folder's
 * package.json, and on submit calls this `widgetRun` in the main process with
 * the switches. The css they add up to is handed to the host (`api.css.apply`),
 * which keeps it on the running instance and applies it in every window — the
 * same tag is rewritten in place, and stopping the widget removes it.
 *
 * The work happens in `start()`, not when widgetRun is called: the host
 * registers the instance (which is what a stylesheet hangs off) only after this
 * function has returned it.
 *
 * Nothing here touches a DOM or a window: `@electerm/widget-api` is the only
 * door out, so the widget also works in electerm-web, where the css is applied
 * in the browser tab that runs the app.
 */

const api = require('@electerm/widget-api')
const { buildCss, selected } = require('./options')

function describe (on) {
  return on.length === 1
    ? '1 element group hidden'
    : `${on.length} element groups hidden`
}

// The host keeps each instance in a map keyed by its id and hands the id back
// to the panel, which is what Stop is called with: a script widget owns its id.
// The counter keeps two runs in the same millisecond apart.
let seq = 0
function nextInstanceId () {
  seq += 1
  return `${api.id}-${Date.now()}-${seq}`
}

function widgetRun (config) {
  const conf = { ...(config || {}) }
  return {
    instanceId: nextInstanceId(),
    async start () {
      const css = buildCss(conf)
      if (!css) {
        // An empty stylesheet is a no-op: clear whatever an earlier run applied,
        // so unticking everything stops hiding anything.
        api.css.apply('')
        return {
          success: true,
          msg: 'Nothing selected, so nothing is hidden'
        }
      }
      api.css.apply(css)
      const on = selected(conf)
      api.log('info', `${describe(on)}: ${on.map(option => option.name).join(', ')}`)
      return {
        success: true,
        msg: `${describe(on)}; applied until the widget is stopped`
      }
    },
    async stop () {
      api.css.remove()
      return { success: true, msg: 'Hidden elements shown again' }
    }
  }
}

exports.widgetRun = widgetRun
