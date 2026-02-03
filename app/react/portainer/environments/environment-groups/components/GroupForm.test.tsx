import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';

import { GroupForm, GroupFormValues } from './GroupForm';

vi.mock('@/react/hooks/useCanExit', () => ({
  useCanExit: vi.fn(),
}));

function renderGroupForm({
  initialValues = {
    name: '',
    description: '',
    tagIds: [],
    associatedEnvironments: [],
  },
  onSubmit = vi.fn(),
  submitLabel = 'Create',
  submitLoadingLabel = 'Creating...',
  groupId,
}: {
  initialValues?: GroupFormValues;
  onSubmit?: (values: GroupFormValues) => Promise<void>;
  submitLabel?: string;
  submitLoadingLabel?: string;
  groupId?: number;
} = {}) {
  // Mock tag endpoints
  server.use(
    http.get('/api/tags', () =>
      HttpResponse.json([
        { ID: 1, Name: 'production' },
        { ID: 2, Name: 'staging' },
      ])
    ),
    // Mock environments list for AssociatedEnvironmentsSelector
    http.get('/api/endpoints', () =>
      HttpResponse.json([], {
        headers: {
          'x-total-count': '0',
          'x-total-available': '0',
        },
      })
    )
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(
      withUserProvider(() => (
        <GroupForm
          initialValues={initialValues}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          submitLoadingLabel={submitLoadingLabel}
          groupId={groupId}
        />
      ))
    )
  );

  return {
    ...render(<Wrapped />),
    onSubmit,
  };
}

describe('GroupForm', () => {
  describe('Form rendering', () => {
    it('should render name and description fields', async () => {
      renderGroupForm();

      expect(await screen.findByLabelText(/Name/i)).toBeVisible();
      expect(screen.getByLabelText(/Description/i)).toBeVisible();
    });

    it('should render the submit button with correct label', async () => {
      renderGroupForm({ submitLabel: 'Create' });

      expect(
        await screen.findByRole('button', { name: /Create/i })
      ).toBeVisible();
    });

    it('should show Associated environments section when groupId is provided (not unassigned group)', async () => {
      renderGroupForm({ groupId: 2 });

      // Wait for form to render
      await screen.findByLabelText(/Name/i);

      // Check for section title using findByRole
      expect(
        await screen.findByRole('heading', { name: /Associated environments/i })
      ).toBeVisible();
    });

    it('should show Unassociated environments section when groupId is 1 (unassigned group)', async () => {
      renderGroupForm({ groupId: 1 });

      // Wait for form to render
      await screen.findByLabelText(/Name/i);

      // Check for section title using findByRole
      expect(
        await screen.findByRole('heading', {
          name: /Unassociated environments/i,
        })
      ).toBeVisible();

      // Should NOT show "Associated environments" section (exact match to exclude "Unassociated")
      const associatedElements = screen.queryAllByText(
        /^Associated environments$/i
      );
      expect(associatedElements).toHaveLength(0);
    });

    it('should show Associated environments section in create mode (no groupId)', async () => {
      renderGroupForm();

      // Wait for form to render
      await screen.findByLabelText(/Name/i);

      // Check for section title using findByRole
      expect(
        await screen.findByRole('heading', { name: /Associated environments/i })
      ).toBeVisible();
    });
  });

  describe('Form validation', () => {
    it('should show validation error when name is empty', async () => {
      renderGroupForm();

      // The form validates on mount
      await waitFor(() => {
        expect(
          screen.getByRole('alert', { name: /Name is required/i })
        ).toBeVisible();
      });
    });

    it('should disable submit button when form is invalid', async () => {
      renderGroupForm();

      const submitButton = await screen.findByRole('button', {
        name: /Create/i,
      });

      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when form is not dirty', async () => {
      renderGroupForm({
        initialValues: {
          name: 'existing-group',
          description: '',
          tagIds: [],
          associatedEnvironments: [],
        },
      });

      const submitButton = await screen.findByRole('button', {
        name: /Create/i,
      });

      // Form is valid but not dirty, so should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid and dirty', async () => {
      const user = userEvent.setup();
      renderGroupForm();

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'my-new-group');

      const submitButton = screen.getByRole('button', { name: /Create/i });

      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });

    it('should clear validation error when name is provided', async () => {
      const user = userEvent.setup();
      renderGroupForm();

      // Wait for initial validation error
      await waitFor(() => {
        expect(
          screen.getByRole('alert', { name: /Name is required/i })
        ).toBeVisible();
      });

      // Use data-cy attribute to find the specific name input
      const nameInput = screen.getByTestId('group-name-input');
      await user.type(nameInput, 'my-group');

      await waitFor(() => {
        expect(
          screen.queryByRole('alert', { name: /Name is required/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with form values when submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderGroupForm({ onSubmit });

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      const descriptionInput = screen.getByLabelText(/Description/i);
      await user.type(descriptionInput, 'Test description');

      const submitButton = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test-group',
            description: 'Test description',
            tagIds: [],
            associatedEnvironments: [],
          }),
          expect.anything()
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      // Create a promise that we can control
      let resolveSubmit: () => void;
      const onSubmit = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve;
          })
      );

      renderGroupForm({
        onSubmit,
        submitLabel: 'Create',
        submitLoadingLabel: 'Creating...',
      });

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      const submitButton = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Creating.../i })
        ).toBeVisible();
      });

      // Resolve the submission
      resolveSubmit!();
    });
  });

  describe('Form field placeholders', () => {
    it('should show correct placeholder for name field', async () => {
      renderGroupForm();

      const nameInput = await screen.findByPlaceholderText(/e\.g\. my-group/i);
      expect(nameInput).toBeVisible();
    });

    it('should show correct placeholder for description field', async () => {
      renderGroupForm();

      const descriptionInput = await screen.findByPlaceholderText(
        /e\.g\. production environments/i
      );
      expect(descriptionInput).toBeVisible();
    });
  });

  describe('Initial values', () => {
    it('should populate form with initial values', async () => {
      renderGroupForm({
        initialValues: {
          name: 'pre-filled-name',
          description: 'pre-filled-description',
          tagIds: [],
          associatedEnvironments: [],
        },
      });

      const nameInput = await screen.findByLabelText(/Name/i);
      expect(nameInput).toHaveValue('pre-filled-name');

      const descriptionInput = screen.getByLabelText(/Description/i);
      expect(descriptionInput).toHaveValue('pre-filled-description');
    });
  });
});
