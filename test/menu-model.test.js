const test = require('node:test')
const assert = require('node:assert/strict')
const menu = require('../MenuModel.js')

test('a partial Apps override keeps its provider and remains visible', () => {
  const defaults = menu.parseMenuJsonc(`{
    // The real default menu declares Apps as a provider.
    "apps": {"label":"Apps","icon":"A","provider":"apps"},
    "about": {"label":"About","action":"show-about"},
  }`)
  const user = menu.parseMenuJsonc(`{
    "apps": {"label":"Applications"},
    "about": {"icon":"?"},
    "personal": {"label":"Personal"},
    "personal.notes": {"label":"Notes","action":"open-notes"}
  }`)
  const merged = menu.mergeMenuSources(defaults, user)

  assert.equal(merged.items.apps.label, 'Applications')
  assert.equal(merged.items.apps.icon, 'A')
  assert.equal(merged.items.apps.provider, 'apps')
  assert.equal(menu.isVisible(merged.items, merged.itemOrder, {}, merged.items.apps), true)
  assert.equal(merged.items.about.action, 'show-about')
  assert.equal(merged.items.personal.parent, 'root')
  assert.equal(merged.items['personal.notes'].parent, 'personal')
  assert.equal(merged.items['personal.notes'].kind, 'action')
})

test('an explicit override can replace or clear an inherited action', () => {
  const defaults = menu.parseMenuJsonc('{"entry":{"label":"Entry","action":"old"}}')
  const changed = menu.mergeMenuSources(defaults, menu.parseMenuJsonc('{"entry":{"action":"new"}}'))
  assert.equal(changed.items.entry.action, 'new')
  assert.equal(changed.items.entry.kind, 'action')

  const cleared = menu.mergeMenuSources(defaults, menu.parseMenuJsonc('{"entry":{"action":""}}'))
  assert.equal(cleared.items.entry.action, '')
  assert.equal(cleared.items.entry.kind, 'menu')
})

test('app rows appear under Apps, survive refreshes, and disappear when removed', () => {
  const base = menu.mergeMenuSources(menu.parseMenuJsonc('{"apps":{"label":"Apps","provider":"apps"}}'), [])
  const first = menu.mergeAppRows(base.items, base.itemOrder, [
    { id: 'apps.org.example.Editor', parent: 'apps', kind: 'app', label: 'Editor', appId: 'org.example.Editor', aliases: [], order: 0 },
    { id: 'apps.org.example.Editor', parent: 'apps', kind: 'app', label: 'Editor', appId: 'org.example.Editor', aliases: [], order: 0 },
    { id: 'apps.org.example.Terminal', parent: 'apps', kind: 'app', label: 'Terminal', appId: 'org.example.Terminal', aliases: [], order: 0 }
  ])

  assert.equal(menu.childCount(first.items, first.itemOrder, 'apps'), 2)
  assert.equal(first.itemOrder.filter(id => id === 'apps.org.example.Editor').length, 1)
  assert.equal(menu.matchesQuery(first.items['apps.org.example.Editor'], 'editor', true), true)

  const second = menu.mergeAppRows(first.items, first.itemOrder, [
    { id: 'apps.org.example.Terminal', parent: 'apps', kind: 'app', label: 'Terminal', appId: 'org.example.Terminal', aliases: [], order: 0 }
  ])
  assert.equal(menu.childCount(second.items, second.itemOrder, 'apps'), 1)
  assert.equal(second.items['apps.org.example.Editor'], undefined)
  assert.deepEqual(first.itemOrder.filter(id => id.startsWith('apps.')), [
    'apps.org.example.Editor', 'apps.org.example.Terminal'
  ])
})
