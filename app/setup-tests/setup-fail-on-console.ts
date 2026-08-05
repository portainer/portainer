import failOnConsole from 'vitest-fail-on-console';

failOnConsole({
  shouldFailOnWarn: true,
  shouldFailOnError: true,
  shouldFailOnLog: true,
  shouldFailOnInfo: true,
  allowMessage: (message) =>
    /Can't perform a React state update on an unmounted component/.test(
      message
    ),
});
