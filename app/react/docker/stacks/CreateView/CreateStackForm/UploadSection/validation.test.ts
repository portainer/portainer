import { UploadFormValues } from './types';
import { getUploadValidationSchema } from './validation';

function createMockFile(content: string, filename: string): File {
  const blob = new Blob([content], { type: 'application/x-yaml' });
  const file = new File([blob], filename, { type: 'application/x-yaml' });

  // Add text() method if not available (for jsdom environment)
  if (!file.text) {
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(content),
    });
  }

  return file;
}

describe('Upload validation', () => {
  const containerNames = ['existing-container-1', 'existing-container-2'];
  it('should pass validation with valid upload form values', async () => {
    const schema = getUploadValidationSchema({
      containerNames,
    });

    const validData: UploadFormValues = {
      file: createMockFile(
        'version: "3"\nservices:\n  web:\n    image: nginx',
        'test.yml'
      ),
    };

    await expect(schema.validate(validData)).resolves.toBeDefined();
  });

  it('should fail validation when file is null', async () => {
    const schema = getUploadValidationSchema({
      containerNames,
    });

    const invalidData: UploadFormValues = {
      file: null,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow(
      'Stack file is required'
    );
  });

  it('should fail validation with invalid YAML in uploaded file', async () => {
    const schema = getUploadValidationSchema({
      containerNames,
    });

    const invalidData: UploadFormValues = {
      file: createMockFile('invalid: yaml: syntax:', 'test.yml'),
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });

  it('should fail validation when uploaded file contains container name conflicts', async () => {
    const schema = getUploadValidationSchema({
      containerNames,
    });

    const invalidData: UploadFormValues = {
      file: createMockFile(
        `version: "3"
services:
  web:
    container_name: existing-container-1
    image: nginx`,
        'test.yml'
      ),
    };

    await expect(schema.validate(invalidData)).rejects.toThrow(
      'already used by another container'
    );
  });

  it('should fail validation when file cannot be read', async () => {
    const schema = getUploadValidationSchema({
      containerNames,
    });

    // Create a mock file that throws an error when text() is called
    const mockFile = {
      text: () => Promise.reject(new Error('Read error')),
    } as File;

    const invalidData: UploadFormValues = {
      file: mockFile,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow(
      'Unable to read file'
    );
  });
});
