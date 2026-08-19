import { http, HttpResponse } from 'msw';

import {
  Edition,
  LicenseInfo,
  LicenseType,
} from '@/react/portainer/licenses/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';
import { Tag } from '@/portainer/tags/types';
import { StatusResponse } from '@/react/portainer/system/useSystemStatus';
import { createMockTeams } from '@/react-tools/test-mocks';
import { UserId } from '@/portainer/users/types';
import { VersionResponse } from '@/react/portainer/system/useSystemVersion';

import { azureHandlers } from './setup-handlers/azure';
import { dockerHandlers } from './setup-handlers/docker';
import { userHandlers } from './setup-handlers/users';
import { kubernetesHandlers } from './setup-handlers/kubernetes';
import { endpointsHandlers } from './setup-handlers/endpoints';
import { settingsHandlers } from './setup-handlers/settings';
import { templatesHandlers } from './setup-handlers/templates';
import { edgeHandlers } from './setup-handlers/edge';
import { gitopsHandlers } from './setup-handlers/gitops';

const tags: Tag[] = [
  { ID: 1, Name: 'tag1', Endpoints: {} },
  { ID: 2, Name: 'tag2', Endpoints: {} },
];

const licenseInfo: LicenseInfo = {
  nodes: 1000,
  type: LicenseType.Subscription,
  company: 'company',
  createdAt: 0,
  email: 'email@company.com',
  expiresAt: Number.MAX_SAFE_INTEGER,
  productEdition: Edition.EE,
  valid: true,
  enforcedAt: 0,
  enforced: false,
};

export const handlers = [
  http.get('/api/teams', async () => HttpResponse.json(createMockTeams(10))),

  http.post<{ name: string }>('/api/teams', () =>
    HttpResponse.json(null, { status: 204 })
  ),
  http.post<never, { userId: UserId }>('/api/team_memberships', () =>
    HttpResponse.json(null, { status: 204 })
  ),
  ...endpointsHandlers,
  ...settingsHandlers,
  ...templatesHandlers,
  ...azureHandlers,
  ...dockerHandlers,
  ...userHandlers,
  ...kubernetesHandlers,
  ...edgeHandlers,
  ...gitopsHandlers,
  http.get('/api/stacks', () => HttpResponse.json([])),
  http.get('/api/licenses/info', () => HttpResponse.json(licenseInfo)),
  http.get('/api/status/nodes', () => HttpResponse.json({ nodes: 3 })),
  http.get('/api/backup/s3/status', () => HttpResponse.json({ Failed: false })),
  http.get('/api/endpoint_groups', () => HttpResponse.json([])),
  http.get('/api/endpoint_groups/:groupId', ({ params }) => {
    if (!params.groupId || params.groupId instanceof Array) {
      throw new Error('should be string');
    }
    const id = parseInt(params.groupId, 10);
    const group: Partial<EnvironmentGroup> = {
      Id: id,
      Name: `group${id}`,
    };
    return HttpResponse.json(group);
  }),
  http.get('/api/tags', () => HttpResponse.json(tags)),
  http.post<never, { name: string }>('/api/tags', async ({ request }) => {
    const body = await request.json();
    const tagName = body.name;
    const tag = { ID: tags.length + 1, Name: tagName, Endpoints: {} };
    tags.push(tag);
    return HttpResponse.json(tag);
  }),

  http.get<never, never, Partial<StatusResponse>>('/api/status', () =>
    HttpResponse.json({})
  ),
  http.get<never, never, Partial<StatusResponse>>('/api/system/status', () =>
    HttpResponse.json({})
  ),
  http.get<never, never, Partial<VersionResponse>>('/api/system/version', () =>
    HttpResponse.json({ ServerVersion: 'v2.10.0' })
  ),
  http.get('/api/teams/:id/memberships', () => HttpResponse.json([])),
  http.get('/api/observability/alerting/settings', () => HttpResponse.json([])),
  http.get('/observability/alerting/rules', () => HttpResponse.json([])),

  http.get('/api/omni/:id/machines', () => HttpResponse.json([])),
  http.get('/api/registries', () => HttpResponse.json([])),
  http.get('/api/registries/:id', () => HttpResponse.json({})),

  http.get('/api/system/info', () => HttpResponse.json({})),
  http.post('/api/registries/ping', () =>
    HttpResponse.json({
      success: true,
      message: 'Registry connection successful',
    })
  ),
  http.put('/api/resource_controls/:id', () =>
    HttpResponse.json({ success: true })
  ),
  http.get('/api/webhooks', () => HttpResponse.json([])),
  http.get('/api/policies', () => HttpResponse.json([])),
  http.get('/api/roles', () => HttpResponse.json([])),
];
