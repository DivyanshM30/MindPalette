const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { execFileSync } = require('node:child_process')
const React = require('react')
const { create, act } = require('react-test-renderer')
global.IS_REACT_ACT_ENVIRONMENT = true
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
// Actual React provider, editor and hooks; only external I/O and decoration
// are stubbed. These tests do not authenticate or write to a live database.
function harness(options = {}) {
  let user = { id: 'A' }, tree
  const listeners = new Set(), keys = new Set(), writes = [], queries = [], messages = [], routes = [], downloads = []
  const window = {
    location: { search: options.search || '' },
    addEventListener: (name, fn) => { if (name === 'keydown') keys.add(fn) },
    removeEventListener: (name, fn) => keys.delete(fn),
  }
  const client = {
    auth: {
      signOut: () => options.signOut?.() ?? { error: null },
      getUser: () => options.getUser?.(user) ?? Promise.resolve({ data: { user }, error: null }),
      onAuthStateChange(fn) { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } } },
    },
    from(table) {
      const filters = { table }
      const query = {
        select() { return query },
        eq(k, v) { filters[k] = v; return query },
        gte(k, v) { filters.from = v; return query },
        lte(k, v) { filters.to = v; return query },
        order() { return query },
        maybeSingle() { filters.single = true; return query },
        single() { filters.single = true; return query },
        then(resolve, reject) {
          queries.push({ ...filters })
          return Promise.resolve(options.read?.(filters) ?? { data: filters.single ? null : [], error: null }).then(resolve, reject)
        },
        upsert(entry) {
          writes.push({ ...entry })
          return options.write?.(entry) ?? Promise.resolve({ error: null })
        },
      }
      return query
    },
  }
  const cache = new Map(), showToast = (...args) => messages.push(args)
  function load(relative) {
    const filename = path.resolve(__dirname, '..', relative)
    if (cache.has(filename)) return cache.get(filename)
    const exported = {}
    cache.set(filename, exported)
    let input = fs.readFileSync(filename, 'utf8')
    if (process.env.MINDPALETTE_TEST_BASELINE && !relative.includes('useActiveView') && !relative.includes('mood-persistence')) {
      input = execFileSync('git', ['-c', 'safe.directory=D:/Coding/projects/moodtracker', 'show', `${process.env.MINDPALETTE_TEST_BASELINE}:${relative.replaceAll('\\', '/')}`], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' })
    }
    const source = ts.transpileModule(input, {
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText
    vm.runInNewContext(source, {
      exports: exported, console: { ...console, error() {} }, window,
      document: { body: {}, addEventListener() {}, removeEventListener() {} },
      URLSearchParams, setTimeout, clearTimeout,
      require(name) {
        if (name === '@/lib/supabase') return { supabase: client }
        if (name === 'next/navigation') return { useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: value => routes.push(value), refresh() {} }) }
        if (name === 'react-dom') return { createPortal: child => child }
        if (name === 'next/link') return { default: 'a', __esModule: true }
        if (name === '@/lib/export') return { moodsToJson: JSON.stringify, moodsToCsv: JSON.stringify, downloadFile: (...args) => downloads.push(args) }
        if (name === 'framer-motion') return { motion: new Proxy({}, { get: (_, key) => key }), AnimatePresence: React.Fragment }
        if (name === 'lucide-react') return new Proxy({}, { get: () => () => null })
        if (name.endsWith('/Toast')) return { useToast: () => ({ showToast }) }
        if (name.endsWith('/CalendarPopup') || name.endsWith('/MoodIcon')) return { default: () => null, __esModule: true }
        if (name.startsWith('@/') || name.startsWith('.')) {
          const base = name.startsWith('@/') ? path.resolve(__dirname, '..', name.slice(2)) : path.resolve(path.dirname(filename), name)
          const file = ['.ts', '.tsx'].map(ext => base + ext).find(p => fs.existsSync(p))
          if (file) return load(path.relative(path.resolve(__dirname, '..'), file))
        }
        return require(name)
      },
    }, { filename })
    return exported
  }
  const context = load('contexts/UserContext.tsx')
  const Day = load('components/DayView.tsx').default
  const persistence = load('lib/mood-persistence.ts')
  return {
    load, writes, queries, messages, routes, downloads, context, persistence,
    get tree() { return tree },
    async render(component = React.createElement(Day)) {
      await act(async () => { tree = create(React.createElement(context.UserProvider, null, component)) })
    },
    async update(component) { await act(async () => tree.update(React.createElement(context.UserProvider, null, component))) },
    async close() { if (tree) await act(async () => tree.unmount()) },
    async emit(id, event = 'SIGNED_IN') {
      await act(async () => {
        user = id ? { id } : null
        listeners.forEach(fn => fn(event, user ? { user } : null))
      })
    },
    async key(key) { await act(async () => keys.forEach(fn => fn({ key, target: { tagName: 'DIV' }, preventDefault() {} }))) },
    fields() { return tree.root.findAllByType('textarea') },
    async type(index, value) { await act(async () => this.fields()[index].props.onChange({ target: { value } })) },
    async blur(index) { await act(async () => { void this.fields()[index].props.onBlur() }) },
  }
}
test('account replacement clears both drafts; same-owner auth refresh preserves them', async () => {
  const h = harness()
  await h.render()
  await h.type(0, 'A private journal')
  await h.type(1, 'A private positive note')
  await h.emit('A', 'TOKEN_REFRESHED')
  await h.emit('A', 'USER_UPDATED')
  assert.equal(h.fields()[0].props.value, 'A private journal')
  await h.emit('B')
  assert.deepEqual(h.fields().map(f => f.props.value), ['', ''])
  await h.key('1')
  assert.equal(h.writes.length, 1)
  assert.equal(h.writes[0].user_id, 'B')
  assert.equal(h.writes[0].note, null)
  assert.equal(h.writes[0].positive_note, null)
  await h.emit(null, 'SIGNED_OUT')
  await h.emit('A')
  assert.deepEqual(h.fields().map(f => f.props.value), ['', ''])
  await h.close()
})
test('late initial getUser cannot overwrite a newer sign-in', async () => {
  const initial = deferred(), h = harness({ getUser: () => initial.promise })
  let identity
  function Probe() { identity = h.context.useUser().user?.id; return null }
  await h.render(React.createElement(Probe))
  await h.emit('B')
  await act(async () => initial.resolve({ data: { user: { id: 'A' } } }))
  assert.equal(identity, 'B')
  await h.close()
})
test('draft navigation remains intact within one account', async () => {
  const h = harness()
  await h.render()
  await h.type(0, 'unsaved note')
  await h.key('ArrowLeft')
  assert.equal(h.fields()[0].props.value, '')
  await h.key('ArrowRight')
  assert.equal(h.fields()[0].props.value, 'unsaved note')
  await h.close()
})
test('overlapping saves are ordered and an acknowledgement retains newer edits', async () => {
  const first = deferred(), second = deferred()
  let count = 0
  const h = harness({ write: () => (++count === 1 ? first : second).promise })
  await h.render()
  await h.key('1')
  await h.type(0, 'second save')
  await h.blur(0)
  assert.equal(h.writes.length, 1)
  await act(async () => first.resolve({ error: null }))
  assert.equal(h.writes.length, 2)
  assert.equal(h.writes[1].note, 'second save')
  await h.type(0, 'typed after save started')
  await act(async () => second.resolve({ error: null }))
  await h.key('ArrowLeft')
  await h.key('ArrowRight')
  assert.equal(h.fields()[0].props.value, 'typed after save started')
  await h.close()
})
test('failed save survives navigation and can be retried', async () => {
  let fail = true
  const h = harness({ write: () => ({ error: fail ? { message: 'offline' } : null }) })
  await h.render()
  await h.type(0, 'recover me')
  await h.key('1')
  assert.ok(h.messages.some(([message]) => message.includes('Failed to save')))
  await h.key('ArrowLeft')
  await h.key('ArrowRight')
  assert.equal(h.fields()[0].props.value, 'recover me')
  fail = false
  await h.blur(0)
  assert.equal(h.writes.at(-1).note, 'recover me')
  assert.ok(h.messages.some(([message]) => message === 'Mood saved successfully.'))
  await h.close()
})
test('latest day wins when reads resolve backwards; failed read cannot save stale data', async () => {
  const slow = deferred()
  let dayReads = 0
  const h = harness({ read: q => q.single ? (++dayReads === 1 ? slow.promise : { data: { mood: 'B', note: 'latest day' }, error: null }) : undefined })
  await h.render()
  await h.key('ArrowLeft')
  assert.equal(h.fields()[0].props.value, 'latest day')
  await act(async () => slow.resolve({ data: { mood: 'A', note: 'stale day' }, error: null }))
  assert.equal(h.fields()[0].props.value, 'latest day')
  await h.close()
  const failed = harness({ read: () => ({ data: null, error: { message: 'offline' } }) })
  await failed.render()
  assert.equal(failed.fields().length, 0)
  await failed.key('1')
  assert.equal(failed.writes.length, 0)
  assert.equal(failed.tree.root.findAllByProps({ role: 'alert' }).length, 1)
  await failed.close()
})
test('latest year wins and previous data is hidden while a new year loads', async () => {
  const oldYear = deferred(), newYear = deferred()
  const h = harness({ read: q => q.from === '2025-01-01' ? oldYear.promise : newYear.promise })
  const { useMoods } = h.load('lib/hooks/useMoods.ts')
  let result
  function Probe({ year }) { result = useMoods(year); return null }
  await h.render(React.createElement(Probe, { year: 2025 }))
  await h.update(React.createElement(Probe, { year: 2026 }))
  assert.equal(result.loading, true)
  assert.equal(result.moods.length, 0)
  await act(async () => newYear.resolve({ data: [{ date: '2026-01-01', mood: 'A', note: 'new' }], error: null }))
  await act(async () => oldYear.resolve({ data: [{ date: '2025-01-01', mood: 'B', note: 'old' }], error: null }))
  assert.equal(result.moods[0].note, 'new')
  await h.close()
})
test('queued writes from a replaced account are rejected, including A to B to A', async () => {
  const first = deferred(), h = harness({ write: () => first.promise })
  let active
  function Probe() { active = h.context.useUser().isCurrentUser; return null }
  await h.render(React.createElement(Probe))
  const oldActive = active
  const entry = { user_id: 'A', date: '2026-01-01', mood: 'A', note: 'private' }
  const write1 = h.persistence.saveMood(entry, oldActive)
  const write2 = h.persistence.saveMood(entry, oldActive)
  const rejected = assert.rejects(write2, /no longer active|session changed/)
  await act(async () => {})
  await h.emit('B')
  await h.emit('A')
  assert.equal(oldActive(), false)
  first.resolve({ error: null })
  await write1
  await rejected
  assert.equal(h.writes.length, 1)
  await h.close()
})


