import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { buildDefaultValue as buildUrlDefaultValue } from '@/react/portainer/common/PortainerUrlField';

import { InitEdgeView } from './InitEdgeView';

const go = vi.fn();
vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useRouter: () => ({ stateService: { go } }),
}));

const mutate = vi.fn();
const useSettings = vi.fn();
vi.mock('@/react/portainer/settings/queries/useSettings', () => ({
  useUpdateSettingsMutation: () => ({ mutate, isLoading: false }),
  useSettings: () => useSettings(),
}));

function renderComponent() {
  const Wrapped = withTestQueryProvider(withTestRouter(InitEdgeView));
  return render(<Wrapped />);
}

describe('InitEdgeView', () => {
  beforeEach(() => {
    go.mockClear();
    mutate.mockClear();
    // Default: settings loaded with empty edge fields, so the form falls back
    // to the browser-derived default.
    useSettings.mockReturnValue({
      data: {
        EnableEdgeComputeFeatures: false,
        EdgePortainerUrl: '',
        TrustOnFirstConnect: false,
      },
      isLoading: false,
    });
  });

  it('renders the value bullets and the enable switch, with fields hidden by default', () => {
    renderComponent();

    expect(
      screen.getByText(/Edge Compute lets Portainer/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    // fields only appear once edge compute is enabled
    expect(
      screen.queryByLabelText(/Portainer API server URL/i)
    ).not.toBeInTheDocument();
  });

  it('reveals the URL field prefilled from the browser location when enabled', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('checkbox', { name: /edge compute/i }));

    expect(
      screen.getByPlaceholderText('https://portainer.mydomain.tld')
    ).toHaveValue(buildUrlDefaultValue());
  });

  it('skips to the wizard without saving when Skip is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Skip'));

    expect(go).toHaveBeenCalledWith('portainer.wizard');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('saves the partial settings payload and navigates to the wizard on enable', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('checkbox', { name: /edge compute/i }));

    const urlInput = screen.getByPlaceholderText(
      'https://portainer.mydomain.tld'
    );
    await user.clear(urlInput);
    await user.type(urlInput, 'https://portainer.example.com:9443');

    const submit = screen.getByRole('button', { name: 'Enable and continue' });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(mutate).toHaveBeenCalledWith(
      {
        EnableEdgeComputeFeatures: true,
        EdgePortainerUrl: 'https://portainer.example.com:9443',
        TrustOnFirstConnect: false,
      },
      expect.anything()
    );
  });

  it('prefills the URL from saved settings and reflects TrustOnFirstConnect', async () => {
    useSettings.mockReturnValue({
      data: {
        EnableEdgeComputeFeatures: false,
        EdgePortainerUrl: 'https://saved.example.com:9443',
        TrustOnFirstConnect: true,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('checkbox', { name: /edge compute/i }));

    expect(
      screen.getByPlaceholderText('https://portainer.mydomain.tld')
    ).toHaveValue('https://saved.example.com:9443');
    // TrustOnFirstConnect true -> the waiting-room switch is off.
    const waitingRoomSwitch = screen.getByRole('checkbox', {
      name: /waiting room/i,
    });
    expect(waitingRoomSwitch).not.toBeChecked();
  });
});
