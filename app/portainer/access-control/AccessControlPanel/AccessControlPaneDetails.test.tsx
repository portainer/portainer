import _ from 'lodash';

import { createMockTeams, createMockUsers } from '@/react-tools/test-mocks';
import { renderWithQueryClient } from '@/react-tools/test-utils';
import { rest, server } from '@/setup-tests/server';
import { Role } from '@/portainer/users/types';

import {
  ResourceControlOwnership,
  ResourceControlType,
  TeamResourceAccess,
  UserResourceAccess,
} from '../types';
import { ResourceControlViewModel } from '../models/ResourceControlViewModel';

import { AccessControlPanelDetails } from './AccessControlPanelDetails';

test.each([
  [ResourceControlOwnership.ADMINISTRATORS],
  [ResourceControlOwnership.PRIVATE],
  [ResourceControlOwnership.PUBLIC],
  [ResourceControlOwnership.RESTRICTED],
])(
  'when resource control with ownership %s is supplied, show its ownership',
  async (ownership) => {
    const resourceControl = buildViewModel(ownership);
    const { queryByLabelText } = await renderComponent(
      ResourceControlType.Container,
      resourceControl
    );

    expect(queryByLabelText('ownership')).toHaveTextContent(ownership);
  }
);

test('when resource control is not supplied, show administrators', async () => {
  const { queryByLabelText } = await renderComponent(
    ResourceControlType.Container
  );

  expect(queryByLabelText('ownership')).toHaveTextContent(
    ResourceControlOwnership.ADMINISTRATORS
  );
});

const inheritanceTests = [
  {
    resourceType: ResourceControlType.Container,
    parentType: ResourceControlType.Service,
  },
  {
    resourceType: ResourceControlType.Volume,
    parentType: ResourceControlType.Container,
  },
  ...[
    ResourceControlType.Config,
    ResourceControlType.Container,
    ResourceControlType.Network,
    ResourceControlType.Secret,
    ResourceControlType.Service,
    ResourceControlType.Volume,
  ].map((resourceType) => ({
    resourceType,
    parentType: ResourceControlType.Stack,
  })),
];

for (let i = 0; i < inheritanceTests.length; i += 1) {
  const { resourceType, parentType } = inheritanceTests[i];
  test(`when resource is ${ResourceControlType[resourceType]} and resource control is ${ResourceControlType[parentType]}, show message`, async () => {
    const resourceControl = buildViewModel(
      ResourceControlOwnership.ADMINISTRATORS,
      parentType
    );

    const { queryByLabelText } = await renderComponent(
      resourceType,
      resourceControl
    );
    const inheritanceMessage = queryByLabelText('inheritance-message');
    expect(inheritanceMessage).toBeVisible();
  });
}

test('when resource is limited to specific users, show comma separated list of their names', async () => {
  const users = createMockUsers(10, Role.Standard);

  server.use(rest.get('/api/users', (req, res, ctx) => res(ctx.json(users))));

  const restrictedToUsers = _.sampleSize(users, 3);

  const resourceControl = buildViewModel(
    ResourceControlOwnership.RESTRICTED,
    ResourceControlType.Service,
    restrictedToUsers.map((user) => ({
      UserId: user.Id,
      AccessLevel: 1,
    }))
  );

  const { queryByText, findByLabelText } = await renderComponent(
    undefined,
    resourceControl
  );

  expect(queryByText(/Authorized users/)).toBeVisible();

  await expect(findByLabelText('authorized-users')).resolves.toHaveTextContent(
    restrictedToUsers.map((user) => user.Username).join(', ')
  );
});

test('when resource is limited to specific teams, show comma separated list of their names', async () => {
  const teams = createMockTeams(10);

  server.use(rest.get('/api/teams', (req, res, ctx) => res(ctx.json(teams))));

  const restrictedToTeams = _.sampleSize(teams, 3);

  const resourceControl = buildViewModel(
    ResourceControlOwnership.RESTRICTED,
    ResourceControlType.Config,
    [],
    restrictedToTeams.map((team) => ({
      TeamId: team.Id,
      AccessLevel: 1,
    }))
  );

  const { queryByText, findByLabelText } = await renderComponent(
    undefined,
    resourceControl
  );

  expect(queryByText(/Authorized teams/)).toBeVisible();

  await expect(findByLabelText('authorized-teams')).resolves.toHaveTextContent(
    restrictedToTeams.map((team) => team.Name).join(', ')
  );
});

async function renderComponent(
  resourceType: ResourceControlType = ResourceControlType.Container,
  resourceControl?: ResourceControlViewModel
) {
  const queries = renderWithQueryClient(
    <AccessControlPanelDetails
      resourceControl={resourceControl}
      resourceType={resourceType}
    />
  );
  await expect(queries.findByText('Ownership')).resolves.toBeVisible();

  return queries;
}

function buildViewModel(
  ownership: ResourceControlOwnership,
  type: ResourceControlType = ResourceControlType.Config,
  users: UserResourceAccess[] = [],
  teams: TeamResourceAccess[] = []
): ResourceControlViewModel {
  return {
    Id: 0,
    Public: false,
    ResourceId: 0,
    System: false,
    TeamAccesses: teams,
    Ownership: ownership,
    Type: type,
    UserAccesses: users,
  };
}
