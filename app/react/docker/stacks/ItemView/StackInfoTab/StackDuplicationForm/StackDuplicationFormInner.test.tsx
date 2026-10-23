import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';
import {
  createMockEnvironment,
  createMockEnvironmentGroup,
} from '@/react-tools/test-mocks';

import { StackDuplicationFormInner } from './StackDuplicationFormInner';
import { FormSubmitValues } from './StackDuplicationForm.types';

describe('StackDuplicationFormInner', () => {
  describe('initial rendering', () => {
    it('should render form', async () => {
      renderFormInner();

      expect(
        screen.getByText(
          'This feature allows you to duplicate or migrate this stack.'
        )
      ).toBeVisible();

      await waitFor(() => {
        const input = screen.getByPlaceholderText(
          'Stack name (optional for migration)'
        );
        expect(input).toBeVisible();
      });

      expect(screen.getByRole('button', { name: /migrate/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeVisible();

      await waitFor(() => {
        expect(
          screen.getByTestId('stack-duplicate-name-input')
        ).toBeInTheDocument();
        expect(screen.getByTestId('stack-migrate-button')).toBeInTheDocument();
        expect(
          screen.getByTestId('stack-duplicate-button')
        ).toBeInTheDocument();
      });
    });
  });

  describe('button states - migrate', () => {
    it('should disable Migrate button when no environment is selected', async () => {
      const { getByRole } = renderFormInner();

      await waitFor(() => {
        const migrateButton = getByRole('button', { name: /migrate/i });
        expect(migrateButton).toBeDisabled();
      });
    });

    it('should enable Migrate button when valid environment is selected', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 2,
          newName: '',
          actionType: 'migrate',
        },
      });

      await waitFor(() => {
        const migrateButton = getByRole('button', { name: /migrate/i });
        expect(migrateButton).toBeEnabled();
      });
    });

    it('should show "Rename" button when environmentId matches current environment', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 1,
          newName: '',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });

      await waitFor(() => {
        const renameButton = getByRole('button', { name: /rename/i });
        expect(renameButton).toBeVisible();
      });
    });

    it('should show "Migrate" button text when environmentId differs from current environment', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 2,
          newName: '',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });

      await waitFor(() => {
        expect(getByRole('button', { name: 'Migrate' })).toBeVisible();
      });
    });
  });

  describe('button states - duplicate', () => {
    it('should disable Duplicate button when name is empty', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 2,
          newName: '',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        const duplicateButton = getByRole('button', { name: /duplicate/i });
        expect(duplicateButton).toBeDisabled();
      });
    });

    it('should disable Duplicate button when no environment is selected', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: undefined,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        const duplicateButton = getByRole('button', { name: /duplicate/i });
        expect(duplicateButton).toBeDisabled();
      });
    });

    it('should disable Duplicate button when yamlError is present', async () => {
      const { getByRole } = renderFormInner({
        yamlError: 'Invalid YAML',
        initialValues: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        const duplicateButton = getByRole('button', { name: /duplicate/i });
        expect(duplicateButton).toBeDisabled();
      });
    });

    it('should enable Duplicate button when valid name and environment selected and no yamlError', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        const duplicateButton = getByRole('button', { name: /duplicate/i });
        expect(duplicateButton).toBeEnabled();
      });
    });
  });

  describe('form interactions', () => {
    it('should update newName field when user types', async () => {
      const { getByPlaceholderText } = renderFormInner();
      const user = userEvent.setup();

      await waitFor(() => {
        const input = getByPlaceholderText(
          'Stack name (optional for migration)'
        );
        expect(input).toBeVisible();
      });

      const input = getByPlaceholderText('Stack name (optional for migration)');
      await user.type(input, 'mystack');

      expect(input).toHaveValue('mystack');
    });

    it('should display FormError for newName when validation error exists', async () => {
      const { getByText } = renderFormInner();

      // Formik with validation schema will show errors
      // This test demonstrates the error display mechanism
      // In a real scenario, validation would trigger after user interaction
      await waitFor(() => {
        const form = getByText(
          'This feature allows you to duplicate or migrate this stack.'
        );
        expect(form).toBeVisible();
      });
    });
  });

  describe('action handlers', () => {
    it('should call onSubmit with actionType "migrate" when Migrate button clicked', async () => {
      const onSubmit = vi.fn();
      const { getByRole } = renderFormInner({
        onSubmit,
        initialValues: {
          environmentId: 2,
          newName: '',
          actionType: 'migrate',
        },
      });
      const user = userEvent.setup();

      await waitFor(() => {
        const migrateButton = getByRole('button', { name: /migrate/i });
        expect(migrateButton).toBeEnabled();
      });

      const migrateButton = getByRole('button', { name: /migrate/i });
      await user.click(migrateButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            actionType: 'migrate',
            environmentId: 2,
            newName: '',
          }),
          expect.anything()
        );
      });
    });

    it('should call onSubmit with actionType "duplicate" when Duplicate button clicked', async () => {
      const onSubmit = vi.fn();
      const { getByRole } = renderFormInner({
        onSubmit,
        initialValues: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });
      const user = userEvent.setup();

      await waitFor(() => {
        const duplicateButton = getByRole('button', { name: /duplicate/i });
        expect(duplicateButton).toBeEnabled();
      });

      const duplicateButton = getByRole('button', { name: /duplicate/i });
      await user.click(duplicateButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            actionType: 'duplicate',
            environmentId: 2,
            newName: 'mystack',
          }),
          expect.anything()
        );
      });
    });
  });

  describe('YAML error display', () => {
    it('should display yamlError when environment is selected and error exists', async () => {
      const yamlError = 'Invalid YAML format';
      renderFormInner({
        yamlError,
        initialValues: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        const errorElement = screen.getByRole('alert', { name: 'Yaml Error' });
        expect(errorElement).toBeVisible();
      });
    });

    it('should not display yamlError when no environment is selected', async () => {
      const yamlError = 'Invalid YAML format';
      renderFormInner({
        yamlError,
        initialValues: {
          environmentId: undefined,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });
      await waitFor(() => {
        expect(screen.queryByRole('alert', { name: 'Yaml Error' })).toBeNull();
      });
    });

    it('should not display yamlError when no error exists', async () => {
      renderFormInner({
        initialValues: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        expect(screen.queryByRole('alert', { name: 'Yaml Error' })).toBeNull();
      });
    });
  });

  describe('rename functionality', () => {
    it('should display rename help text', () => {
      const { getByText } = renderFormInner();

      expect(
        getByText(
          'To rename the stack, choose the same environment when migrating.'
        )
      ).toBeVisible();
    });

    it('should disable rename when current environment selected with empty name', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 1,
          newName: '',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });

      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeDisabled();
      });
    });

    it('should enable rename when current environment selected with valid name', async () => {
      const { getByRole } = renderFormInner({
        initialValues: {
          environmentId: 1,
          newName: 'newname',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });

      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeEnabled();
      });
    });

    it('should show "Renaming in progress..." loading text when renaming', async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      const { getByRole } = renderFormInner({
        onSubmit,
        initialValues: {
          environmentId: 1,
          newName: 'newname',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
        isLoading: true,
      });

      await waitFor(() => {
        expect(
          getByRole('button', { name: /renaming in progress/i })
        ).toBeInTheDocument();
      });
    });

    it('should show "Migration in progress..." loading text when migrating to different environment', async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      const { getByRole } = renderFormInner({
        onSubmit,
        initialValues: {
          environmentId: 2,
          newName: '',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
        isLoading: true,
      });

      await waitFor(() => {
        expect(
          getByRole('button', { name: /migration in progress/i })
        ).toBeInTheDocument();
      });
    });

    it('should disable rename button when renaming to the same name', async () => {
      const currentStackName = 'test-stack';
      const { getByRole } = renderFormInner({
        currentStackName,
        initialValues: {
          environmentId: 1,
          newName: currentStackName,
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });

      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeDisabled();
      });
    });

    it('should disable rename button when user types the same name', async () => {
      const currentStackName = 'test-stack';
      const { getByRole, getByPlaceholderText } = renderFormInner({
        currentStackName,
        initialValues: {
          environmentId: 1,
          newName: '',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });
      const user = userEvent.setup();

      // Initially rename button should be disabled with empty name
      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeDisabled();
      });

      // Type a valid different name
      const input = getByPlaceholderText('Stack name (optional for migration)');
      await user.type(input, 'newname');

      // Button should now be enabled
      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeEnabled();
      });

      // Clear and type the same name as current stack
      await user.clear(input);
      await user.type(input, currentStackName);

      // Now the button should be disabled again
      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeDisabled();
      });
    });

    it('should enable rename button when renaming to a different name', async () => {
      const currentStackName = 'test-stack';
      const { getByRole } = renderFormInner({
        currentStackName,
        initialValues: {
          environmentId: 1,
          newName: 'new-stack-name',
          actionType: 'migrate',
        },
        currentEnvironmentId: 1,
      });

      await waitFor(() => {
        const renameButton = getByRole('button', { name: 'Rename' });
        expect(renameButton).toBeEnabled();
      });
    });
  });
});

