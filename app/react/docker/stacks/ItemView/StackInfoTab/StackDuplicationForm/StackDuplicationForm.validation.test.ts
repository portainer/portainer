import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import type { AnySchema } from 'yup';

import {
  getDuplicateValidationSchema,
  getMigrateValidationSchema,
  useValidation,
} from './StackDuplicationForm.validation';
import { FormSubmitValues } from './StackDuplicationForm.types';

describe('getDuplicateValidationSchema', () => {
  const schema = getDuplicateValidationSchema();

  describe('name validation', () => {
    it.each([
      {
        name: '',
        environmentId: 2,
        error: 'Stack name is required',
        scenario: 'should fail with empty name',
      },
      {
        name: 'mystack123',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with lowercase alphanumeric',
      },
      {
        name: 'my_stack',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with underscores',
      },
      {
        name: 'my-stack',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with hyphens',
      },
      {
        name: 'my_stack-123',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with underscores and hyphens',
      },
      {
        name: 'MyStack',
        environmentId: 2,
        error:
          "Stack name must consist of lower case alphanumeric characters, '_' or '-'",
        scenario: 'should fail with uppercase letters',
      },
      {
        name: 'my stack',
        environmentId: 2,
        error:
          "Stack name must consist of lower case alphanumeric characters, '_' or '-'",
        scenario: 'should fail with spaces',
      },
      {
        name: 'my@stack',
        environmentId: 2,
        error:
          "Stack name must consist of lower case alphanumeric characters, '_' or '-'",
        scenario: 'should fail with special characters',
      },
    ])('$scenario', async ({ name, environmentId, error }) => {
      const promise = schema.validate({ name, environmentId });
      if (error) {
        await expect(promise).rejects.toThrow(error);
      } else {
        await expect(promise).resolves.toBeTruthy();
      }
    });
  });

  describe('environmentId validation', () => {
    testEnvironmentIdValidation(schema);
  });
});

describe('getMigrateValidationSchema', () => {
  const currentStackName = 'test-stack';
  const currentEnvironmentId = 1;
  const schema = getMigrateValidationSchema(
    currentStackName,
    currentEnvironmentId
  );

  describe('name validation (optional)', () => {
    it.each([
      {
        name: '',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with empty string',
      },
      {
        name: undefined,
        environmentId: 2,
        error: '',
        scenario: 'should be valid with undefined',
      },
      {
        name: 'mystack',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with lowercase alphanumeric',
      },
      {
        name: 'my_stack-123',
        environmentId: 2,
        error: '',
        scenario: 'should be valid with underscores and hyphens',
      },
      {
        name: 'MyStack',
        environmentId: 2,
        error:
          "Stack name must consist of lower case alphanumeric characters, '_' or '-'",
        scenario: 'should fail with uppercase letters',
      },
      {
        name: 'my@stack',
        environmentId: 2,
        error:
          "Stack name must consist of lower case alphanumeric characters, '_' or '-'",
        scenario: 'should fail with special characters',
      },
    ])('$scenario', async ({ name, environmentId, error }) => {
      const promise = schema.validate({ name, environmentId });
      if (error) {
        await expect(promise).rejects.toThrow(error);
      } else {
        await expect(promise).resolves.toBeTruthy();
      }
    });
  });

  describe('environmentId validation', () => {
    testEnvironmentIdValidation(schema);
  });

  describe('rename validation (same environment)', () => {
    it.each([
      {
        name: currentStackName,
        environmentId: currentEnvironmentId,
        error: "Can't rename to the same name",
        scenario: 'should fail when renaming to same name',
      },
      {
        name: '',
        environmentId: currentEnvironmentId,
        error: 'Stack name is required when renaming',
        scenario: 'should fail when renaming with empty name',
      },
      {
        name: undefined,
        environmentId: currentEnvironmentId,
        error: 'Stack name is required when renaming',
        scenario: 'should fail when renaming with undefined name',
      },
      {
        name: 'new-stack-name',
        environmentId: currentEnvironmentId,
        error: '',
        scenario: 'should be valid when renaming to different name',
      },
    ])('$scenario', async ({ name, environmentId, error }) => {
      const promise = schema.validate({ name, environmentId });
      if (error) {
        await expect(promise).rejects.toThrow(error);
      } else {
        await expect(promise).resolves.toBeTruthy();
      }
    });
  });

  describe('migrate validation (different environment)', () => {
    it.each([
      {
        name: '',
        environmentId: 2,
        error: '',
        scenario: 'should be valid when migrating with empty name',
      },
      {
        name: undefined,
        environmentId: 2,
        error: '',
        scenario: 'should be valid when migrating with undefined name',
      },
      {
        name: currentStackName,
        environmentId: 2,
        error: '',
        scenario:
          'should be valid when migrating with same name to different environment',
      },
      {
        name: 'new-stack-name',
        environmentId: 2,
        error: '',
        scenario:
          'should be valid when migrating with different name to different environment',
      },
    ])('$scenario', async ({ name, environmentId, error }) => {
      const promise = schema.validate({ name, environmentId });
      if (error) {
        await expect(promise).rejects.toThrow(error);
      } else {
        await expect(promise).resolves.toBeTruthy();
      }
    });
  });
});

describe('useValidation', () => {
  const currentStackName = 'test-stack';
  const currentEnvironmentId = 1;

  it('should start with both migrate and duplicate as false', () => {
    const { result } = renderHook(() =>
      useValidation({
        values: {
          environmentId: undefined,
          newName: '',
          actionType: 'migrate',
        },
        currentStackName,
        currentEnvironmentId,
      })
    );

    expect(result.current.migrate).toBe(false);
    expect(result.current.duplicate).toBe(false);
  });

  describe('reactive updates', () => {
    it('should revalidate when environmentId changes', async () => {
      const { result, rerender } = renderHook(
        ({ values }: { values: FormSubmitValues }) =>
          useValidation({ values, currentStackName, currentEnvironmentId }),
        {
          initialProps: {
            values: {
              environmentId: undefined as number | undefined,
              newName: 'mystack',
              actionType: 'duplicate' as const,
            },
          },
        }
      );

      await waitFor(() => {
        expect(result.current.duplicate).toBe(false);
      });

      rerender({
        values: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        expect(result.current.duplicate).toBe(true);
      });
    });

    it('should revalidate when newName changes', async () => {
      const { result, rerender } = renderHook(
        ({ values }: { values: FormSubmitValues }) =>
          useValidation({ values, currentStackName, currentEnvironmentId }),
        {
          initialProps: {
            values: {
              environmentId: 2,
              newName: '',
              actionType: 'duplicate' as const,
            },
          },
        }
      );

      await waitFor(() => {
        expect(result.current.duplicate).toBe(false);
      });

      rerender({
        values: {
          environmentId: 2,
          newName: 'mystack',
          actionType: 'duplicate',
        },
      });

      await waitFor(() => {
        expect(result.current.duplicate).toBe(true);
      });
    });
  });
});

function testEnvironmentIdValidation(schema: AnySchema) {
  it('should require environmentId', async () => {
    await expect(
      schema.validate({ name: 'mystack', environmentId: undefined })
    ).rejects.toThrow('Target environment must be selected');
  });

  it('should accept valid environmentId', async () => {
    await expect(
      schema.validate({ name: 'mystack', environmentId: 2 })
    ).resolves.toBeTruthy();
  });
}
