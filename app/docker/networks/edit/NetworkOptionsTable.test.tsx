import { render } from '@/react-tools/test-utils';

import { NetworkOptions } from '../types';

import { NetworkOptionsTable } from './NetworkOptionsTable';

const options: NetworkOptions = {
  'com.docker.network.bridge.default_bridge': 'true',
  'com.docker.network.bridge.enable_icc': 'true',
  'com.docker.network.bridge.enable_ip_masquerade': 'true',
  'com.docker.network.bridge.host_binding_ipv4': '0.0.0.0',
  'com.docker.network.bridge.name': 'docker0',
  'com.docker.network.driver.mtu': '1500',
};

test('Network options values should be visible', async () => {
  const { findByText, findAllByText } = render(
    <NetworkOptionsTable options={options} />
  );

  await expect(findByText('Network options')).resolves.toBeVisible();
  // expect to find three 'true' values for the first 3 options
  const cells = await findAllByText('true');
  expect(cells).toHaveLength(3);
  await expect(
    findByText(options['com.docker.network.bridge.host_binding_ipv4'])
  ).resolves.toBeVisible();
  await expect(
    findByText(options['com.docker.network.bridge.name'])
  ).resolves.toBeVisible();
  await expect(
    findByText(options['com.docker.network.driver.mtu'])
  ).resolves.toBeVisible();
});
