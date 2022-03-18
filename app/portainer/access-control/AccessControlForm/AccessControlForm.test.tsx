import { server, rest } from '@/setup-tests/server';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient, within } from '@/react-tools/test-utils';
import { Team, TeamId } from '@/portainer/teams/types';
import { createMockTeams } from '@/react-tools/test-mocks';
import { UserId } from '@/portainer/users/types';

import { ResourceControlOwnership, AccessControlFormData } from '../types';
import { ResourceControlViewModel } from '../models/ResourceControlViewModel';

import { AccessControlForm } from './AccessControlForm';

test('renders correctly', async () => {
  const values = buildFormData();

  const { findByText } = await renderComponent(values);

  expect(await findByText('Access control')).toBeVisible();
});

test.each([
  [ResourceControlOwnership.ADMINISTRATORS],
  [ResourceControlOwnership.PRIVATE],
  [ResourceControlOwnership.RESTRICTED],
])(
  `when ownership is %s, ownership selector should be visible`,
  async (ownership) => {
    const values = buildFormData(ownership);

    const { findByRole, getByLabelText } = await renderComponent(values);
    const accessSwitch = getByLabelText(/Enable access control/);

    expect(accessSwitch).toBeEnabled();

    await expect(findByRole('radiogroup')).resolves.toBeVisible();
  }
);

test.each([
  [ResourceControlOwnership.ADMINISTRATORS],
  [ResourceControlOwnership.PRIVATE],
  [ResourceControlOwnership.RESTRICTED],
])(
  'when isAdmin and ownership is %s, ownership selector should show admin and restricted options',
  async (ownership) => {
    const values = buildFormData(ownership);

    const { findByRole } = await renderComponent(values, jest.fn(), {
      isAdmin: true,
    });

    const ownershipSelector = await findByRole('radiogroup');

    expect(ownershipSelector).toBeVisible();
    if (!ownershipSelector) {
      throw new Error('selector is missing');
    }

    const selectorQueries = within(ownershipSelector);
    expect(
      await selectorQueries.findByLabelText(/Administrator/)
    ).toBeVisible();
    expect(await selectorQueries.findByLabelText(/Restricted/)).toBeVisible();
  }
);

test.each([
  [ResourceControlOwnership.ADMINISTRATORS],
  [ResourceControlOwnership.PRIVATE],
  [ResourceControlOwnership.RESTRICTED],
])(
  `when user is not an admin and %s and no teams, should have only private option`,
  async (ownership) => {
    const values = buildFormData(ownership);

    const { findByRole } = await renderComponent(values, jest.fn(), {
      teams: [],
      isAdmin: false,
    });

    const ownershipSelector = await findByRole('radiogroup');

    const selectorQueries = within(ownershipSelector);

    expect(selectorQueries.queryByLabelText(/Private/)).toBeVisible();
    expect(selectorQueries.queryByLabelText(/Restricted/)).toBeNull();
  }
);

test.each([
  [ResourceControlOwnership.ADMINISTRATORS],
  [ResourceControlOwnership.PRIVATE],
  [ResourceControlOwnership.RESTRICTED],
])(
  `when user is not an admin and %s and there is 1 team, should have private and restricted options`,
  async (ownership) => {
    const values = buildFormData(ownership);

    const { findByRole } = await renderComponent(values, jest.fn(), {
      teams: createMockTeams(1),
      isAdmin: false,
    });

    const ownershipSelector = await findByRole('radiogroup');

    const selectorQueries = within(ownershipSelector);

    expect(await selectorQueries.findByLabelText(/Private/)).toBeVisible();
    expect(await selectorQueries.findByLabelText(/Restricted/)).toBeVisible();
  }
);

test('when ownership is public, ownership selector should be hidden', async () => {
  const values = buildFormData(ResourceControlOwnership.PUBLIC);

  const { queryByRole } = await renderComponent(values);

  expect(queryByRole('radiogroup')).toBeNull();
});

test('when hideTitle is true, title should be hidden', async () => {
  const values = buildFormData();

  const { queryByRole } = await renderComponent(values, jest.fn(), {
    hideTitle: true,
  });

  expect(queryByRole('Access control')).toBeNull();
});

test('when isAdmin and admin ownership is selected, no extra options are visible', async () => {
  const values = buildFormData(ResourceControlOwnership.ADMINISTRATORS);

  const { findByRole, queryByLabelText } = await renderComponent(
    values,
    jest.fn(),
    {
      isAdmin: true,
    }
  );

  const ownershipSelector = await findByRole('radiogroup');

  expect(ownershipSelector).toBeVisible();
  if (!ownershipSelector) {
    throw new Error('selector is missing');
  }

  const selectorQueries = within(ownershipSelector);

  expect(await selectorQueries.findByLabelText(/Administrator/)).toBeChecked();
  expect(await selectorQueries.findByLabelText(/Restricted/)).not.toBeChecked();

  expect(queryByLabelText('extra-options')).toBeNull();
});

