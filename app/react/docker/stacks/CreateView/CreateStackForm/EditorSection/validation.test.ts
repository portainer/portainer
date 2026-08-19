import { EditorFormValues } from './types';
import { getEditorValidationSchema } from './validation';

describe('Editor validation', () => {
  const containerNames = ['existing-container-1', 'existing-container-2'];

  it('should pass validation with valid editor form values', async () => {
    const schema = getEditorValidationSchema({
      containerNames,
    });

    const validData: EditorFormValues = {
      fileContent: 'version: "3"\nservices:\n  web:\n    image: nginx',
    };

    await expect(schema.validate(validData)).resolves.toBeDefined();
  });

  it('should fail validation when fileContent is missing', async () => {
    const schema = getEditorValidationSchema({
      containerNames,
    });

    const invalidData: Partial<EditorFormValues> = {
      fileContent: undefined,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });

  it('should fail validation when fileContent is empty', async () => {
    const schema = getEditorValidationSchema({
      containerNames,
    });

    const invalidData: EditorFormValues = {
      fileContent: '',
    };

    await expect(schema.validate(invalidData)).rejects.toThrow(
      'Stack file content is required'
    );
  });

  it('should fail validation with invalid YAML', async () => {
    const schema = getEditorValidationSchema({
      containerNames,
    });

    const invalidData: EditorFormValues = {
      fileContent: 'invalid: yaml: syntax:',
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });

  it('should fail validation when container name conflicts with existing containers', async () => {
    const schema = getEditorValidationSchema({
      containerNames,
    });

    const invalidData: EditorFormValues = {
      fileContent: `version: "3"
services:
  web:
    container_name: existing-container-1
    image: nginx`,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow(
      'already used by another container'
    );
  });
});
