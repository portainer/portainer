import { ContainerInstanceFormValues } from '@/react/azure/types';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { transformToPayload } from './container-groups.service';

describe('transformToPayload', () => {
  const baseFormValues: ContainerInstanceFormValues = {
    name: 'test-container',
    location: 'eastus',
    subscription: 'sub1',
    resourceGroup: 'rg1',
    image: 'nginx:latest',
    os: 'Linux',
    memory: 1,
    cpu: 1,
    ports: [{ container: 80, host: 80, protocol: 'TCP' }],
    allocatePublicIP: true,
    accessControl: {
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.PRIVATE,
    },
    env: [],
  };

  test('should include empty environment variables array when no env vars provided', () => {
    const payload = transformToPayload(baseFormValues);

    expect(
      payload.properties.containers[0].properties.environmentVariables
    ).toEqual([]);
  });

  test('should include single environment variable in payload', () => {
    const formValues = {
      ...baseFormValues,
      env: [{ name: 'TEST_VAR', value: 'test-value' }],
    };

    const payload = transformToPayload(formValues);

    expect(
      payload.properties.containers[0].properties.environmentVariables
    ).toEqual([{ name: 'TEST_VAR', value: 'test-value' }]);
  });

  test('should include multiple environment variables in payload', () => {
    const formValues = {
      ...baseFormValues,
      env: [
        { name: 'VAR1', value: 'value1' },
        { name: 'VAR2', value: 'value2' },
        { name: 'VAR3', value: 'value3' },
      ],
    };

    const payload = transformToPayload(formValues);

    expect(
      payload.properties.containers[0].properties.environmentVariables
    ).toEqual([
      { name: 'VAR1', value: 'value1' },
      { name: 'VAR2', value: 'value2' },
      { name: 'VAR3', value: 'value3' },
    ]);
  });

  test('should preserve other container properties when adding env vars', () => {
    const formValues: ContainerInstanceFormValues = {
      ...baseFormValues,
      env: [{ name: 'APP_ENV', value: 'production' }],
      ports: [
        { container: 80, host: 80, protocol: 'TCP' },
        { container: 443, host: 443, protocol: 'TCP' },
      ],
    };

    const payload = transformToPayload(formValues);
    const containerProps = payload.properties.containers[0].properties;

    expect(containerProps.image).toBe('nginx:latest');
    expect(containerProps.ports).toHaveLength(2);
    expect(containerProps.environmentVariables).toEqual([
      { name: 'APP_ENV', value: 'production' },
    ]);
  });

  test('should handle env vars with special characters', () => {
    const formValues = {
      ...baseFormValues,
      env: [
        {
          name: 'DB_CONNECTION_STRING',
          value: 'Server=localhost;User=admin;Password=P@ss123',
        },
        { name: 'API_KEY', value: 'abc123!@#$%^&*()' },
      ],
    };

    const payload = transformToPayload(formValues);

    expect(
      payload.properties.containers[0].properties.environmentVariables
    ).toEqual([
      {
        name: 'DB_CONNECTION_STRING',
        value: 'Server=localhost;User=admin;Password=P@ss123',
      },
      { name: 'API_KEY', value: 'abc123!@#$%^&*()' },
    ]);
  });
});
