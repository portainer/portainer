import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';

import { createMockEnvironment } from '@/react-tools/test-mocks';
import {
  Environment,
  EnvironmentStatus,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { EnvironmentCard } from './EnvironmentCard';

function renderCard(env: Environment, groupName?: string, isAdmin = false) {
  const user = new UserViewModel({ Username: 'test', Role: isAdmin ? 1 : 2 });

  server.use(http.get('/api/tags', () => HttpResponse.json([])));

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EnvironmentCard, user))
  );

  return render(
    <Wrapped environment={env} groupName={groupName} onClickBrowse={() => {}} />
  );
}

describe('EnvironmentCard', () => {
  it('renders the environment name', () => {
    const env = createMockEnvironment({ Name: 'my-env' });
    renderCard(env);
    expect(screen.getByText('my-env')).toBeVisible();
  });

  it('renders the group name when provided', () => {
    const env = createMockEnvironment();
    renderCard(env, 'Production');
    expect(screen.getByText(/Production/)).toBeVisible();
  });

  it('shows Unassigned when no group name is provided', () => {
    const env = createMockEnvironment();
    renderCard(env);
    expect(screen.getByText(/Unassigned/)).toBeVisible();
  });

  describe('Live connect / disconnect', () => {
    it('does not render a Live connect button', () => {
      const env = createMockEnvironment();
      renderCard(env);
      expect(
        screen.queryByRole('link', { name: /live connect/i })
      ).not.toBeInTheDocument();
    });

    it('does not render a Disconnect button', () => {
      const env = createMockEnvironment();
      renderCard(env);
      expect(
        screen.queryByRole('button', { name: /disconnect/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Browse snapshot button', () => {
    it('is hidden when environment is Up', () => {
      const env = createMockEnvironment({
        Type: EnvironmentType.EdgeAgentOnDocker,
        Status: EnvironmentStatus.Up,
        Edge: {
          AsyncMode: true,
          PingInterval: 0,
          CommandInterval: 0,
          SnapshotInterval: 0,
        },
        Snapshots: [{ Time: Date.now() / 1000 } as never],
      });
      renderCard(env);
      expect(
        screen.queryByRole('link', { name: /browse snapshot/i })
      ).not.toBeInTheDocument();
    });

    it('is hidden when environment is Down but has no snapshot', () => {
      const env = createMockEnvironment({
        Type: EnvironmentType.EdgeAgentOnDocker,
        Status: EnvironmentStatus.Down,
        Edge: {
          AsyncMode: true,
          PingInterval: 0,
          CommandInterval: 0,
          SnapshotInterval: 0,
        },
        Snapshots: [],
      });
      renderCard(env);
      expect(
        screen.queryByRole('link', { name: /browse snapshot/i })
      ).not.toBeInTheDocument();
    });

    // TODO: enable when BrowseSnapshotButton is uncommented [C9S-46]
    it.todo('is visible when environment is Down and has a snapshot', () => {
      const env = createMockEnvironment({
        Type: EnvironmentType.EdgeAgentOnDocker,
        Status: EnvironmentStatus.Down,
        Edge: {
          AsyncMode: true,
          PingInterval: 0,
          CommandInterval: 0,
          SnapshotInterval: 0,
        },
        Snapshots: [{ Time: Date.now() / 1000 } as never],
      });
      renderCard(env);
      expect(
        screen.getByRole('link', { name: /browse snapshot/i })
      ).toBeVisible();
    });
  });

  describe('edge environment', () => {
    it('renders EdgeIndicator for edge environments', () => {
      const env = createMockEnvironment({
        Type: EnvironmentType.EdgeAgentOnDocker,
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          CommandInterval: 0,
          SnapshotInterval: 0,
        },
      });
      renderCard(env);
      expect(screen.getByLabelText('edge-status')).toBeVisible();
    });
  });
});
