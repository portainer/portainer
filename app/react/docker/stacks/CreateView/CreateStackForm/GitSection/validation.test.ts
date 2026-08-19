import { GitFormValues } from './types';
import { getGitValidationSchema } from './validation';

describe('Git validation', () => {
  it('should pass validation with valid git form values', async () => {
    const schema = getGitValidationSchema();

    const validData: GitFormValues = {
      SourceId: 1,
      RepositoryReferenceName: 'refs/heads/main',
      ComposeFilePathInRepository: 'docker-compose.yml',
      AdditionalFiles: [],
      AutoUpdate: undefined,
      SupportRelativePath: false,
      FilesystemPath: '',
    };

    await expect(schema.validate(validData)).resolves.toBeDefined();
  });

  it('should fail validation when SourceId is missing', async () => {
    const schema = getGitValidationSchema();

    const invalidData = {
      RepositoryReferenceName: 'refs/heads/main',
      ComposeFilePathInRepository: 'docker-compose.yml',
    };

    await expect(schema.validate(invalidData)).rejects.toThrow();
  });
});
