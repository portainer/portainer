import { SchemaOf, array, object, string } from 'yup';

import { buildUniquenessTest } from '@@/form-components/validate-unique';

import { Annotation } from './types';

const re = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;

export const annotationsSchema: SchemaOf<Annotation[]> = array(
  getAnnotationValidation()
).test(
  'unique',
  'Duplicate keys are not allowed.',
  buildUniquenessTest(() => 'Duplicate keys are not allowed.', 'key')
);

function getAnnotationValidation(): SchemaOf<Annotation> {
  return object({
    key: string()
      .required('Key is required.')
      .test('is-valid', (value, { createError }) => {
        if (!value) {
          return true;
        }
        const keySegments = value.split('/');
        if (keySegments.length > 2) {
          return createError({
            message:
              'Two segments are allowed, separated by a slash (/): a prefix (optional) and a name.',
          });
        }
        if (keySegments.length === 2) {
          if (keySegments[0].length > 253) {
            return createError({
              message: "Prefix (before the slash) can't exceed 253 characters.",
            });
          }
          if (keySegments[1].length > 63) {
            return createError({
              message: "Name (after the slash) can't exceed 63 characters.",
            });
          }
          if (!re.test(keySegments[1])) {
            return createError({
              message:
                'Start and end with alphanumeric characters only, limiting characters in between to dashes, underscores, and alphanumerics.',
            });
          }
        } else if (keySegments.length === 1) {
          if (keySegments[0].length > 63) {
            return createError({
              message:
                "Name (the segment after a slash (/), or only segment if no slash) can't exceed 63 characters.",
            });
          }
          if (!re.test(keySegments[0])) {
            return createError({
              message:
                'Start and end with alphanumeric characters only, limiting characters in between to dashes, underscores, and alphanumerics.',
            });
          }
        }
        return true;
      }),
    value: string().required('Value is required.'),
    id: string().required('ID is required.'),
  });
}
