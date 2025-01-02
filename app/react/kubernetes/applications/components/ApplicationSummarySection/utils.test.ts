import { ApplicationFormValues } from '../../types';

import { Summary } from './types';
import { getAppResourceSummaries } from './utils';

const complicatedStatefulSet: ApplicationFormValues = {
  ApplicationType: 'StatefulSet',
  ResourcePool: {
    Namespace: {
      Id: '9ef75267-3cf4-46f6-879a-5baeceb5c477',
      Name: 'default',
      CreationDate: '2023-08-30T18:55:34Z',
      Status: 'Active',
      Yaml: '',
      IsSystem: false,
      Annotations: [],
    },
    Ingresses: [],
    Yaml: '',
    $$hashKey: 'object:702',
  },
  Name: 'my-app',
  StackName: '',
  ApplicationOwner: '',
  ImageModel: {
    UseRegistry: true,
    Registry: {
      Id: 0,
      Type: 0,
      Name: 'Docker Hub (anonymous)',
      URL: 'docker.io',
    },
    Image: 'caddy',
  },
  Note: '',
  MemoryLimit: 512,
  CpuLimit: 0.5,
  DeploymentType: 'Replicated',
  ReplicaCount: 1,
  AutoScaler: {
    isUsed: true,
    minReplicas: 1,
    maxReplicas: 3,
    targetCpuUtilizationPercentage: 50,
  },
  Containers: [],
  Services: [
    {
      Headless: false,
      Namespace: '',
      Name: 'my-app',
      StackName: '',
      Ports: [
        {
          port: 80,
          targetPort: 80,
          name: '',
          protocol: 'TCP',
          serviceName: 'my-app',
          ingressPaths: [
            {
              Host: '127.0.0.1.nip.io',
              IngressName: 'default-ingress-3',
              Path: '/test',
            },
          ],
        },
      ],
      Type: 'ClusterIP',
      ClusterIP: '',
      ApplicationName: '',
      ApplicationOwner: '',
      Note: '',
      Ingress: false,
    },
    {
      Headless: false,
      Namespace: '',
      Name: 'my-app-2',
      StackName: '',
      Ports: [
        {
          port: 80,
          targetPort: 80,
          name: '',
          protocol: 'TCP',
          nodePort: 30080,
          serviceName: 'my-app-2',
        },
      ],
      Type: 'NodePort',
      ClusterIP: '',
      ApplicationName: '',
      ApplicationOwner: '',
      Note: '',
      Ingress: false,
    },
    {
      Headless: false,
      Namespace: '',
      Name: 'my-app-3',
      StackName: '',
      Ports: [
        {
          port: 80,
          targetPort: 80,
          name: '',
          protocol: 'TCP',
          serviceName: 'my-app-3',
        },
      ],
      Type: 'LoadBalancer',
      ClusterIP: '',
      ApplicationName: '',
      ApplicationOwner: '',
      Note: '',
      Ingress: false,
    },
  ],
  EnvironmentVariables: [],
  DataAccessPolicy: 'Isolated',
  PersistedFolders: [
    {
      persistentVolumeClaimName: 'my-app-6be07c40-de3a-4775-a29b-19a60890052e',
      containerPath: 'test',
      size: '1',
      sizeUnit: 'GB',
      storageClass: {
        Name: 'local-path',
        AccessModes: ['RWO', 'RWX'],
        Provisioner: 'rancher.io/local-path',
        AllowVolumeExpansion: true,
      },
      useNewVolume: true,
      needsDeletion: false,
    },
  ],
  ConfigMaps: [],
  Secrets: [],
  PlacementType: 'preferred',
  Placements: [],
  Annotations: [],
};

