import { toViewModel } from './PortsMappingField.viewModel';

test('basic', () => {
  expect(
    toViewModel({
      '22/tcp': [
        {
          HostIp: '',
          HostPort: '222',
        },
      ],
      '3000/tcp': [
        {
          HostIp: '',
          HostPort: '3000',
        },
      ],
    })
  ).toStrictEqual([
    {
      hostPort: '222',
      containerPort: '22',
      protocol: 'tcp',
    },
    {
      hostPort: '3000',
      containerPort: '3000',
      protocol: 'tcp',
    },
  ]);
});

test('already combined', () => {
  expect(
    toViewModel({
      '80/tcp': [
        {
          HostIp: '',
          HostPort: '7000-7999',
        },
      ],
    })
  ).toStrictEqual([
    {
      hostPort: '7000-7999',
      containerPort: '80',
      protocol: 'tcp',
    },
  ]);
});

test('simple combine ports', () => {
  expect(
    toViewModel({
      '81/tcp': [
        {
          HostIp: '',
          HostPort: '81',
        },
      ],
      '82/tcp': [
        {
          HostIp: '',
          HostPort: '82',
        },
      ],
    })
  ).toStrictEqual([
    {
      hostPort: '81-82',
      containerPort: '81-82',
      protocol: 'tcp',
    },
  ]);
});

test('combine and sort', () => {
  expect(
    toViewModel({
      '3244/tcp': [
        {
          HostIp: '',
          HostPort: '105',
        },
      ],
      '3245/tcp': [
        {
          HostIp: '',
          HostPort: '106',
        },
      ],
      '81/tcp': [
        {
          HostIp: '',
          HostPort: '81',
        },
      ],
      '82/tcp': [
        {
          HostIp: '',
          HostPort: '82',
        },
      ],
      '83/tcp': [
        {
          HostIp: '0.0.0.0',
          HostPort: '0',
        },
      ],
      '84/tcp': [
        {
          HostIp: '0.0.0.0',
          HostPort: '0',
        },
      ],
    })
  ).toStrictEqual([
    {
      hostPort: '81-82',
      containerPort: '81-82',
      protocol: 'tcp',
    },
    {
      hostPort: '',
      containerPort: '83',
      protocol: 'tcp',
    },
    {
      hostPort: '',
      containerPort: '84',
      protocol: 'tcp',
    },
    {
      hostPort: '105-106',
      containerPort: '3244-3245',
      protocol: 'tcp',
    },
  ]);
});