test('a queued save still finishes after same-account navigation unmounts the editor', async () => {
  const first = deferred()
  let count = 0
  const h = harness({ write: () => ++count === 1 ? first.promise : { error: null } })
  await h.render()
  await h.key('1')
  await h.type(0, 'save before navigation')
  await h.blur(0)
  await h.update(React.createElement('p', null, 'another route'))
  await act(async () => first.resolve({ error: null }))
  assert.equal(h.writes.length, 2)
  assert.equal(h.writes[1].note, 'save before navigation')
  await h.close()
})
test('callback failures are explained and failed sign-out does not navigate away', async () => {
  const h = harness({ search: '?error=auth_callback_error', signOut: () => ({ error: { message: 'offline' } }) })
  const Login = h.load('app/login/page.tsx').default
  await h.render(React.createElement(Login))
  assert.match(JSON.stringify(h.tree.toJSON()), /invalid, expired, or was opened in a different browser/)
  const AuthButton = h.load('components/AuthButton.tsx').default
  await h.update(React.createElement(AuthButton))
  await act(async () => h.tree.root.findByProps({ 'aria-label': 'Log out' }).props.onClick())
  assert.equal(h.routes.length, 0)
  assert.ok(h.messages.some(([text]) => text.includes('Could not sign out')))
  await h.close()
})
test('an old-account export cannot download after identity replacement', async () => {
  const result = deferred()
  const h = harness({ read: () => result.promise })
  const Profile = h.load('components/ProfileDialog.tsx').default
  await h.render(React.createElement(Profile, { isOpen: true, initialName: 'A name', onClose() {} }))
  const textOf = node => typeof node === 'string' ? node : node.children.map(textOf).join('')
  const findButton = text => h.tree.root.findAllByType('button').find(button => textOf(button).includes(text))
  await act(async () => findButton('Your Data').props.onClick())
  await act(async () => { void findButton('JSON').props.onClick() })
  await h.emit('B')
  await act(async () => result.resolve({ data: [{ date: '2026-01-01', mood: 'A', note: 'A private note' }], error: null }))
  assert.equal(h.downloads.length, 0)
  await h.close()
})


