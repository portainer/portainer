import { useFormikContext } from 'formik';
import { JSONSchema7 } from 'json-schema';

import { textByType } from '@/react/common/stacks/common/form-texts';
import { StackType } from '@/react/common/stacks/types';

import { usePreventExit, WebEditorForm } from '@@/WebEditorForm';

import { FormValues } from '../types';

export function EditorSection({
  schema,
  isSwarm,
  isSaved,
}: {
  isSwarm: boolean;
  schema?: JSONSchema7;
  isSaved: boolean;
}) {
  const texts =
    textByType[isSwarm ? StackType.DockerSwarm : StackType.DockerCompose];
  const { values, errors, setFieldValue, isSubmitting, initialValues } =
    useFormikContext<FormValues>();

  usePreventExit(
    initialValues.editor.fileContent,
    values.editor.fileContent,
    !isSubmitting && !isSaved
  );

  return (
    <WebEditorForm
      id="stack-creation-editor"
      value={values.editor.fileContent}
      onChange={(value) => setFieldValue('editor.fileContent', value)}
      schema={schema}
      error={errors.editor?.fileContent}
      textTip={texts.editor.placeholder}
      data-cy="stack-creation-editor"
    >
      {texts.editor.description}
    </WebEditorForm>
  );
}
