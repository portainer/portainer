import { Meta, StoryObj } from '@storybook/react-webpack5';
import { ReactStateDeclaration } from '@uirouter/react';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { EnvironmentGroup } from '../types';

import { EnvironmentGroupsTable } from './EnvironmentGroupsTable/EnvironmentGroupsTable';

function buildGroup(
  overrides: Partial<EnvironmentGroup> & { Id: number; Name: string }
): EnvironmentGroup {
  return {
    Description: '',
    TagIds: [],
    ...overrides,
  };
}

const sampleGroups: Array<EnvironmentGroup> = [
  buildGroup({
    Id: 2,
    Name: 'Production - AWS',
    Description: 'Production workloads on AWS EKS',
    Total: 12,
    TypeInfo: { Docker: 0, Kubernetes: 12, Podman: 0, Mixed: false },
  }),
  buildGroup({
    Id: 3,
    Name: 'Staging - Azure',
    Description: 'Pre-production staging on Azure AKS',
    Total: 5,
    TypeInfo: { Docker: 0, Kubernetes: 5, Podman: 0, Mixed: false },
  }),
  buildGroup({
    Id: 4,
    Name: 'CI/CD Runners',
    Description: 'Containerised build and test agents',
    Total: 8,
    TypeInfo: { Docker: 8, Kubernetes: 0, Podman: 0, Mixed: false },
  }),
  buildGroup({
    Id: 5,
    Name: 'Dev Workstations',
    Description: 'Developer local Docker environments',
    Total: 6,
    TypeInfo: { Docker: 6, Kubernetes: 0, Podman: 0, Mixed: false },
  }),
  buildGroup({
    Id: 6,
    Name: 'Edge Devices',
    Description: 'Edge computing nodes across regional sites',
    Total: 14,
    TypeInfo: { Docker: 0, Kubernetes: 0, Podman: 14, Mixed: false },
  }),
  buildGroup({
    Id: 7,
    Name: 'IoT Gateway Fleet',
    Description: 'Podman-based IoT gateway nodes',
    Total: 9,
    TypeInfo: { Docker: 0, Kubernetes: 0, Podman: 9, Mixed: false },
  }),
  buildGroup({
    Id: 8,
    Name: 'Platform Services',
    Description: 'Mixed workloads — Kubernetes, Docker, and Podman',
    Total: 11,
    TypeInfo: { Docker: 4, Kubernetes: 5, Podman: 2, Mixed: true },
  }),
  buildGroup({
    Id: 1,
    Name: 'Unassigned',
    Description: '',
    Total: 3,
    TypeInfo: { Docker: 1, Kubernetes: 1, Podman: 1, Mixed: true },
  }),
];

const stateConfig: Array<ReactStateDeclaration> = [
  { name: 'portainer.groups', component: () => null },
  { name: 'portainer.groups.group', component: () => null },
  { name: 'portainer.groups.new', component: () => null },
];

const WrappedPage = withTestQueryProvider(
  withTestRouter(withUserProvider(EnvironmentGroupsTable), {
    route: 'portainer.groups',
    stateConfig,
  })
);

const meta: Meta<typeof WrappedPage> = {
  component: WrappedPage,
  title: 'Pages/Environment Groups',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WrappedPage>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/endpoint_groups', () => HttpResponse.json(sampleGroups)),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get('/api/endpoint_groups', () => HttpResponse.json([]))],
    },
  },
};

export const ManyGroups: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/endpoint_groups', () => {
          const platforms: Array<Pick<EnvironmentGroup, 'TypeInfo' | 'Total'>> =
            [
              {
                TypeInfo: { Docker: 8, Kubernetes: 0, Podman: 0, Mixed: false },
                Total: 8,
              },
              {
                TypeInfo: { Docker: 0, Kubernetes: 6, Podman: 0, Mixed: false },
                Total: 6,
              },
              {
                TypeInfo: { Docker: 3, Kubernetes: 4, Podman: 1, Mixed: true },
                Total: 8,
              },
              {
                TypeInfo: { Docker: 12, Kubernetes: 0, Podman: 2, Mixed: true },
                Total: 14,
              },
              {
                TypeInfo: { Docker: 0, Kubernetes: 0, Podman: 5, Mixed: false },
                Total: 5,
              },
            ];
          const names = [
            'Production',
            'Staging',
            'Development',
            'Testing',
            'Lab',
            'Edge',
            'Data',
            'Monitoring',
            'Security',
            'Infra',
          ];
          const regions = ['AWS', 'Azure', 'GCP', 'On-Premise', 'Hybrid'];

          const groups = Array.from({ length: 30 }, (_, i) => {
            const p = platforms[i % platforms.length];
            return buildGroup({
              Id: i + 2,
              Name: `${names[i % names.length]} - ${
                regions[i % regions.length]
              }`,
              Description: `Auto-generated group ${i + 1}`,
              Total: p.Total,
              TypeInfo: p.TypeInfo,
            });
          });

          return HttpResponse.json([
            ...groups,
            buildGroup({
              Id: 1,
              Name: 'Unassigned',
              Total: 3,
              TypeInfo: { Docker: 2, Kubernetes: 1, Podman: 0, Mixed: true },
            }),
          ]);
        }),
      ],
    },
  },
};