test('year navigation waits for journal writes before reading the saved entry', async () => {
  const saved = deferred()
  let stored = []
  const h = harness({ write: entry => saved.promise.then(() => { stored = [entry]; return { error: null } }), read: q => q.single ? undefined : { data: stored, error: null } })
  await h.render()
  await h.type(0, 'survives navigation')
  await h.key('1')
  const { useMoods } = h.load('lib/hooks/useMoods.ts')
  let result
  function Year() { result = useMoods(new Date().getFullYear()); return null }
  await h.update(React.createElement(Year))
  assert.equal(result.loading, true)
  await act(async () => saved.resolve())
  assert.equal(result.loading, false)
  assert.equal(result.moods[0].note, 'survives navigation')
  await h.close()
})
test('read barrier also waits for writes added while earlier writes are pending', async () => {
  const first = deferred(), second = deferred()
  let count = 0, finished = false
  const h = harness({ write: () => (++count === 1 ? first : second).promise })
  const entry = { user_id: 'A', date: '2026-01-01', mood: 'A', note: '' }
  const write1 = h.persistence.saveMood(entry, () => true)
  const barrier = h.persistence.waitForMoodWrites('A', '2026').then(() => { finished = true })
  const write2 = h.persistence.saveMood({ ...entry, note: 'latest' }, () => true)
  first.resolve({ error: null })
  await write1
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(finished, false)
  second.resolve({ error: null })
  await Promise.all([write2, barrier])
  assert.equal(finished, true)
})


