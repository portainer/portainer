import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { Environment } from '@/react/portainer/environments/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';

import { EnvSelector, getEnvironmentOptions } from './EnvSelector';

describe('EnvSelector', () => {
  it('should render when environment options are available', async () => {
    const mockEnvironments: Environment[] = [
      {
        Id: 1,
        Name: 'Environment 1',
        GroupId: 1,
      } as Environment,
      {
        Id: 2,
        Name: 'Environment 2',
        GroupId: 1,
      } as Environment,
    ];

    const mockGroups: EnvironmentGroup[] = [
      {
        Id: 1,
        Name: 'Unassigned',
      } as EnvironmentGroup,
    ];

    renderComponent({
      environments: mockEnvironments,
      groups: mockGroups,
    });
    await waitFor(() => {
      // render select
      const select = screen.getByRole('combobox');
      expect(select).toBeVisible();

      // placeholder text
      expect(screen.getByText('Select an environment')).toBeVisible();

      // no error displayed
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // data-cy
      expect(
        screen.getByTestId('stack-duplicate-environment-select')
      ).toBeInTheDocument();
    });
  });

  it('should return null when no environment options exist', async () => {
    const { container } = renderComponent();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should display FormError when error prop is provided', async () => {
    const mockEnvironments: Environment[] = [
      {
        Id: 1,
        Name: 'Environment 1',
        GroupId: 1,
      } as Environment,
    ];

    const mockGroups: EnvironmentGroup[] = [
      {
        Id: 1,
        Name: 'Group 1',
      } as EnvironmentGroup,
    ];

    const error = 'Environment is required';

    renderComponent({
      environments: mockEnvironments,
      groups: mockGroups,
      error,
    });

    await waitFor(() => {
      expect(screen.getByRole('alert', { name: error })).toBeVisible();
    });
  });

  function renderComponent({
    environments = [],
    groups = [],
    onChange = vi.fn(),
    error,
  }: {
    environments?: Environment[];
    groups?: EnvironmentGroup[];
    onChange?: (value: number | undefined) => void;
    error?: string;
  } = {}) {
    const Component = withTestQueryProvider(EnvSelector);

    server.use(
      http.get('/api/endpoints', () => HttpResponse.json(environments)),
      http.get('/api/endpoint_groups', () => HttpResponse.json(groups))
    );

    return render(
      <Component value={undefined} onChange={onChange} error={error} />
    );
  }
});

describe('getEnvironmentOptions', () => {
  it('should return empty array when no data provided', () => {
    expect(getEnvironmentOptions([], [])).toEqual([]);

    expect(
      getEnvironmentOptions(
        [
          {
            Id: 1,
            Name: 'Group 1',
          } as EnvironmentGroup,
        ],
        []
      )
    ).toEqual([]);
  });

  it('should exclude current environment when currentEnvironmentId is provided', () => {
    const groups: EnvironmentGroup[] = [
      { Id: 1, Name: 'Group 1' } as EnvironmentGroup,
    ];
    const environments: Environment[] = [
      { Id: 1, Name: 'Env 1', GroupId: 1 } as Environment,
      { Id: 2, Name: 'Env 2', GroupId: 1 } as Environment,
    ];

    const result = getEnvironmentOptions(groups, environments, 1);

    expect(result).toHaveLength(1);
    expect(result[0].options).toHaveLength(1);
    expect(result[0].options[0]).toEqual({ label: 'Env 2', value: 2 });
  });

  it('should group environments by GroupId with correct structure', () => {
    const groups: EnvironmentGroup[] = [
      { Id: 1, Name: 'Group 1' } as EnvironmentGroup,
      { Id: 2, Name: 'Group 2' } as EnvironmentGroup,
    ];
    const environments: Environment[] = [
      { Id: 1, Name: 'Env 1', GroupId: 1 } as Environment,
      { Id: 2, Name: 'Env 2', GroupId: 1 } as Environment,
      { Id: 3, Name: 'Env 3', GroupId: 2 } as Environment,
    ];

    const result = getEnvironmentOptions(groups, environments);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      label: 'Group 1',
      options: [
        { label: 'Env 1', value: 1 },
        { label: 'Env 2', value: 2 },
      ],
    });
    expect(result[1]).toEqual({
      label: 'Group 2',
      options: [{ label: 'Env 3', value: 3 }],
    });
  });

  it('should auto create an Others group if group is missing', () => {
    const environments: Environment[] = [
      { Id: 1, Name: 'Env 1', GroupId: 1 } as Environment,
      { Id: 2, Name: 'Env 2', GroupId: 2 } as Environment,
    ];
    const groups: EnvironmentGroup[] = [];

    const result = getEnvironmentOptions(groups, environments);
    expect(result.length).toBe(1);
    expect(result[0].label).toBe('Others');
    expect(result[0].options).toEqual([
      { label: 'Env 1', value: 1 },
      { label: 'Env 2', value: 2 },
    ]);
  });
});
