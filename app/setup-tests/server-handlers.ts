import { rest } from 'msw';

import { createMockTeams, createMockUsers } from '../react-tools/test-mocks';

import { azureHandlers } from './setup-handlers/azure';

export const handlers = [
  rest.get('/api/teams', async (req, res, ctx) =>
    res(ctx.json(createMockTeams(10)))
  ),
  rest.get('/api/users', async (req, res, ctx) =>
    res(ctx.json(createMockUsers(10)))
  ),
  ...azureHandlers,
];
