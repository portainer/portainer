import React, { ComponentProps } from 'react';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { EnvironmentVariablesFieldset } from './EnvironmentVariablesFieldset';

type FieldsetProps = ComponentProps<typeof EnvironmentVariablesFieldset>;

export function EnvironmentVariablesPanel({
  explanation,
  onChange,
  values,
  showHelpMessage,
  errors,
  isFoldable = false,
  alertMessage,
}: {
  explanation?: React.ReactNode;
  showHelpMessage?: boolean;
  isFoldable?: boolean;
  alertMessage?: React.ReactNode;
} & FieldsetProps) {
  return (
    <FormSection
      title="Environment variables"
      isFoldable={isFoldable}
      defaultFolded={isFoldable}
      className="flex flex-col w-full"
    >
      <div className="form-group">
        {!!explanation && (
          <div className="col-sm-12 environment-variables-panel--explanation">
            {explanation}
          </div>
        )}

        {alertMessage}

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
