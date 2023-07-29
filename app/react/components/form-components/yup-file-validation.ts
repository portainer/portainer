import { mixed } from 'yup';
import { MixedSchema } from 'yup/lib/mixed';

type FileSchema = MixedSchema<File | undefined>;

export function file(): FileSchema {
  return mixed();
}

export function withFileSize(fileValidation: FileSchema, maxSize: number) {
  return fileValidation.test(
    'fileSize',
    'Selected file is too big.',
    validateFileSize
  );

  function validateFileSize(file?: File) {
    if (!file) {
      return true;
    }

    return file.size <= maxSize;
  }
}

export function withFileExtension(
  fileValidation: FileSchema,
  allowedExtensions: string[]
) {
  return fileValidation.test(
    'fileExtension',
    'Selected file has invalid extension.',
    validateFileExtension
  );

  function validateFileExtension(file?: File) {
    if (!file) {
      return true;
    }

    const fileExtension = file.name.split('.').pop();

    return allowedExtensions.includes(fileExtension || '');
  }
}
