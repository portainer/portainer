import {
  buildLinuxPodmanCommand,
  buildLinuxStandaloneCommand,
  buildLinuxSwarmCommand,
  buildLinuxKubernetesCommand,
  buildWindowsStandaloneCommand,
  buildWindowsSwarmCommand,
} from './scripts';
import { ScriptFormValues } from './types';

it('buildLinuxPodmanCommand should include PODMAN=1', () => {
  const command = buildLinuxPodmanCommand(
    '2.19.0',
    'test-edge-key',
    {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'linux',
      platform: 'podman',
      tagsIds: [],
      tlsEnabled: false,
    },
    false,
    'test-edge-id',
    'test-secret'
  );

  expect(command).toContain('PODMAN=1');
});

describe.each([
  {
    name: 'buildLinuxStandaloneCommand',
    builder: buildLinuxStandaloneCommand,
    defaultProperties: {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'linux' as const,
      platform: 'standalone' as const,
      tagsIds: [],
      tlsEnabled: false,
    },
    edgeIdGeneratorValue: 'uuidgen',
  },
  {
    name: 'buildLinuxPodmanCommand',
    builder: buildLinuxPodmanCommand,
    defaultProperties: {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'linux' as const,
      platform: 'podman' as const,
      tagsIds: [],
      tlsEnabled: false,
    },
    edgeIdGeneratorValue: 'uuidgen',
  },
  {
    name: 'buildLinuxSwarmCommand',
    builder: buildLinuxSwarmCommand,
    defaultProperties: {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'linux' as const,
      platform: 'swarm' as const,
      tagsIds: [],
      tlsEnabled: false,
    },
    edgeIdGeneratorValue: 'uuidgen',
  },
  {
    name: 'buildLinuxKubernetesCommand',
    builder: buildLinuxKubernetesCommand,
    defaultProperties: {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'linux' as const,
      platform: 'k8s' as const,
      tagsIds: [],
      tlsEnabled: false,
    },
    edgeIdGeneratorValue: 'uuidgen',
  },
  {
    name: 'buildWindowsStandaloneCommand',
    builder: buildWindowsStandaloneCommand,
    defaultProperties: {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'win' as const,
      platform: 'standalone' as const,
      tagsIds: [],
      tlsEnabled: false,
    },
    edgeIdGeneratorValue: 'Get-MachineGUID',
  },
  {
    name: 'buildWindowsSwarmCommand',
    builder: buildWindowsSwarmCommand,
    defaultProperties: {
      allowSelfSignedCertificates: false,
      authEnabled: false,
      edgeGroupsIds: [],
      edgeIdGenerator: '',
      envVars: '',
      group: 0,
      os: 'win' as const,
      platform: 'swarm' as const,
      tagsIds: [],
      tlsEnabled: false,
    },
    edgeIdGeneratorValue: 'Get-MachineGUID',
  },
])('$name', ({ builder, defaultProperties, edgeIdGeneratorValue }) => {
  it('should generate basic command with minimal configuration', () => {
    const command = builder(
      '2.19.0',
      'test-edge-key',
      defaultProperties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with async mode enabled', () => {
    const command = builder(
      '2.19.0',
      'test-edge-key',
      defaultProperties,
      true,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with self-signed certificates allowed', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      allowSelfSignedCertificates: true,
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with edge ID generator', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      edgeIdGenerator: edgeIdGeneratorValue,
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      undefined,
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with custom environment variables', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      envVars: 'MY_VAR=value1,ANOTHER_VAR=value2',
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with edge groups', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      edgeGroupsIds: [1, 2, 3],
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with portainer group', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      group: 5,
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with tags', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      tagsIds: [10, 20, 30],
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with all meta variables', () => {
    const properties: ScriptFormValues = {
      ...defaultProperties,
      edgeGroupsIds: [1, 2],
      group: 5,
      tagsIds: [10, 20],
    };

    const command = builder(
      '2.19.0',
      'test-edge-key',
      properties,
      false,
      'test-edge-id',
      'test-secret'
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command without agent secret', () => {
    const command = builder(
      '2.19.0',
      'test-edge-key',
      defaultProperties,
      false,
      'test-edge-id',
      undefined
    );

    expect(command).toMatchSnapshot();
  });

  it('should generate command with empty agent secret', () => {
    const command = builder(
      '2.19.0',
      'test-edge-key',
      defaultProperties,
      false,
      'test-edge-id',
      ''
    );

    expect(command).toMatchSnapshot();
  });
});
