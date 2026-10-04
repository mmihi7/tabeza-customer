/**
 * Jest setup for tabeza-customer.
 *
 * The suite runs under jsdom (see jest.config.js) because Supabase and several
 * shared services read browser globals at import time: `navigator`, `crypto`,
 * `window` and `document`. jsdom supplies the first three, but it does not
 * provide the Node/web primitives below, and those must exist *before* any
 * module is imported — hence setupFiles rather than setupFilesAfterEach.
 */
const { TextDecoder, TextEncoder } = require('node:util')
const {
  ReadableStream,
  TransformStream,
  TextDecoderStream,
  TextEncoderStream,
} = require('node:stream/web')
const { performance } = require('node:perf_hooks')
const { webcrypto } = require('node:crypto')
const v8 = require('node:v8')

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  TextDecoderStream,
  TextEncoderStream,
  ReadableStream,
  TransformStream,
  performance,
  // jsdom exposes crypto.getRandomValues but not subtle; Supabase's auth client
  // reaches for webcrypto, so wire the Node implementation in.
  crypto: globalThis.crypto ?? webcrypto,
  // structuredClone is absent from the jsdom realm entirely, so fall back to
  // v8's serialize round-trip for the plain data these suites pass around.
  structuredClone:
    globalThis.structuredClone ?? (value => v8.deserialize(v8.serialize(value))),
})

// Route handlers and Supabase reach for the Fetch API globals. jsdom ships none
// of them, and they have to exist before any module is imported, so borrow the
// implementations Next already bundles for its edge runtime.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const edgePrimitives = require('next/dist/compiled/@edge-runtime/primitives')
  Object.assign(globalThis, {
    Request: globalThis.Request ?? edgePrimitives.Request,
    Response: globalThis.Response ?? edgePrimitives.Response,
    Headers: globalThis.Headers ?? edgePrimitives.Headers,
    fetch: globalThis.fetch ?? edgePrimitives.fetch,
  })
} catch {
  // Older/alternate Next layout: the suites that need these already fail loudly
  // on the missing global, so there is nothing useful to do here.
}