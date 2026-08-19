import { TemplateFormValues } from './types';
import { getTemplateValidationSchema } from './validation';

describe('Template validation', () => {
  const containerNames = ['existing-container-1', 'existing-container-2'];
  it('should pass validation with valid template form values', async () => {
    const schema = getTemplateValidationSchema({
      containerNames,
    });

    const validData: TemplateFormValues = {
      selectedId: 1,
      variables: [],
      fileContent: 'version: "3"\nservices:\n  web:\n    image: nginx',
    };

    await expect(schema.validate(validData)).resolves.toBeDefined();
  });

  it('should fail validation when template ID is undefined', async () => {
    const schema = getTemplateValidationSchema({
      containerNames,
    });

    const invalidData: Partial<TemplateFormValues> = {
      selectedId: undefined,
      variables: [],
      fileContent: 'version: "3"\nservices:\n  web:\n    image: nginx',
    };

    await expect(schema.validate(invalidData)).rejects.toThrow(
      'Template is required'
    );
  });

  it('should validate rendered template content YAML', async () => {
    const schema = getTemplateValidationSchema({
      containerNames,
    });

    const invalidData: TemplateFormValues = {
      selectedId: 1,
      variables: [],
      fileContent: 'invalid: yaml: syntax:',
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });
});
