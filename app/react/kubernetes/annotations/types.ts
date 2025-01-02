import { FormikErrors } from 'formik';

export interface Annotation {
  key: string;
  value: string;
  id: string;
}

export type AnnotationsPayload = Record<string, string>;

export type AnnotationErrors =
  | string
  | string[]
  | FormikErrors<Annotation>[]
  | undefined;
