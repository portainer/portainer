import { PropsWithChildren, ReactNode } from 'react';
import { SchemaOf, string } from 'yup';

import { StackId } from '@/react/common/stacks/types';
import { useStateWrapper } from '@/react/hooks/useStateWrapper';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { isBE } from '../../feature-flags/feature-flags.service';

import { RefSelector } from './RefSelector';
import { RefFieldModel } from './types';

interface Props {
  value: string;
  onChange(value: string): void;
  model: RefFieldModel;
  error?: string;
  isUrlValid: boolean;
  stackId?: StackId;
}

export function RefField({
  value,
  onChange,
  model,
  error,
  isUrlValid,
  stackId,
}: Props) {
  const [inputValue, updateInputValue] = useStateWrapper(value, onChange);

  return isBE ? (
    <Wrapper
      errors={error}
      tip={
        <>
          Specify a reference of the repository using the following syntax:
          branches with <code>refs/heads/branch_name</code> or tags with{' '}
          <code>refs/tags/tag_name</code>.
        </>
      }
    >
      <RefSelector
        value={value}
        onChange={onChange}
        model={model}
        isUrlValid={isUrlValid}
        stackId={stackId}
      />
    </Wrapper>
  ) : (
    <Wrapper
      errors={error}
      tip={
        <>
          Specify a reference of the repository using the following syntax:
          branches with <code>refs/heads/branch_name</code> or tags with{' '}
          <code>refs/tags/tag_name</code>. If not specified, will use the
          default <code>HEAD</code> reference normally the <code>main</code>{' '}
          branch.
        </>
      }
    >
      <Input
        value={inputValue}
        onChange={(e) => updateInputValue(e.target.value)}
        placeholder="refs/heads/main"
      />
    </Wrapper>
  );
}

function Wrapper({
  tip,
  children,
  errors,
}: PropsWithChildren<{ tip: ReactNode; errors?: string }>) {
  return (
    <div className="form-group">
      <span className="col-sm-12 mb-2">
        <TextTip color="blue">{tip}</TextTip>
      </span>
      <div className="col-sm-12">
        <FormControl
          label="Repository reference"
          inputId="stack_repository_reference_name"
          required
          errors={errors}
        >
          {children}
        </FormControl>
      </div>
    </div>
  );
}

export function refFieldValidation(): SchemaOf<string> {
  return string()
    .when({
      is: isBE,
      then: string().required('Repository reference name is required'),
    })
    .default('');
}
