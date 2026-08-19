import { FormControl } from '@@/form-components/FormControl';
import { CodeEditor } from '@@/CodeEditor';
import { ShortcutsTooltip } from '@@/CodeEditor/ShortcutsTooltip';

type Props = {
  values: string;
  setValues: (values: string) => void;
  valuesRef: string;
  isValuesRefLoading: boolean;
};

export function HelmValuesInput({
  values,
  setValues,
  valuesRef,
  isValuesRefLoading,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormControl
        label="User-defined values"
        inputId="user-values-editor"
        size="vertical"
        className="!mx-0 [&>label]:!mb-1"
        tooltip={
          <>
            User-defined values will override the default chart values.
            <br />
            You can get more information about the Helm values file format in
            the{' '}
            <a
              href="https://helm.sh/docs/chart_template_guide/values_files/"
              target="_blank"
              data-cy="helm-values-reference-link"
              rel="noreferrer"
            >
              official documentation
            </a>
            .
          </>
        }
      >
        <CodeEditor
          id="user-values-editor"
          value={values}
          onChange={setValues}
          height="50vh"
          type="yaml"
          data-cy="helm-user-values-editor"
          placeholder="Define or paste the content of your values yaml file here"
          showToolbar={false}
        />
      </FormControl>
      <FormControl
        label={
          <div className="flex w-full justify-between">
            Values reference (read-only)
            <ShortcutsTooltip />
          </div>
        }
        inputId="values-reference"
        size="vertical"
        isLoading={isValuesRefLoading}
        loadingText="Loading values..."
        className="!mx-0 [&>label]:!mb-1 [&>label]:w-full"
      >
        <CodeEditor
          id="values-reference"
          value={valuesRef}
          height="50vh"
          type="yaml"
          readonly
          data-cy="helm-values-reference"
          placeholder="No values reference found"
          showToolbar={false}
        />
      </FormControl>
    </div>
  );
}
