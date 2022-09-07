import { DefaultRequestBody, PathParams, rest } from 'msw';

import {
  Edition,
  LicenseInfo,
  LicenseType,
} from '@/portainer/license-management/types';
import { EnvironmentGroup } from '@/portainer/environment-groups/types';
import { Tag } from '@/portainer/tags/types';
import { StatusResponse } from '@/portainer/services/api/status.service';
import { createMockTeams } from '@/react-tools/test-mocks';
import { PublicSettingsResponse } from '@/react/portainer/settings/types';
import { UserId } from '@/portainer/users/types';

import { azureHandlers } from './setup-handlers/azure';
import { dockerHandlers } from './setup-handlers/docker';
import { userHandlers } from './setup-handlers/users';

const tags: Tag[] = [
  { ID: 1, Name: 'tag1' },
  { ID: 2, Name: 'tag2' },
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
};

export const handlers = [
  rest.get('/api/teams', async (req, res, ctx) =>
    res(ctx.json(createMockTeams(10)))
  ),

  rest.post<{ name: string }>('/api/teams', (req, res, ctx) =>
    res(ctx.status(204))
  ),
  rest.post<{ userId: UserId }>('/api/team_memberships', (req, res, ctx) =>
    res(ctx.status(204))
  ),
  ...azureHandlers,
  ...dockerHandlers,
  ...userHandlers,
  rest.get('/api/licenses/info', (req, res, ctx) => res(ctx.json(licenseInfo))),
  rest.get('/api/status/nodes', (req, res, ctx) => res(ctx.json({ nodes: 3 }))),
  rest.get('/api/backup/s3/status', (req, res, ctx) =>
    res(ctx.json({ Failed: false }))
  ),
  rest.get('/api/endpoint_groups', (req, res, ctx) => res(ctx.json([]))),
  rest.get('/api/endpoint_groups/:groupId', (req, res, ctx) => {
    if (req.params.groupId instanceof Array) {
      throw new Error('should be string');
    }
    const id = parseInt(req.params.groupId, 10);
    const group: Partial<EnvironmentGroup> = {
      Id: id,
      Name: `group${id}`,
    };
    return res(ctx.json(group));
  }),
  rest.get('/api/tags', (req, res, ctx) => res(ctx.json(tags))),
  rest.post<{ name: string }>('/api/tags', (req, res, ctx) => {
    const tagName = req.body.name;
    const tag = { ID: tags.length + 1, Name: tagName };
    tags.push(tag);
    return res(ctx.json(tag));
  }),
  rest.get<DefaultRequestBody, PathParams, Partial<PublicSettingsResponse>>(
    '/api/settings/public',
    (req, res, ctx) => res(ctx.json({}))
  ),
  rest.get<DefaultRequestBody, PathParams, Partial<StatusResponse>>(
    '/api/status',
    (req, res, ctx) => res(ctx.json({}))
  ),
];
