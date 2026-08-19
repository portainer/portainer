import { computeInitialValues } from './useNamespaceFormValues';

type NamespaceTestData = {
  testName: string;
  namespaceData: Parameters<typeof computeInitialValues>[0];
  expectedFormValues: ReturnType<typeof computeInitialValues>;
};

// various namespace data from simple to complex
const tests: NamespaceTestData[] = [
  {
    testName:
      'No resource quotas, registries, storage requests or ingress controllers',
    namespaceData: {
      namespaceName: 'test',
      environmentId: 4,
      storageClasses: [
        {
          Name: 'local-path',
          AccessModes: ['RWO'],
          Provisioner: 'rancher.io/local-path',
          AllowVolumeExpansion: false,
        },
      ],
      namespace: {
        Id: '6110390e-f7cb-4f23-b219-197e4a1d0291',
        Name: 'test',
        Status: {
          phase: 'Active',
        },
        UnhealthyEventCount: 0,
        Annotations: null,
        CreationDate: '2024-10-17T17:50:08+13:00',
        NamespaceOwner: 'admin',
        IsSystem: false,
        IsDefault: false,
      },
      registries: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'aliharriss',
          Gitlab: {
            ProjectId: 0,
            InstanceURL: '',
            ProjectPath: '',
          },
          Ecr: {
            Region: '',
          },
          Quay: {
            OrganisationName: '',
          },
          RegistryAccesses: {
            '4': {
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
      ingressClasses: [
        {
          Name: 'none',
          ClassName: 'none',
          Type: 'custom',
          Availability: true,
          New: false,
          Used: false,
        },
      ],
    },
    expectedFormValues: {
      name: 'test',
      ingressClasses: [
        {
          Name: 'none',
          ClassName: 'none',
          Type: 'custom',
          Availability: true,
          New: false,
          Used: false,
        },
      ],
      resourceQuota: {
        enabled: false,
        memory: '0',
        cpu: '0',
      },
      registries: [],
    },
  },
  {
    testName:
      'With annotations, registry, storage request, resource quota and disabled ingress controller',
    namespaceData: {
      namespaceName: 'newns',
      environmentId: 4,
      storageClasses: [
        {
          Name: 'local-path',
          AccessModes: ['RWO'],
          Provisioner: 'rancher.io/local-path',
          AllowVolumeExpansion: false,
        },
      ],
      namespace: {
        Id: 'd5c3cb69-bf9b-4625-b754-d7ba6ce2c688',
        Name: 'newns',
        Status: {
          phase: 'Active',
        },
        UnhealthyEventCount: 0,
        Annotations: {
          asdf: 'asdf',
        },
        CreationDate: '2024-10-01T10:20:46+13:00',
        NamespaceOwner: 'admin',
        IsSystem: false,
        IsDefault: false,
        ResourceQuota: {
          metadata: {},
          spec: {
            hard: {
              'limits.cpu': '800m',
              'limits.memory': '768M',
              'local-path.storageclass.storage.k8s.io/requests.storage': '1G',
              'requests.cpu': '800m',
              'requests.memory': '768M',
              'services.loadbalancers': '1',
            },
          },
        },
      },
      registries: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'aliharriss',
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
            '4': {
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
      ingressClasses: [
        {
          Name: 'none',
          ClassName: 'none',
          Type: 'custom',
          Availability: true,
          New: false,
          Used: false,
        },
      ],
    },
    expectedFormValues: {
      name: 'newns',
      ingressClasses: [
        {
          Name: 'none',
          ClassName: 'none',
          Type: 'custom',
          Availability: true,
          New: false,
          Used: false,
        },
      ],
      resourceQuota: {
        enabled: true,
        memory: '768',
        cpu: '0.8',
      },
      registries: [
        {
          Id: 1,
          Type: 6,
          Name: 'dockerhub',
          URL: 'docker.io',
          BaseURL: '',
          Authentication: true,
          Username: 'aliharriss',
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
            '4': {
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
    },
  },
];

describe('useNamespaceFormValues', () => {
  tests.forEach((test) => {
    it(`should return the correct form values: ${test.testName}`, () => {
      const formValues = computeInitialValues(test.namespaceData);
      expect(formValues).toEqual(test.expectedFormValues);
    });
  });
});
