import { DefaultRequestBody, PathParams, rest } from 'msw';

import { TeamMembership } from '@/react/portainer/users/teams/types';
import { createMockUsers } from '@/react-tools/test-mocks';

export const userHandlers = [
  rest.get('/api/users', async (req, res, ctx) =>
    res(ctx.json(createMockUsers(10)))
  ),
  rest.get<DefaultRequestBody, PathParams, TeamMembership[]>(
    '/api/users/:userId/memberships',
    (req, res, ctx) => res(ctx.json([]))
  ),
];
