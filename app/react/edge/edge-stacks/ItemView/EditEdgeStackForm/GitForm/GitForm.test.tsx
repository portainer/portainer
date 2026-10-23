import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';

import { EdgeStack } from '../../../types';

import { GitForm } from './GitForm';

vi.mock('@/portainer/helpers/webhookHelper', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/portainer/helpers/webhookHelper')
  >()),
  createWebhookId: vi.fn(),
}));

function renderComponent(stack: EdgeStack) {
  const user = new UserViewModel({ Username: 'user', Role: 1 });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => <GitForm stack={stack} />),
      user
    )
  );

  return render(<Wrapped />);
}

describe('GitForm', () => {
  const mockStack: EdgeStack = {
    Id: 1,
    Name: 'test-stack',
    EdgeGroups: [1],
    DeploymentType: 0,
    GitConfig: {
      URL: 'https://github.com/test/repo',
      ReferenceName: 'refs/heads/main',
      ConfigFilePath: 'docker-compose.yml',
      ConfigHash: 'abc123',
      Authentication: {
        Username: '',
        Password: '',
      },
    },
    GitSourceId: 1,
    PrePullImage: false,
    RetryDeploy: false,
    RetryPeriod: 0,
    EnvVars: [],
    Registries: [],
  } as unknown as EdgeStack;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createWebhookId).mockReturnValue('default-webhook-id');
    server.use(
      http.get('/api/registries', () => HttpResponse.json([])),
      http.get('/api/edge_groups', () => HttpResponse.json([]))
    );
  });

  it('should not display any visible error messages on initial load', () => {
    renderComponent(mockStack);

    const errors = screen.queryAllByRole('alert');
    expect(errors).toHaveLength(0);
  });

  it('should call createWebhookId only once even when re-renders occur', () => {
    vi.mocked(createWebhookId).mockReturnValue('stable-webhook-id');

    const user = new UserViewModel({ Username: 'user', Role: 1 });
    const Wrapped = withTestQueryProvider(
      withUserProvider(
        withTestRouter(() => <GitForm stack={mockStack} />),
        user
      )
    );

    const { rerender } = render(<Wrapped />);

    expect(vi.mocked(createWebhookId)).toHaveBeenCalledTimes(1);

    rerender(<Wrapped />);

    expect(vi.mocked(createWebhookId)).toHaveBeenCalledTimes(1);
  });
});
