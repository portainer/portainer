import { http, HttpResponse } from 'msw';

import { TeamMembership } from '@/react/portainer/users/teams/types';
import { createMockUsers } from '@/react-tools/test-mocks';

export const userHandlers = [
  http.get('/api/users', async () => HttpResponse.json(createMockUsers(10))),
  http.get<never, never, TeamMembership[]>(
    '/api/users/:userId/memberships',
    () => HttpResponse.json([])
  ),
];
