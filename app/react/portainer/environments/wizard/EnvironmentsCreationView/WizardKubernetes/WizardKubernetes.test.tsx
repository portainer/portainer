import { HttpResponse } from 'msw';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server, http } from '@/setup-tests/server';

import { WizardKubernetes } from './WizardKubernetes';

function renderComponent() {
  // minimal settings so EdgeAgentForm can render
  server.use(
    http.get('/api/settings', () =>
      HttpResponse.json({
        AgentSecret: 'secret',
        EdgePortainerUrl: 'https://example.com',
        Edge: {
          PingInterval: 60,
          SnapshotInterval: 60,
          CommandInterval: 60,
          AsyncMode: false,
          TunnelServerAddress: 'portainer.test:8000',
        },
      })
    ),
    http.get('/api/custom_templates', () => HttpResponse.json([])),
    http.get('/api/system/status', () =>
      HttpResponse.json({ Version: '2.19.0', Edition: 'CE', InstanceID: '1' })
    ),
    http.get('/api/endpoints', () =>
      HttpResponse.json([], {
        headers: {
          'x-total-available': '0',
          'x-total-count': '0',
        },
      })
    )
  );

  const Wrapped = withTestQueryProvider(() => (
    <WizardKubernetes onCreate={() => {}} />
  ));
  return render(<Wrapped />);
}

describe('WizardKubernetes', () => {
  test('renders Edge Agent Standard form when selected', async () => {
    const { getByText, queryByTestId, findByTestId } = renderComponent();

    // select Edge Agent Standard
    await userEvent.click(getByText('Edge Agent Standard'));

    // verify submit button is visible (smallest sanity check for setup)
    await expect(
      findByTestId('edge-agent-form-submit-button')
    ).resolves.toBeVisible();
    expect(
      queryByTestId('endpointCreate-portainerServerUrlInput')
    ).toBeInTheDocument();
  });

  test('submits ContainerEngine as empty string for Kubernetes', async () => {
    let observedEntries: Array<[string, string]> = [];

    server.use(
      http.post('/api/endpoints', async ({ request }) => {
        const form = await request.formData();
        observedEntries = Array.from(form.entries()).map(([key, value]) => [
          key,
          typeof value === 'string' ? value : 'binary',
        ]);
        return HttpResponse.json({});
      })
    );

    const { getByText, getByTestId, findByTestId } = renderComponent();

    await userEvent.click(getByText('Edge Agent Standard'));

    await userEvent.type(getByTestId('environmentCreate-nameInput'), 'k8s-env');

    const submitBtn = await findByTestId('edge-agent-form-submit-button');
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await userEvent.click(submitBtn);

    // assert POST happened and ContainerEngine key exists with empty string
    await waitFor(() => {
      expect(observedEntries.length).toBeGreaterThan(0);
      expect(
        observedEntries.some(([k, v]) => k === 'ContainerEngine' && v === '')
      ).toBe(true);
    });
  });
});
