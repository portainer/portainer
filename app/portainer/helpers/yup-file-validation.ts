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

export function withFileType(
  fileValidation: FileSchema,
  fileTypes: File['type'][]
) {
  return fileValidation.test(
    'file-type',
    'Selected file has unsupported format.',
    validateFileType
  );

  function validateFileType(file?: File) {
    if (!file) {
      return true;
    }

    return fileTypes.includes(file.type);
  }
}
