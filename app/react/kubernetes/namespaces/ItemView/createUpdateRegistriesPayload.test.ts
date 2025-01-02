import { createUpdateRegistriesPayload } from './createUpdateRegistriesPayload';

const tests: {
  testName: string;
  params: Parameters<typeof createUpdateRegistriesPayload>[0];
  expected: ReturnType<typeof createUpdateRegistriesPayload>;
}[] = [
  {
    testName: 'Add new registry',
    params: {
      registries: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'portainer',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: [],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      namespaceName: 'newns',
      newRegistriesValues: [
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'portainer',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: [],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      initialRegistriesValues: [
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      environmentId: 7,
    },
    expected: [
      {
        Id: 2,
        Namespaces: ['newns'],
      },
      {
        Id: 1,
        Namespaces: ['newns'],
      },
    ],
  },
  {
    testName: 'Remove a registry',
    params: {
      registries: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'portainer',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      namespaceName: 'newns',
      newRegistriesValues: [
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      initialRegistriesValues: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'portainer',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      environmentId: 7,
    },
    expected: [
      {
        Id: 1,
        Namespaces: [],
      },
      {
        Id: 2,
        Namespaces: ['newns'],
      },
    ],
  },
  {
    testName: 'Remove all registries',
    params: {
      registries: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'portainer',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      namespaceName: 'newns',
      newRegistriesValues: [],
      initialRegistriesValues: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'portainer',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
        {
          Id: 2,
          Type: 3,
          Name: 'portainertest',
          URL: 'test123.com',
          BaseURL: '',
          Authentication: false,
          Username: '',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Quay: {
            OrganisationName: '',
          },
          Ecr: {
            Region: '',
          },
          RegistryAccesses: {
            '7': {
              UserAccessPolicies: null,
              TeamAccessPolicies: null,
              Namespaces: ['newns'],
            },
          },
          Github: {
            UseOrganisation: false,
            OrganisationName: '',
          },
        },
      ],
      environmentId: 7,
    },
    expected: [
      {
        Id: 1,
        Namespaces: [],
      },
      {
        Id: 2,
        Namespaces: [],
      },
    ],
  },
];

describe('createUpdateRegistriesPayload', () => {
  tests.forEach(({ testName, params, expected }) => {
    it(`Should return the correct payload: ${testName}`, () => {
      expect(createUpdateRegistriesPayload(params)).toEqual(expected);
    });
  });
});
