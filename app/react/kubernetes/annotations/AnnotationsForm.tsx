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
    key: 'Key' | 'Value',
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
        <div className="row" key={annotation.ID}>
          <div className="form-group col-sm-4 !m-0 !pl-0">
            <div className="input-group input-group-sm">
              <span className="input-group-addon required">Key</span>
              <input
                name={`annotation_key_${i}`}
                type="text"
                className="form-control form-control-sm"
                placeholder={placeholder[0]}
                defaultValue={annotation.Key}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleAnnotationChange(i, 'Key', e.target.value)
                }
                data-cy={`annotation-key-${i}`}
              />
            </div>
            {annotationErrors?.[i]?.Key && (
              <FormError className="!mb-0 mt-1">
                {annotationErrors[i]?.Key}
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
                defaultValue={annotation.Value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleAnnotationChange(i, 'Value', e.target.value)
                }
                data-cy={`annotation-value-${i}`}
              />
            </div>
            {annotationErrors?.[i]?.Value && (
              <FormError className="!mb-0 mt-1">
                {annotationErrors[i]?.Value}
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
