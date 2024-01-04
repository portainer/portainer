/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 * These HAVE to be require's and HAVE to be in this exact
 * order, since "undici" depends on the "TextEncoder" global API.
 *
 * Consider migrating to a more modern test runner if
 * you don't want to deal with this.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { TextDecoder, TextEncoder } = require('node:util');

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
});

const { ReadableStream } = require('node:stream/web');

Object.defineProperties(globalThis, {
  ReadableStream: { value: ReadableStream },
});

const { Blob, File } = require('node:buffer');

const { fetch, Headers, FormData, Request, Response } = require('undici');

Object.defineProperties(globalThis, {
  fetch: { value: fetch, writable: true },
  Blob: { value: Blob },
  File: { value: File },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response },
});

/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable import/order */
