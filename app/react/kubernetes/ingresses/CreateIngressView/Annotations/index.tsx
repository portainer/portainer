import { ChangeEvent, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

import { FormError } from '@@/form-components/FormError';
import { Button } from '@@/buttons';

import { Annotation } from './types';

interface Props {
  annotations: Annotation[];
  handleAnnotationChange: (
    index: number,
    key: 'Key' | 'Value',
    val: string
  ) => void;
  removeAnnotation: (index: number) => void;
  errors: Record<string, ReactNode>;
  placeholder: string[];
}

export function Annotations({
  annotations,
  handleAnnotationChange,
  removeAnnotation,
  errors,
  placeholder,
}: Props) {
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
              />
            </div>
            {errors[`annotations.key[${i}]`] && (
              <FormError className="mt-1 !mb-0">
                {errors[`annotations.key[${i}]`]}
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
              />
            </div>
            {errors[`annotations.value[${i}]`] && (
              <FormError className="mt-1 !mb-0">
                {errors[`annotations.value[${i}]`]}
              </FormError>
            )}
          </div>
          <div className="col-sm-3 !m-0 !pl-0">
            <Button
              size="small"
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
