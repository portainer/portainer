import { FormikErrors } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';

import { FormControl } from '@@/form-components/FormControl';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

type Props = {
  onChange: (value: string) => void;
  values: string;
  errors: FormikErrors<string>;
  isEdit: boolean;
};

export function NamespaceSelector({
  values: value,
  onChange,
  errors,
  isEdit,
}: Props) {
  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } =
    useNamespacesQuery(environmentId);
  const namespaceNames = Object.entries(namespaces ?? {})
    .filter(([, ns]) => !ns.IsSystem)
    .map(([, ns]) => ({
      label: ns.Name,
      value: ns.Name,
    }));

  return (
    <FormControl
      label="Namespace"
      inputId="namespace-selector"
      isLoading={namespacesQuery.isLoading}
      errors={errors}
    >
      {namespaceNames.length > 0 && (
        <PortainerSelect
          value={value}
          options={namespaceNames}
          onChange={onChange}
          disabled={isEdit}
          noOptionsMessage={() => 'No namespaces found'}
          placeholder="No namespaces found" // will only show when there are no options
          inputId="namespace-selector"
          data-cy="k8sAppCreate-nsSelect"
        />
      )}
    </FormControl>
  );
}