const complicatedStatefulSetNoServices: ApplicationFormValues = {
  ApplicationType: 'StatefulSet',
  ResourcePool: {
    Namespace: {
      Id: '9ef75267-3cf4-46f6-879a-5baeceb5c477',
      Name: 'default',
      CreationDate: '2023-08-30T18:55:34Z',
      Status: 'Active',
      Yaml: '',
      IsSystem: false,
      Annotations: [],
    },
    Ingresses: [],
    Yaml: '',
    $$hashKey: 'object:129',
  },
  Name: 'my-app',
  StackName: 'my-app',
  ApplicationOwner: 'admin',
  ImageModel: {
    UseRegistry: true,
    Registry: {
      Id: 0,
      Type: 0,
      Name: 'Docker Hub (anonymous)',
      URL: 'docker.io',
    },
    Image: 'caddy:latest',
  },
  Note: '',
  MemoryLimit: 512,
  CpuLimit: 0.5,
  DeploymentType: 'Replicated',
  ReplicaCount: 1,
  AutoScaler: {
    minReplicas: 1,
    maxReplicas: 3,
    targetCpuUtilizationPercentage: 50,
    isUsed: true,
  },
  Containers: [
    {
      Type: 2,
      PodName: 'my-app-0',
      Name: 'my-app',
      Image: 'caddy:latest',
      ImagePullPolicy: 'Always',
      Status: 'Terminated',
      Limits: {
        cpu: '500m',
        memory: '512M',
      },
      Requests: {
        cpu: '500m',
        memory: '512M',
      },
      VolumeMounts: [
        {
          name: 'test-6be07c40-de3a-4775-a29b-19a60890052e-test-0',
          mountPath: '/test',
        },
        {
          name: 'kube-api-access-n4vht',
          readOnly: true,
          mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
        },
      ],
      ConfigurationVolumes: [],
      PersistedFolders: [
        {
          MountPath: '/test',
          persistentVolumeClaimName:
            'test-6be07c40-de3a-4775-a29b-19a60890052e-test-0',
          HostPath: '',
        },
      ],
    },
  ],
  Services: [],
  EnvironmentVariables: [],
  DataAccessPolicy: 'Isolated',
  PersistedFolders: [
    {
      persistentVolumeClaimName:
        'test-6be07c40-de3a-4775-a29b-19a60890052e-test-0',
      needsDeletion: false,
      containerPath: '/test',
      size: '1',
      sizeUnit: 'GB',
      storageClass: {
        Name: 'local-path',
        AccessModes: ['RWO', 'RWX'],
        Provisioner: 'rancher.io/local-path',
        AllowVolumeExpansion: true,
      },
      useNewVolume: true,
    },
  ],
  ConfigMaps: [],
  Secrets: [],
  PlacementType: 'preferred',
  Placements: [],
  Annotations: [],
};

const createComplicatedStatefulSetSummaries: Array<Summary> = [
  {
    action: 'Create',
    kind: 'StatefulSet',
    name: 'my-app',
  },
  {
    action: 'Create',
    kind: 'Service',
    name: 'my-app',
    type: 'ClusterIP',
  },
  {
    action: 'Create',
    kind: 'Service',
    name: 'my-app-2',
    type: 'NodePort',
  },
  {
    action: 'Create',
    kind: 'Service',
    name: 'my-app-3',
    type: 'LoadBalancer',
  },
  {
    action: 'Create',
    kind: 'Service',
    name: 'headless-my-app',
    type: 'ClusterIP',
  },
  {
    action: 'Update',
    kind: 'Ingress',
    name: 'default-ingress-3',
  },
  {
    action: 'Create',
    kind: 'PersistentVolumeClaim',
    name: 'my-app-6be07c40-de3a-4775-a29b-19a60890052e-my-app-0',
  },
  {
    action: 'Create',
    kind: 'HorizontalPodAutoscaler',
    name: 'my-app',
  },
];

const simpleDaemonset: ApplicationFormValues = {
  ApplicationType: 'DaemonSet',
  ResourcePool: {
    Namespace: {
      Id: '49acd824-0ee4-46d1-b1e2-3d36a64ce7e4',
      Name: 'default',
      CreationDate: '2023-12-19T06:40:12Z',
      Status: 'Active',
      Yaml: '',
      IsSystem: false,
      Annotations: [],
    },
    Ingresses: [],
    Yaml: '',
    $$hashKey: 'object:418',
  },
  Name: 'my-app',
  StackName: '',
  ApplicationOwner: '',
  ImageModel: {
    UseRegistry: true,
    Registry: {
      Id: 0,
      Type: 0,
      Name: 'Docker Hub (anonymous)',
      URL: 'docker.io',
    },
    Image: 'caddy',
  },
  Note: '',
  MemoryLimit: 0,
  CpuLimit: 0,
  DeploymentType: 'Global',
  ReplicaCount: 1,
  Containers: [],
  DataAccessPolicy: 'Shared',
  PersistedFolders: [
    {
      persistentVolumeClaimName: 'my-app-7c114420-a5d0-491c-8bd6-ec70c3d380be',
      containerPath: '/test',
      size: '1',
      sizeUnit: 'GB',
      storageClass: {
        Name: 'oci',
        AccessModes: ['RWO', 'RWX'],
        Provisioner: 'oracle.com/oci',
        AllowVolumeExpansion: true,
      },
      useNewVolume: true,
      needsDeletion: false,
    },
  ],
  PlacementType: 'preferred',
};

const createSimpleDaemonsetSummaries: Array<Summary> = [
  {
    action: 'Create',
    kind: 'DaemonSet',
    name: 'my-app',
  },
  {
    action: 'Create',
    kind: 'PersistentVolumeClaim',
    name: 'my-app-7c114420-a5d0-491c-8bd6-ec70c3d380be',
  },
];

