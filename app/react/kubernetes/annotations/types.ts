import { FormikErrors } from 'formik';

export interface Annotation {
  Key: string;
  Value: string;
  ID: string;
}

export type AnnotationsPayload = Record<string, string>;

export type AnnotationErrors =
  | string
  | string[]
  | FormikErrors<Annotation>[]
  | undefined;
