import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';

import { CreateStackForm } from './CreateStackForm';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

function renderComponent({
  onMutationError,
}: { onMutationError?(): void } = {}) {
  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(CreateStackForm)),
    { onMutationError }
  );

  return render(<Wrapped environmentId={1} isSwarm={false} swarmId="" />);
}

describe('CreateStackForm', () => {
  it.skip('should not display any visible error messages on initial load', async () => {
    renderComponent();

    const errors = await screen.findByRole('alert');

    // Check that no error messages (role="alert") are visible
    expect(errors).not.toBeInTheDocument();
  });

  it('should render with default method (editor)', async () => {
    renderComponent();

    expect(await screen.findByText('Build method')).toBeVisible();
    expect(screen.getByRole('radio', { name: /web editor/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /upload/i })).not.toBeChecked();
    expect(
      screen.getByRole('radio', { name: /repository/i })
    ).not.toBeChecked();
    expect(
      screen.getByRole('radio', { name: /custom template/i })
    ).not.toBeChecked();
  });

  it('should switch to upload method', async () => {
    const user = userEvent.setup();
    renderComponent();

    const element = await screen.findByRole('radio', { name: /upload/i });

    await user.click(element);

    expect(element).toBeChecked();
    expect(
      screen.getByText('You can upload a Compose file from your computer.')
    ).toBeVisible();
  });

  it('should switch to git method', async () => {
    const user = userEvent.setup();
    renderComponent();

    const element = await screen.findByRole('radio', {
      name: /repository/i,
    });
    await user.click(element);

    expect(element).toBeChecked();

    expect(
      await screen.findByRole('textbox', { name: /repository url/i })
    ).toBeVisible();
  });

  it('should switch to template method', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Mock custom templates
    server.use(
      http.get('/api/custom_templates', () =>
        HttpResponse.json([
          { Id: 1, Title: 'Template 1', Type: 1 },
          { Id: 2, Title: 'Template 2', Type: 1 },
        ])
      )
    );
    const element = await screen.findByRole('radio', {
      name: /custom template/i,
    });
    await user.click(element);
    expect(element).toBeChecked();

    expect(
      await screen.findByRole('combobox', { name: 'Template' })
    ).toBeVisible();
  });

  it('should show validation error for empty name', async () => {
    renderComponent();

    expect(await screen.findByText(/name is required/i)).toBeVisible();
  });

  it('should show validation error for empty editor content', async () => {
    renderComponent();

    expect(
      await screen.findByText(/stack file content is required/i)
    ).toBeVisible();
  });

  it('should submit editor form successfully', async () => {
    let requestBody: unknown;
    server.use(
      http.post('/api/stacks/create/standalone/string', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({
          Id: 123,
          Name: 'test-stack',
          ResourceControl: { Id: 1 },
        });
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent();

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'test-stack');

    // TODO: find a way to use getByRole
    const editor = screen.getByTestId('stack-creation-editor');

    await user.type(
      editor,
      'version: "3"\nservices:\n  web:\n    image: nginx'
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    const button = screen.getByRole('button', { name: /deploy the stack/i });
    expect(button).toBeEnabled();

    await user.click(button);

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        name: 'test-stack',
        stackFileContent: expect.stringContaining('version: "3"'),
      });
    });
  });

  // TODO: update to happydom fixes the issues, but fails other tests
  it.skip('some issue with file upload prevents this from working: should submit upload form with file', async () => {
    let requestPayload: FormData | undefined;
    server.use(
      http.post('/api/stacks/create/standalone/file', async ({ request }) => {
        requestPayload = (await request.formData()) as FormData;
        return HttpResponse.json({
          Id: 123,
          Name: 'test-stack',
          ResourceControl: { Id: 1 },
        });
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent();

    await user.click(await screen.findByRole('radio', { name: /upload/i }));

    // Fill in name
    const nameInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'test-stack');

    // Upload file
    const file = new File(
      ['version: "3"\nservices:\n  web:\n    image: nginx'],
      'docker-compose.yml',
      {
        type: 'application/x-yaml',
      }
    );
    const fileInput = screen.getByTestId('stack-creation-file-upload-input');
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /deploy the stack/i,
    });

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(requestPayload).toBeDefined();
      expect(requestPayload?.get('Name')).toBe('test-stack');
      expect(requestPayload?.get('file')).toBeInstanceOf(File);
    });
  });

  it('should submit git form successfully', async () => {
    let requestBody: unknown;
    server.use(
      http.post(
        '/api/stacks/create/standalone/repository',
        async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            Id: 123,
            Name: 'test-stack',
            ResourceControl: { Id: 1 },
          });
        }
      ),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      ),
      http.post('/api/gitops/repo/refs', () => HttpResponse.json([])),
      http.post('/api/gitops/repo/files/search', () =>
        HttpResponse.json(['docker-compose.yml'])
      )
    );

    const user = userEvent.setup();
    renderComponent();

    // Switch to git
    await user.click(await screen.findByRole('radio', { name: /repository/i }));

    // Fill in form
    const nameInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'test-stack');

    const urlField = await screen.findByRole('textbox', {
      name: /repository url/i,
    });
    await user.clear(urlField);
    await user.type(urlField, 'https://github.com/test/repo');

    const refsField = screen.getByLabelText(/reference/i);
    await user.clear(refsField);
    await user.type(refsField, 'refs/heads/main');

    const configFileField = screen.getByLabelText(/compose path/i);
    await user.clear(configFileField);
    await user.type(configFileField, 'docker-compose.yml');

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /deploy the stack/i,
    });

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(requestBody).toMatchObject(
        expect.objectContaining({
          name: 'test-stack',
          repositoryUrl: 'https://github.com/test/repo',
          repositoryReferenceName: 'refs/heads/main',
          composeFile: 'docker-compose.yml',
        })
      );
    });
  });

  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mutationError = vi.fn();
    const errorMessage = 'test - failed to create stack';
    server.use(
      http.post('/api/stacks/create/standalone/string', () =>
        HttpResponse.json({ message: errorMessage }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderComponent({ onMutationError: mutationError });

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'test-stack');

    const editor = screen.getByTestId('stack-creation-editor');

    await user.type(
      editor,
      'version: "3"\nservices:\n  web:\n    image: nginx'
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /deploy the stack/i,
    });

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mutationError).toHaveBeenCalledOnce();
      expect(mutationError.mock.calls[0][0].toString()).toBe(
        new Error(errorMessage).toString()
      );
    });

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
