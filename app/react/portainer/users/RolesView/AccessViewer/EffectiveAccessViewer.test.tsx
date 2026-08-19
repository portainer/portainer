import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import axios from '@/portainer/services/axios/axios';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { EffectiveAccessViewer } from './EffectiveAccessViewer';

vi.mock('@/portainer/services/axios/axios', () => ({
  default: { get: vi.fn() },
  parseAxiosError: vi.fn((error) => error),
}));

function renderViewer(userId: number | null) {
  const Wrapped = withUserProvider(
    withTestRouter(withTestQueryProvider(EffectiveAccessViewer))
  );
  return render(<Wrapped userId={userId} />);
}

describe('EffectiveAccessViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing and skips the API call when no user is selected', () => {
    renderViewer(null);
    expect(axios.get).not.toHaveBeenCalled();
    expect(
      screen.queryByText(
        /Effective role for each environment will be displayed/i
      )
    ).not.toBeInTheDocument();
  });

  it('fetches effective access and renders the datatable for the selected user', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        {
          endpointId: 1,
          endpointName: 'prod-cluster',
          roleId: 2,
          roleName: 'Helpdesk',
          rolePriority: 5,
          groupId: 10,
          groupName: 'production',
          accessLocation: 'environmentGroup',
        },
      ],
    });

    renderViewer(42);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/users/42/effective-access');
    });

    expect(await screen.findByText('prod-cluster')).toBeInTheDocument();
    expect(screen.getByText('Helpdesk')).toBeInTheDocument();
  });
});
