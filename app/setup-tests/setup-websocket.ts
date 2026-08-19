// MSW 2.x requires WebSocket to be writable in the global scope
// In JSDOM, WebSocket is read-only by default, so we need to make it configurable
if (typeof global.WebSocket !== 'undefined') {
  Object.defineProperty(global, 'WebSocket', {
    writable: true,
    configurable: true,
    value: global.WebSocket,
  });
}
