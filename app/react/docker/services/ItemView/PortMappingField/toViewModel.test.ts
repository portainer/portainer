import { toViewModel } from './toViewModel';

test('basic', () => {
  expect(
    toViewModel([
      {
        Protocol: 'tcp',
        TargetPort: 22,
        PublishedPort: 222,
        PublishMode: 'ingress',
      },
      {
        Protocol: 'tcp',
        TargetPort: 3000,
        PublishedPort: 3000,
        PublishMode: 'ingress',
      },
    ])
  ).toStrictEqual([
    {
      hostPort: 222,
      containerPort: 22,
      protocol: 'tcp',
      publishMode: 'ingress',
    },
    {
      hostPort: 3000,
      containerPort: 3000,
      protocol: 'tcp',
      publishMode: 'ingress',
    },
  ]);
});

test('already combined', () => {
  expect(
    toViewModel([
      {
        Protocol: 'tcp',
        TargetPort: 80,
        PublishedPort: 7000,
        PublishMode: 'ingress',
      },
      {
        Protocol: 'tcp',
        TargetPort: 80,
        PublishedPort: 7001,
        PublishMode: 'ingress',
      },
      {
        Protocol: 'tcp',
        TargetPort: 80,
        PublishedPort: 7002,
        PublishMode: 'ingress',
      },
      {
        Protocol: 'tcp',
        TargetPort: 80,
        PublishedPort: 7003,
        PublishMode: 'ingress',
      },
      {
        Protocol: 'tcp',
        TargetPort: 80,
        PublishedPort: 7004,
        PublishMode: 'ingress',
      },
      {
        Protocol: 'tcp',
        TargetPort: 80,
        PublishedPort: 7005,
        PublishMode: 'ingress',
      },
    ])
  ).toStrictEqual([
    {
      hostPort: {
        start: 7000,
        end: 7005,
      },
      containerPort: 80,
      protocol: 'tcp',
      publishMode: 'ingress',
    },
  ]);
});

test('simple combine ports', () => {
  expect(
    toViewModel([
      {
        Protocol: 'tcp',
        TargetPort: 74,
        PublishedPort: 81,
      },
      {
        Protocol: 'tcp',
        TargetPort: 75,
        PublishedPort: 82,
      },
    ])
  ).toStrictEqual([
    {
      hostPort: {
        start: 81,
        end: 82,
      },
      containerPort: {
        start: 74,
        end: 75,
      },
      protocol: 'tcp',
      publishMode: 'ingress',
    },
  ]);
});

test('combine and sort', () => {
  expect(
    toViewModel([
      { Protocol: 'tcp', TargetPort: 3244, PublishedPort: 105 },
      { Protocol: 'tcp', TargetPort: 3245, PublishedPort: 106 },
      { Protocol: 'tcp', TargetPort: 81, PublishedPort: 81 },
      { Protocol: 'tcp', TargetPort: 82, PublishedPort: 82 },
      { Protocol: 'tcp', TargetPort: 83 },
      { Protocol: 'tcp', TargetPort: 84 },
    ])
  ).toStrictEqual([
    {
      hostPort: { start: 81, end: 82 },
      containerPort: { start: 81, end: 82 },
      protocol: 'tcp',
      publishMode: 'ingress',
    },
    {
      hostPort: undefined,
      containerPort: {
        start: 83,
        end: 84,
      },
      protocol: 'tcp',
      publishMode: 'ingress',
    },
    {
      hostPort: { start: 105, end: 106 },
      containerPort: { start: 3244, end: 3245 },
      protocol: 'tcp',
      publishMode: 'ingress',
    },
  ]);
});

test('empty input', () => {
  expect(toViewModel([])).toStrictEqual([]);
});

test('invalid input', () => {
  expect(() =>
    toViewModel(
      // @ts-expect-error testing invalid input
      { Name: 'invalid', Protocol: 'tcp', TargetPort: 22, PublishedPort: 222 }
    )
  ).toThrow();
});

test('mixed protocols', () => {
  expect(
    toViewModel([
      { Protocol: 'tcp', TargetPort: 22, PublishedPort: 222 },
      { Protocol: 'udp', TargetPort: 23, PublishedPort: 223 },
    ])
  ).toStrictEqual([
    {
      containerPort: 22,
      hostPort: 222,
      protocol: 'tcp',
      publishMode: 'ingress',
    },
    {
      containerPort: 23,
      hostPort: 223,
      protocol: 'udp',
      publishMode: 'ingress',
    },
  ]);
});

test('non-sequential ports', () => {
  expect(
    toViewModel([
      { Protocol: 'tcp', TargetPort: 22, PublishedPort: 222 },
      { Protocol: 'tcp', TargetPort: 24, PublishedPort: 224 },
    ])
  ).toStrictEqual([
    {
      containerPort: 22,
      hostPort: 222,
      protocol: 'tcp',
      publishMode: 'ingress',
    },
    {
      containerPort: 24,
      hostPort: 224,
      protocol: 'tcp',
      publishMode: 'ingress',
    },
  ]);
});

test('without host', () => {
  expect(
    toViewModel([
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39003,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39010,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39007,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39008,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39000,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39001,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39002,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39004,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39005,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39006,
      },
      {
        Protocol: 'tcp',
        PublishMode: 'ingress',
        TargetPort: 39009,
      },
    ])
  ).toStrictEqual([
    {
      protocol: 'tcp',
      publishMode: 'ingress',
      containerPort: {
        start: 39000,
        end: 39010,
      },
      hostPort: undefined,
    },
  ]);
});
