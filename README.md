# Hide UI Elements

English | [中文](README_CN.md)

Hide electerm's accessories — the buttons in the tab bar, the icons above the
terminal, the buttons in the footer — one switch each, so what is left is the
tab bar and the terminal.

| | |
| --- | --- |
| Shape | config-mode instance widget, 9 switches + "hide everything" |
| Needs | electerm **v5.11.8** or newer (the release that added `@electerm/widget-api`) |
| Applies | a stylesheet built from the switches, through the widget api |
| Unit tests | `npm test` — no dependencies, no install |

## Install

**Settings → Widgets → Import**, then paste:

```text
electerm/electerm-widget-hide-ui-elements
```

Or **Import folder** against a local clone.

## Use

**Settings → Widgets → Hide UI Elements**, tick what you do not want to see, and
press **Start widget**. The form remembers what you ticked, so the next visit
starts where this one ended; leave *Apply on launch* on and it is applied again
at every start.

**Stop** in the same panel (or in *Running instances*) shows everything again.
Changing the switches means **Stop** first: an instance widget runs one instance
at a time.

## What each switch hides

| Switch | Hides |
| --- | --- |
| **Hide everything below** | all of the switches below, in one press |
| Layout menu | the dropdown at the right end of the tab row (split layouts, tab list, window options) |
| Terminal / File manager switch | the two tabs above the terminal |
| Session icons | split view, sftp path follows ssh, keepalive, broadcast input, word wrap, exit |
| Search and fullscreen icons | the right end of the session toolbar, plus the font-size icons on touch screens |
| AI button | the footer's left end |
| History, quick command, triggers | the three buttons next to it, and the arrow that reopens a collapsed sidebar |
| Batch input | the footer's middle: one command, several tabs |
| Encoding and info | the footer's right end: encoding dropdown and session-info icon |

## How it works

The manifest's `electerm.configs` is the form electerm draws; on submit it calls
`widgetRun(config)` in the main process. The switches become one stylesheet:

```css
/* electerm widget: hide-ui-elements */
.tabs-extra { display: none !important; }
.term-sftp-tabs { display: none !important; }
...
```

that goes to the host through `require('@electerm/widget-api').css.apply()`.
The host keeps it on the running instance, applies it as one
`<style data-electerm-widget="hide-ui-elements">` tag rewritten in place, and
removes it when the widget stops. There is no `main.js` doing Electron work and
no `styles` entry in the manifest: the css depends on the switches, so it is
built at run time. `options.js` holds the switch → selector table, and
`test/options.test.js` keeps it and the manifest in step.

`require('electron')` is refused by the host, so nothing here can end up
desktop-only: the same widget works in [electerm-web](https://github.com/electerm/electerm-web).

## Notes

- **These switches hide, they do not reflow.** electerm computes the terminal's
  size in JS from the window height, not from its container, so a hidden row
  cannot hand its pixels to the terminal. The session toolbar therefore keeps
  its 32px height instead of collapsing: hiding every icon leaves an empty
  strip above the terminal (same background, nothing to click) rather than a
  gap at the bottom and a terminal that moves every time you toggle a switch.
  Hiding the footer's contents leaves the 36px footer band for the same reason.
- **The new tab button stays.** The `+` at the end of the tab row is the only
  way into new tabs, bookmarks and quick connect, so it is not a switch and
  *Hide everything below* does not reach it either: a stylesheet that hides it
  leaves the app with no way to open another session. `KEEP` in `options.js`
  names it, and `test/options.test.js` fails if any switch ever does.
- **The left dock is not here.** The icon bar on the far left has its own
  collapse button (the last icon, and the arrow in the footer to bring it back)
  and electerm remembers the choice, so the widget does not duplicate it.
- **Some switches are desktop-only by nature**: the tab-bar and session-toolbar
  ones name elements that the mobile layout puts elsewhere, where hiding them
  would take the only way in.
- **Standalone, not the built-in setting.** electerm also has **Settings →
  Common → Custom CSS**, applied by the app into `<style id="custom-css">` and
  synced across devices. This widget does not read or write it. Both can be
  active; the setting's sheet is last in the document, so a rule in both places
  is won by the setting. Keep a rule in one place.
- No rule here touches the settings panel, so the way back is always there:
  **Settings → Widgets → Running instances** → **Stop**.

## License

MIT
