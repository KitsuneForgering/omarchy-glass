const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('plugin manifest points to shipped entry points', () => {
  const root = path.join(__dirname, '..')
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))

  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.id, 'kitsuneforgering.glass')
  for (const kind of manifest.kinds) {
    const field = { bar: 'bar', menu: 'menu', 'bar-widget': 'barWidget' }[kind]
    assert.ok(field, `unsupported kind: ${kind}`)
    const entryPoint = manifest.entryPoints[field]
    assert.ok(entryPoint, `missing ${field} entry point`)
    assert.ok(fs.statSync(path.join(root, entryPoint)).isFile(), `missing ${entryPoint}`)
  }
})
