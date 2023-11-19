import { toRequest } from './toRequest';

test('should handle empty portBindings', () => {
  const result = toRequest([]);
  expect(result).toEqual([]);
});

test('should handle single port binding', () => {
  const result = toRequest([
    {
      hostPort: 80,
      protocol: 'tcp',
      containerPort: 80,
      publishMode: 'ingress',
    },
  ]);
  expect(result).toEqual([
    {
      PublishedPort: 80,
      Protocol: 'tcp',
      TargetPort: 80,
      PublishMode: 'ingress',
    },
  ]);
});

test('should handle port range', () => {
  const result = toRequest([
    {
      hostPort: { start: 80, end: 82 },
      protocol: 'tcp',
      containerPort: { start: 80, end: 82 },
      publishMode: 'ingress',
    },
  ]);
  expect(result).toEqual([
    {
      PublishedPort: 80,
      Protocol: 'tcp',
      TargetPort: 80,
      PublishMode: 'ingress',
    },
    {
      PublishedPort: 81,
      Protocol: 'tcp',
      TargetPort: 81,
      PublishMode: 'ingress',
    },
    {
      PublishedPort: 82,
      Protocol: 'tcp',
      TargetPort: 82,
      PublishMode: 'ingress',
    },
  ]);
});

test('should throw error for unequal port ranges', () => {
  expect(() =>
    toRequest([
      {
        hostPort: { start: 80, end: 82 },
        protocol: 'tcp',
        containerPort: { start: 80, end: 81 },
        publishMode: 'ingress',
      },
    ])
  ).toThrow(
    'Invalid port specification: host port range must be equal to container port range'
  );
});

test('should handle host port range with single container port', () => {
  const result = toRequest([
    {
      hostPort: { start: 80, end: 82 },
      protocol: 'tcp',
      containerPort: 80,
      publishMode: 'ingress',
    },
  ]);
  expect(result).toEqual([
    {
      PublishedPort: 80,
      Protocol: 'tcp',
      TargetPort: 80,
      PublishMode: 'ingress',
    },
    {
      PublishedPort: 81,
      Protocol: 'tcp',
      TargetPort: 80,
      PublishMode: 'ingress',
    },
    {
      PublishedPort: 82,
      Protocol: 'tcp',
      TargetPort: 80,
      PublishMode: 'ingress',
    },
  ]);
});

test('should throw error for container port range with single host port', () => {
  expect(() =>
    toRequest([
      // @ts-expect-error test invalid input
      {
        hostPort: 80,
        protocol: 'tcp',
        containerPort: { start: 80, end: 82 },
        publishMode: 'ingress',
      },
    ])
  ).toThrow(
    'Invalid port specification: host port must be a range when container port is a range'
  );
});
