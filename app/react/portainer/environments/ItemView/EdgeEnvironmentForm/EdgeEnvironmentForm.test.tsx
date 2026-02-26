import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { EnvironmentType } from '@/react/portainer/environments/types';

import { EdgeEnvironmentForm } from './EdgeEnvironmentForm';

// Factory function to create a fresh wrapped component for each test
function createWrappedForm() {
  return withTestRouter(
    withUserProvider(withTestQueryProvider(EdgeEnvironmentForm)),
    {
      route: '/endpoints/1',
      stateConfig: [
        {
          name: 'portainer.endpoints.endpoint',
          url: '/endpoints/:id',
        },
      ],
    }
  );
}

// Default mock handlers
function setupDefaultMocks() {
  server.use(
    // Settings endpoint (for AMT check and intervals)
    http.get('/api/settings', () =>
      HttpResponse.json({
        Edge: {
          PingInterval: 60,
          SnapshotInterval: 300,
          CommandInterval: 60,
        },
        EdgeAgentCheckinInterval: 5,
        openAMTConfiguration: {
          enabled: false,
        },
      })
    ),
    // Groups endpoint
    http.get('/api/endpoint_groups', () =>
      HttpResponse.json([
        { Id: 1, Name: 'Default' },
        { Id: 2, Name: 'Production' },
      ])
    ),
    // Tags endpoint
    http.get('/api/tags', () =>
      HttpResponse.json([
        { ID: 1, Name: 'tag1' },
        { ID: 2, Name: 'tag2' },
      ])
    ),
    // Name uniqueness check
    http.get('/api/endpoints', () =>
      HttpResponse.json({ value: [], totalCount: 0 })
    ),
    // Update endpoint
    http.put('/api/endpoints/:id', () => HttpResponse.json({})),
    // User endpoint for MetadataFieldset
    http.get('/api/users/me', () =>
      HttpResponse.json({
        Id: 1,
        Username: 'admin',
        Role: 1,
      })
    )
  );
}

describe('EdgeEnvironmentForm', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  describe('sync mode', () => {
    it('should render poll frequency field for sync mode environment', async () => {
      const environment = createMockEnvironment({
        Id: 1,
        Name: 'Test Edge Environment',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          SnapshotInterval: 0,
          CommandInterval: 0,
        },
      });

      const onSuccess = vi.fn();
      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Poll frequency')).toBeVisible();
      });

      // Async mode fields should not be present
      expect(screen.queryByText('Ping interval')).not.toBeInTheDocument();
      expect(screen.queryByText('Snapshot interval')).not.toBeInTheDocument();
      expect(screen.queryByText('Command interval')).not.toBeInTheDocument();
    });
  });

  describe('async mode', () => {
    it('should render async interval fields for async mode environment', async () => {
      const environment = createMockEnvironment({
        Id: 1,
        Name: 'Test Edge Async Environment',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        Edge: {
          AsyncMode: true,
          PingInterval: 60,
          SnapshotInterval: 300,
          CommandInterval: 60,
        },
      });

      const onSuccess = vi.fn();
      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByText('Ping interval')).toBeVisible();
      });

      expect(screen.getByText('Snapshot interval')).toBeVisible();
      expect(screen.getByText('Command interval')).toBeVisible();

      // Sync mode field should not be present
      expect(screen.queryByText('Poll frequency')).not.toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render name field with initial value', async () => {
      const environment = createMockEnvironment({
        Id: 1,
        Name: 'My Edge Env',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          SnapshotInterval: 0,
          CommandInterval: 0,
        },
      });

      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={vi.fn()} />);

      await waitFor(() => {
        const nameInput = screen.getByTestId('environmentCreate-nameInput');
        expect(nameInput).toHaveValue('My Edge Env');
      });
    });

    it('should render public URL field with initial value', async () => {
      const environment = createMockEnvironment({
        Id: 1,
        Name: 'Test Edge',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        PublicURL: 'https://edge.example.com',
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          SnapshotInterval: 0,
          CommandInterval: 0,
        },
      });

      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={vi.fn()} />);

      await waitFor(() => {
        const publicUrlInput = screen.getByTestId('public-url-input');
        expect(publicUrlInput).toHaveValue('https://edge.example.com');
      });
    });

    it('should render metadata section with group selector', async () => {
      const environment = createMockEnvironment({
        Id: 1,
        Name: 'Test Edge',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        GroupId: 1,
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          SnapshotInterval: 0,
          CommandInterval: 0,
        },
      });

      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Metadata')).toBeVisible();
      });

      expect(screen.getByTestId('environment-group-select')).toBeVisible();
    });
  });

  describe('form submission', () => {
    it('should enable submit button when form is dirty and valid', async () => {
      const environment = createMockEnvironment({
        Id: 5,
        Name: 'Original Name',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        PublicURL: 'https://original.example.com',
        GroupId: 1,
        TagIds: [1],
        EdgeCheckinInterval: 5,
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          SnapshotInterval: 0,
          CommandInterval: 0,
        },
        Gpus: [],
      });

      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={vi.fn()} />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('environmentCreate-nameInput')).toBeVisible();
      });

      // Button should be disabled initially (form is pristine)
      const submitButton = screen.getByRole('button', {
        name: /update environment/i,
      });
      expect(submitButton).toBeDisabled();

      // Change the name to make the form dirty
      const nameInput = screen.getByTestId('environmentCreate-nameInput');
      await userEvent.type(nameInput, ' v2');

      // Button should be enabled after changes
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('form actions', () => {
    it('should disable submit button when form is pristine', async () => {
      const environment = createMockEnvironment({
        Id: 1,
        Name: 'Test Edge',
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        Edge: {
          AsyncMode: false,
          PingInterval: 0,
          SnapshotInterval: 0,
          CommandInterval: 0,
        },
      });

      const WrappedForm = createWrappedForm();

      render(<WrappedForm environment={environment} onSuccess={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Configuration')).toBeVisible();
      });

      const submitButton = screen.getByRole('button', {
        name: /update environment/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });
});
