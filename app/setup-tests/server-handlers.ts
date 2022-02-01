import { rest } from 'msw';

import {
  Edition,
  LicenseInfo,
  LicenseType,
} from '@/portainer/license-management/types';

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
];
