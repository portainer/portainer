import sanitize from 'sanitize-html';

import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { ArrayError } from '@@/form-components/InputList/InputList';

import { Values } from './types';

export function CustomTemplateFieldset({
  errors,
  onChange,
  values,
  template,
}: {
  values: Values['variables'];
  onChange: (values: Values['variables']) => void;
  errors: ArrayError<Values['variables']> | undefined;
  template: CustomTemplate;
}) {
  return (
    <>
      {template.Note && (
        <div>
          <div className="col-sm-12 form-section-title"> Information </div>
          <div className="form-group">
            <div className="col-sm-12">
              <div
                className="template-note"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: sanitize(template.Note),
                }}
              />
            </div>
          </div>
        </div>
      )}

      <CustomTemplatesVariablesField
        onChange={onChange}
        value={values}
        definitions={template.Variables}
        errors={errors}
      />
    </>
  );
}