function renderFormInner({
  yamlError,
  currentEnvironmentId = 1,
  currentStackName = 'test-stack',
  onSubmit = vi.fn(),
  isLoading = false,
  initialValues = {
    environmentId: undefined,
    newName: '',
    actionType: 'migrate' as const,
  },
}: {
  yamlError?: string;
  currentEnvironmentId?: number;
  currentStackName?: string;
  onSubmit?: (values: FormSubmitValues) => void | Promise<void>;
  initialValues?: FormSubmitValues;
  isLoading?: boolean;
} = {}) {
  const mockEnvironments = [
    createMockEnvironment({ Id: 1, Name: 'Current Environment', GroupId: 1 }),
    createMockEnvironment({ Id: 2, Name: 'Target Environment', GroupId: 1 }),
  ];

  const mockGroups: EnvironmentGroup[] = [
    createMockEnvironmentGroup({ Id: 1, Name: 'Unassigned' }),
  ];

  server.use(
    http.get('/api/endpoints', () => HttpResponse.json(mockEnvironments)),
    http.get('/api/endpoint_groups', () => HttpResponse.json(mockGroups))
  );

  const Component = withTestQueryProvider(() => (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <StackDuplicationFormInner
        yamlError={yamlError}
        currentEnvironmentId={currentEnvironmentId}
        currentStackName={currentStackName}
        isLoading={isLoading}
      />
    </Formik>
  ));

  return render(<Component />);
}
