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
import { PublicSettingsResponse } from '@/react/portainer/settings/types';
import { UserId } from '@/portainer/users/types';
import { VersionResponse } from '@/react/portainer/system/useSystemVersion';

import { azureHandlers } from './setup-handlers/azure';
import { dockerHandlers } from './setup-handlers/docker';
import { userHandlers } from './setup-handlers/users';

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
  ...azureHandlers,
  ...dockerHandlers,
  ...userHandlers,
  http.get('/api/licenses/info', () => HttpResponse.json(licenseInfo)),
  http.get('/api/status/nodes', () => HttpResponse.json({ nodes: 3 })),
  http.get('/api/backup/s3/status', () => HttpResponse.json({ Failed: false })),
  http.get('/api/endpoint_groups', () => HttpResponse.json([])),
  http.get('/api/endpoint_groups/:groupId', ({ params }) => {
    if (params.groupId instanceof Array) {
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
  http.get<never, never, Partial<PublicSettingsResponse>>(
    '/api/settings/public',
    () =>
      HttpResponse.json({
        Edge: {
          AsyncMode: false,
          CheckinInterval: 60,
          CommandInterval: 60,
          PingInterval: 60,
          SnapshotInterval: 60,
        },
      })
  ),
  http.get<never, never, Partial<StatusResponse>>('/api/status', () =>
    HttpResponse.json({})
  ),
  http.get<never, never, Partial<VersionResponse>>('/api/system/version', () =>
    HttpResponse.json({ ServerVersion: 'v2.10.0' })
  ),
  http.get('/api/teams/:id/memberships', () => HttpResponse.json([])),
  http.get('/api/endpoints/agent_versions', () => HttpResponse.json([])),
];
