import { rest } from 'msw';

import {
  Edition,
  LicenseInfo,
  LicenseType,
} from '@/portainer/license-management/types';
import { EnvironmentGroup } from '@/portainer/environment-groups/types';
import { Tag } from '@/portainer/tags/types';

import { createMockTeams, createMockUsers } from '../react-tools/test-mocks';

import { azureHandlers } from './setup-handlers/azure';

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
  rest.get('/api/users', async (req, res, ctx) =>
    res(ctx.json(createMockUsers(10)))
  ),
  ...azureHandlers,
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
  rest.get('/api/tags', (req, res, ctx) => {
    const tags: Tag[] = [
      { ID: 1, Name: 'tag1' },
      { ID: 2, Name: 'tag2' },
    ];
    return res(ctx.json(tags));
  }),
];
