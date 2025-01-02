import { ChangeEvent } from 'react';
import { Trash2 } from 'lucide-react';

import { FormError } from '@@/form-components/FormError';
import { Button } from '@@/buttons';
import { isArrayErrorType } from '@@/form-components/formikUtils';

import { Annotation, AnnotationErrors } from './types';

interface Props {
  annotations: Annotation[];
  handleAnnotationChange: (
    index: number,
    key: 'key' | 'value',
    val: string
  ) => void;
  removeAnnotation: (index: number) => void;
  errors: AnnotationErrors;
  placeholder: string[];
}

export function AnnotationsForm({
  annotations,
  handleAnnotationChange,
  removeAnnotation,
  errors,
  placeholder,
}: Props) {
  const annotationErrors = isArrayErrorType<Annotation>(errors)
    ? errors
    : undefined;

  return (
    <>
      {annotations.map((annotation, i) => (
        <div className="row" key={annotation.id}>
          <div className="form-group col-sm-4 !m-0 !pl-0">
            <div className="input-group input-group-sm">
              <span className="input-group-addon required">Key</span>
              <input
                name={`annotation_key_${i}`}
                type="text"
                className="form-control form-control-sm"
                placeholder={placeholder[0]}
                defaultValue={annotation.key}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleAnnotationChange(i, 'key', e.target.value)
                }
                data-cy={`annotation-key-${i}`}
              />
            </div>
            {annotationErrors?.[i]?.key && (
              <FormError className="!mb-0 mt-1">
                {annotationErrors[i]?.key}
              </FormError>
            )}
          </div>
          <div className="form-group col-sm-4 !m-0 !pl-0">
            <div className="input-group input-group-sm">
              <span className="input-group-addon required">Value</span>
              <input
                name={`annotation_value_${i}`}
                type="text"
                className="form-control form-control-sm"
                placeholder={placeholder[1]}
                defaultValue={annotation.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleAnnotationChange(i, 'value', e.target.value)
                }
                data-cy={`annotation-value-${i}`}
              />
            </div>
            {annotationErrors?.[i]?.value && (
              <FormError className="!mb-0 mt-1">
                {annotationErrors[i]?.value}
              </FormError>
            )}
          </div>
          <div className="col-sm-3 !m-0 !pl-0">
            <Button
              size="small"
              data-cy={`remove-annotation-${i}`}
              color="dangerlight"
              className="btn-only-icon !ml-0"
              type="button"
              onClick={() => removeAnnotation(i)}
              icon={Trash2}
            />
          </div>
        </div>
      ))}
    </>
  );
}
