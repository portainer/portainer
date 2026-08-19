import { defaultValues as acDefaultValues } from '@/react/portainer/access-control/utils';

import { FormValues } from './types';
import { getValidationSchema } from './validation';

describe('CreateStackForm validation schemas', () => {
  const containerNames = ['existing-container-1', 'existing-container-2'];
  const environmentId = 1;
  const isAdmin = true;

  it('should fail when method is upload but upload section is missing', async () => {
    const schema = getValidationSchema({
      isAdmin,
      environmentId,
      containerNames,
    });

    const invalidData: Partial<FormValues> = {
      method: 'upload',
      name: 'test-stack',
      env: [],
      accessControl: acDefaultValues(false, 1),
      enableWebhook: false,
      registries: [],
      upload: undefined,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });

  it('should fail when method is editor but editor section is missing', async () => {
    const schema = getValidationSchema({
      isAdmin,
      environmentId,
      containerNames,
    });

    const invalidData: Partial<FormValues> = {
      method: 'editor',
      name: 'test-stack',
      env: [],
      accessControl: acDefaultValues(false, 1),
      enableWebhook: false,
      registries: [],
      editor: undefined,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });

  it('should fail when method is repository but git section is missing', async () => {
    const schema = getValidationSchema({
      isAdmin,
      environmentId,
      containerNames,
    });

    const invalidData: Partial<FormValues> = {
      method: 'repository',
      name: 'test-stack',
      env: [],
      accessControl: acDefaultValues(false, 1),
      enableWebhook: false,
      registries: [],
      git: undefined,
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });
});