test('when isAdmin and restricted ownership is selected, show team and users selectors', async () => {
  const values = buildFormData(ResourceControlOwnership.RESTRICTED);

  const { findByRole, findByLabelText } = await renderComponent(
    values,
    jest.fn(),
    {
      isAdmin: true,
    }
  );

  const ownershipSelector = await findByRole('radiogroup');

  expect(ownershipSelector).toBeVisible();
  if (!ownershipSelector) {
    throw new Error('selector is missing');
  }

  const selectorQueries = within(ownershipSelector);

  expect(
    await selectorQueries.findByLabelText(/Administrator/)
  ).not.toBeChecked();

  expect(await selectorQueries.findByLabelText(/Restricted/)).toBeChecked();

  const extraOptions = await findByLabelText('extra-options');
  expect(extraOptions).toBeVisible();

  if (!extraOptions) {
    throw new Error('extra options section is missing');
  }

  const extraQueries = within(extraOptions);
  expect(await extraQueries.findByText(/Authorized users/)).toBeVisible();
  expect(await extraQueries.findByText(/Authorized teams/)).toBeVisible();
});

test('when user is not an admin, there are more then 1 team and ownership is restricted, team selector should be visible', async () => {
  const values = buildFormData(ResourceControlOwnership.RESTRICTED);

  const { findByRole, findByLabelText } = await renderComponent(
    values,
    jest.fn()
  );

  const ownershipSelector = await findByRole('radiogroup');

  expect(ownershipSelector).toBeVisible();
  if (!ownershipSelector) {
    throw new Error('selector is missing');
  }

  const selectorQueries = within(ownershipSelector);

  expect(await selectorQueries.findByLabelText(/Private/)).toBeVisible();
  expect(await selectorQueries.findByLabelText(/Restricted/)).toBeVisible();

  const extraOptions = await findByLabelText('extra-options');
  expect(extraOptions).toBeVisible();

  if (!extraOptions) {
    throw new Error('extra options section is missing');
  }

  const extraQueries = within(extraOptions);
  expect(extraQueries.queryByLabelText(/Authorized teams/)).toBeVisible();
});

test('when user is not an admin, there is 1 team and ownership is restricted, team selector not should be visible', async () => {
  const values = buildFormData(ResourceControlOwnership.RESTRICTED);

  const { findByRole, findByLabelText } = await renderComponent(
    values,
    jest.fn(),
    {
      teams: createMockTeams(1),
      isAdmin: false,
    }
  );

  const ownershipSelector = await findByRole('radiogroup');

  expect(ownershipSelector).toBeVisible();
  if (!ownershipSelector) {
    throw new Error('selector is missing');
  }

  const selectorQueries = within(ownershipSelector);

  expect(await selectorQueries.findByLabelText(/Private/)).toBeVisible();
  expect(await selectorQueries.findByLabelText(/Restricted/)).toBeVisible();

  const extraOptions = await findByLabelText('extra-options');
  expect(extraOptions).toBeVisible();

  if (!extraOptions) {
    throw new Error('extra options section is missing');
  }

  const extraQueries = within(extraOptions);
  expect(extraQueries.queryByText(/Authorized teams/)).toBeNull();
});

test('when user is not an admin, and ownership is restricted, user selector not should be visible', async () => {
  const values = buildFormData(ResourceControlOwnership.RESTRICTED);

  const { findByRole, findByLabelText } = await renderComponent(
    values,
    jest.fn(),
    {
      isAdmin: false,
    }
  );

  const ownershipSelector = await findByRole('radiogroup');

  expect(ownershipSelector).toBeVisible();
  if (!ownershipSelector) {
    throw new Error('selector is missing');
  }

  const extraOptions = await findByLabelText('extra-options');
  expect(extraOptions).toBeVisible();

  if (!extraOptions) {
    throw new Error('extra options section is missing');
  }
  const extraQueries = within(extraOptions);

  expect(extraQueries.queryByText(/Authorized users/)).toBeNull();
});

interface AdditionalProps {
  teams?: Team[];
  users?: UserViewModel[];
  isAdmin?: boolean;
  hideTitle?: boolean;
  resourceControl?: ResourceControlViewModel;
}

async function renderComponent(
  values: AccessControlFormData,
  onChange = jest.fn(),
  { isAdmin = false, hideTitle = false, teams, users }: AdditionalProps = {}
) {
  const user = new UserViewModel({ Username: 'user', Role: isAdmin ? 1 : 2 });
  const state = { user };

  if (teams) {
    server.use(rest.get('/api/teams', (req, res, ctx) => res(ctx.json(teams))));
  }

  if (users) {
    server.use(rest.get('/api/users', (req, res, ctx) => res(ctx.json(users))));
  }

  const renderResult = renderWithQueryClient(
    <UserContext.Provider value={state}>
      <AccessControlForm
        errors={{}}
        values={values}
        onChange={onChange}
        hideTitle={hideTitle}
      />
    </UserContext.Provider>
  );

  await expect(
    renderResult.findByLabelText(/Enable access control/)
  ).resolves.toBeVisible();
  return renderResult;
}

function buildFormData(
  ownership = ResourceControlOwnership.PRIVATE,
  authorizedTeams: TeamId[] = [],
  authorizedUsers: UserId[] = []
): AccessControlFormData {
  return { ownership, authorizedTeams, authorizedUsers };
}
