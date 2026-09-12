const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
const { NextResponse } = require('next/server')

// Exercise the real route and redirect response; only the remote auth exchange
// is stubbed so these checks need no account, email, or running Supabase project.
const source = ts.transpileModule(
  readFileSync(path.join(__dirname, '../app/auth/callback/route.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText

async function callback(next, { code = 'test-code', error = null, origin = 'https://app.example' } = {}) {
  const exchanges = []
  const exported = {}
  vm.runInNewContext(source, {
    exports: exported,
    URL,
    require(name) {
      if (name === 'next/server') return { NextResponse }
      if (name === '@/lib/supabase-server') return {
        createServerSupabaseClient: async () => ({
          auth: {
            exchangeCodeForSession: async value => {
              exchanges.push(value)
              return { error }
            },
          },
        }),
      }
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  const url = new URL('/auth/callback', origin)
  if (next !== undefined) url.searchParams.set('next', next)
  if (code !== null) url.searchParams.set('code', code)
  const response = await exported.GET(new Request(url))
  assert.equal(response.status, 307)
  assert.deepEqual(exchanges, code ? [code] : [])
  return response.headers.get('location')
}

for (const next of [
  'https://example.org', '//example.org', '/\\example.org',
  '/\t/example.org', '/\n/example.org', '/\r/example.org',
  '/\\user:pass@example.org', '/\\app.example:444', '/\\[invalid',
  'javascript:alert(1)', 'https://app.example/insights', 'insights',
]) {
  test(`unsafe or non-path destination falls back home: ${JSON.stringify(next)}`, async () => {
    assert.equal(await callback(next), 'https://app.example/')
  })
}

for (const next of ['/', '/reset-password', '/insights?year=2026#monthly-report', '/day-view?note=a%20b']) {
  test(`preserves local destination: ${next}`, async () => {
    assert.equal(await callback(next), `https://app.example${next}`)
  })
}

test('missing and empty destinations go home', async () => {
  assert.equal(await callback(undefined), 'https://app.example/')
  assert.equal(await callback(''), 'https://app.example/')
})

test('does not decode percent-encoded path content a second time', async () => {
  assert.equal(await callback('/%5Cexample.org'), 'https://app.example/%5Cexample.org')
  assert.equal(await callback('/%2F%2Fexample.org'), 'https://app.example/%2F%2Fexample.org')
})

test('preserves local development origin and port', async () => {
  assert.equal(await callback('/reset-password', { origin: 'http://localhost:3000' }),
    'http://localhost:3000/reset-password')
})

test('missing code and failed exchange retain the login error redirect', async () => {
  const expected = 'https://app.example/login?error=auth_callback_error'
  assert.equal(await callback('/reset-password', { code: null }), expected)
  assert.equal(await callback('/reset-password', { error: { message: 'Invalid code' } }), expected)
  assert.equal(await callback('/\\example.org', { error: { message: 'Invalid code' } }), expected)
})
