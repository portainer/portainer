import {
  registryAuthenticationHeader,
  setRegistryAuthenticationHeader,
  portainerAgentTargetHeader,
  setPortainerAgentTargetHeader,
  setPortainerAgentManagerOperation,
  portainerAgentManagerOperation,
  resetAgentHeaders,
} from './http-request.helper';

afterEach(() => {
  resetAgentHeaders();
});

test('registryAuthenticationHeader', () => {
  const header = 'header';

  expect(registryAuthenticationHeader()).toBeUndefined();

  setRegistryAuthenticationHeader(header);

  expect(registryAuthenticationHeader()).toBe(header);

  resetAgentHeaders();

  expect(registryAuthenticationHeader()).toBeUndefined();
});

test('portainerAgentTargetHeader', () => {
  const header = 'header';

  expect(portainerAgentTargetHeader()).toBe('');

  setPortainerAgentTargetHeader(header);

  expect(portainerAgentTargetHeader()).toBe(header);

  resetAgentHeaders();

  expect(portainerAgentTargetHeader()).toBe('');
});

test('when setting portainerAgentTargetHeader more than once, should return headers in fifo, until the last one then it should be the last one', () => {
  const headers = Array.from({ length: 5 }).map((_, i) => `header${i}`);

  expect(portainerAgentTargetHeader()).toBe('');

  headers.forEach((header) => setPortainerAgentTargetHeader(header));

  headers.forEach((_, i) =>
    expect(portainerAgentTargetHeader()).toBe(`header${i}`)
  );

  expect(portainerAgentTargetHeader()).toBe('header4');
  expect(portainerAgentTargetHeader()).toBe('header4');
  expect(portainerAgentTargetHeader()).toBe('header4');
});

test('portainerAgentManagerOperation', () => {
  expect(portainerAgentManagerOperation()).toBe(false);

  setPortainerAgentManagerOperation(true);

  expect(portainerAgentManagerOperation()).toBe(true);

  resetAgentHeaders();

  expect(portainerAgentManagerOperation()).toBe(false);
});
