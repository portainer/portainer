import { v4 as uuidv4 } from 'uuid';
import { KubernetesPortainerApplicationNote } from '../models/application/models';
import { KubernetesSystem_AnnotationsToSkip } from '../models/history/models';

export function KubernetesFormValueAnnotation() {
  return {
    ID: '',
    Key: '',
    Value: '',
  };
}

class KubernetesAnnotationsUtils {
  static apiToFormValueAnnotations(annotations) {
    const res = [];
    if (annotations) {
      Object.keys(annotations).forEach((k) => {
        if (!KubernetesSystem_AnnotationsToSkip[k] && k !== KubernetesPortainerApplicationNote) {
          const annotation = new KubernetesFormValueAnnotation();
          annotation.Key = k;
          annotation.Value = annotations[k];
          annotation.ID = uuidv4();

          res.push(annotation);
        }
      });
    }
    return res;
  }

  /**
   * Validates annotations and returns an array of errors in the format closely matching the FormikError object.
   * @param annotations - An array of annotations to be validated.
   * @returns An array of annotation errors or undefined to closely match a FormikError object.
   */
  static validateAnnotations(annotations) {
    const duplicatedAnnotations = [];
    const re = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
    const annotationsErrors =
      annotations &&
      annotations.reduce((errors, a) => {
        const error = {};
        if (!a.Key) {
          error.Key = 'Key is required.';
        } else if (duplicatedAnnotations.includes(a.Key)) {
          error.Key = 'Key is a duplicate of an existing one.';
        } else {
          const key = a.Key.split('/');
          if (key.length > 2) {
            error.Key = 'Two segments are allowed, separated by a slash (/): a prefix (optional) and a name.';
          } else if (key.length === 2) {
            if (key[0].length > 253) {
              error.Key = "Prefix (before the slash) can't exceed 253 characters.";
            } else if (key[1].length > 63) {
              error.Key = "Name (after the slash) can't exceed 63 characters.";
            } else if (!re.test(key[1])) {
              error.Key = 'Start and end with alphanumeric characters only, limiting characters in between to dashes, underscores, and alphanumerics.';
            }
          } else if (key.length === 1) {
            if (key[0].length > 63) {
              error.Key = "Name (the segment after a slash (/), or only segment if no slash) can't exceed 63 characters.";
            } else if (!re.test(key[0])) {
              error.Key = 'Start and end with alphanumeric characters only, limiting characters in between to dashes, underscores, and alphanumerics.';
            }
          }
          duplicatedAnnotations.push(a.Key);
        }
        if (!a.Value) {
          error.Value = 'Value is required.';
        }
        errors.push(Object.keys(error).length ? error : undefined);
        return errors;
      }, []);

    // if all items are undefined, return undefined
    if (annotationsErrors && annotationsErrors.every((e) => !e)) {
      return;
    }

    return annotationsErrors;
  }
}

export default KubernetesAnnotationsUtils;