const simpleDeployment: ApplicationFormValues = {
  ApplicationType: 'Deployment',
  ResourcePool: {
    Namespace: {
      Id: '49acd824-0ee4-46d1-b1e2-3d36a64ce7e4',
      Name: 'default',
      CreationDate: '2023-12-19T06:40:12Z',
      Status: 'Active',
      Yaml: '',
      IsSystem: false,
      Annotations: [],
    },
    Ingresses: [],
    Yaml: '',
    $$hashKey: 'object:582',
  },
  Name: 'my-app',
  StackName: '',
  ApplicationOwner: '',
  ImageModel: {
    UseRegistry: true,
    Registry: {
      Id: 0,
      Type: 0,
      Name: 'Docker Hub (anonymous)',
      URL: 'docker.io',
    },
    Image: 'caddy',
  },
  Note: '',
  MemoryLimit: 512,
  CpuLimit: 0.5,
  DeploymentType: 'Replicated',
  ReplicaCount: 1,
  Containers: [],
  DataAccessPolicy: 'Isolated',
  PlacementType: 'preferred',
};

const createSimpleDeploymentSummaries: Array<Summary> = [
  {
    action: 'Create',
    kind: 'Deployment',
    name: 'my-app',
  },
];

describe('getCreateAppSummaries', () => {
  const tests: {
    oldFormValues?: ApplicationFormValues;
    newFormValues: ApplicationFormValues;
    expected: Array<Summary>;
    title: string;
  }[] = [
    {
      oldFormValues: undefined,
      newFormValues: complicatedStatefulSet,
      expected: createComplicatedStatefulSetSummaries,
      title: 'should return create summaries for a complicated statefulset',
    },
    {
      oldFormValues: undefined,
      newFormValues: simpleDaemonset,
      expected: createSimpleDaemonsetSummaries,
      title: 'should return create summaries for a simple daemonset',
    },
    {
      oldFormValues: undefined,
      newFormValues: simpleDeployment,
      expected: createSimpleDeploymentSummaries,
      title: 'should return create summaries for a simple deployment',
    },
  ];
  tests.forEach((test) => {
    // eslint-disable-next-line vitest/valid-title
    it(test.title, () => {
      expect(
        getAppResourceSummaries(test.newFormValues, test.oldFormValues)
      ).toEqual(test.expected);
    });
  });
});

const updateComplicatedStatefulSetSummaries: Array<Summary> = [
  {
    action: 'Update',
    kind: 'StatefulSet',
    name: 'my-app',
  },
  {
    action: 'Delete',
    kind: 'Service',
    name: 'my-app',
    type: 'ClusterIP',
  },
  {
    action: 'Delete',
    kind: 'Service',
    name: 'my-app-2',
    type: 'NodePort',
  },
  {
    action: 'Delete',
    kind: 'Service',
    name: 'my-app-3',
    type: 'LoadBalancer',
  },
  {
    action: 'Create',
    kind: 'PersistentVolumeClaim',
    name: 'test-6be07c40-de3a-4775-a29b-19a60890052e-test-0-my-app-0',
  },
];

const updateDeploymentToStatefulSetSummaries: Array<Summary> = [
  {
    action: 'Delete',
    kind: 'Deployment',
    name: 'my-app',
  },
  {
    action: 'Create',
    kind: 'StatefulSet',
    name: 'my-app',
  },
  {
    action: 'Create',
    kind: 'PersistentVolumeClaim',
    name: 'test-6be07c40-de3a-4775-a29b-19a60890052e-test-0-my-app-0',
  },
  {
    action: 'Create',
    kind: 'HorizontalPodAutoscaler',
    name: 'my-app',
  },
];

describe('getUpdateAppSummaries', () => {
  const tests: {
    oldFormValues: ApplicationFormValues;
    newFormValues: ApplicationFormValues;
    expected: Array<Summary>;
    title: string;
  }[] = [
    {
      oldFormValues: complicatedStatefulSet,
      newFormValues: complicatedStatefulSetNoServices,
      expected: updateComplicatedStatefulSetSummaries,
      title:
        'should return update summaries for removing services from statefulset',
    },
    {
      oldFormValues: simpleDeployment,
      newFormValues: complicatedStatefulSetNoServices,
      expected: updateDeploymentToStatefulSetSummaries,
      title:
        'should return update summaries for changing deployment to statefulset',
    },
  ];
  tests.forEach((test) => {
    // eslint-disable-next-line vitest/valid-title
    it(test.title, () => {
      expect(
        getAppResourceSummaries(test.newFormValues, test.oldFormValues)
      ).toEqual(test.expected);
    });
  });
});
