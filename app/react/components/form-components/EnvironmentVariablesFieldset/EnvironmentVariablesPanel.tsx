import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { ArrayError } from '../InputList/InputList';

import { Value } from './types';
import { EnvironmentVariablesFieldset } from './EnvironmentVariablesFieldset';

export function EnvironmentVariablesPanel({
  explanation,
  onChange,
  values,
  showHelpMessage,
  errors,
  isFoldable = false,
}: {
  explanation?: string;
  values: Value;
  onChange(value: Value): void;
  showHelpMessage?: boolean;
  errors?: ArrayError<Value>;
  isFoldable?: boolean;
}) {
  return (
    <FormSection
      title="Environment variables"
      isFoldable={isFoldable}
      defaultFolded={isFoldable}
    >
      <div className="form-group">
        {!!explanation && (
          <div className="col-sm-12 environment-variables-panel--explanation">
            {explanation}
          </div>
        )}

        <div className="col-sm-12">
          <EnvironmentVariablesFieldset
            values={values}
            onChange={onChange}
            errors={errors}
          />
        </div>

        {showHelpMessage && (
          <div className="col-sm-12">
            <TextTip color="blue" inline={false}>
              Environment changes will not take effect until redeployment occurs
              manually or via webhook.
            </TextTip>
          </div>
        )}
      </div>
    </FormSection>
  );
}
