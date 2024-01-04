import { FormikErrors } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useSecrets } from '@/react/kubernetes/configs/secret.service';

import { FormSection } from '@@/form-components/FormSection/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { InputList } from '@@/form-components/InputList';
import { InlineLoader } from '@@/InlineLoader';

import { ConfigurationItem } from './ConfigurationItem';
import { ConfigurationFormValues } from './types';

type Props = {
  values: ConfigurationFormValues[];
  onChange: (values: ConfigurationFormValues[]) => void;
  errors: FormikErrors<ConfigurationFormValues[]>;
  namespace: string;
};

export function SecretsFormSection({
  values,
  onChange,
  errors,
  namespace,
}: Props) {
  const secretsQuery = useSecrets(useEnvironmentId(), namespace);
  const secrets = secretsQuery.data || [];

  if (secretsQuery.isLoading) {
    return <InlineLoader>Loading Secrets...</InlineLoader>;
  }

  return (
    <FormSection title="Secrets" titleSize="sm">
      {!!values.length && (
        <TextTip color="blue">
          Portainer will automatically expose all the keys of a Secret as
          environment variables. This behavior can be overridden to filesystem
          mounts for each key via the override option.
        </TextTip>
      )}

      <InputList<ConfigurationFormValues>
        value={values}
        onChange={onChange}
        errors={errors}
        isDeleteButtonHidden
        deleteButtonDataCy="k8sAppCreate-secretRemoveButton"
        addButtonDataCy="k8sAppCreate-secretAddButton"
        disabled={secrets.length === 0}
        addButtonError={
          secrets.length === 0
            ? 'There are no Secrets available in this namespace.'
            : undefined
        }
        renderItem={(item, onChange, index, error) => (
          <ConfigurationItem
            item={item}
            onChange={onChange}
            error={error}
            configurations={secrets}
            onRemoveItem={() => onRemoveItem(index)}
            index={index}
            dataCyType="secret"
          />
        )}
        itemBuilder={() => ({
          selectedConfigMap: secrets[0]?.metadata?.name || '',
          overriden: false,
          overridenKeys: [],
          selectedConfiguration: secrets[0],
        })}
        addLabel="Add Secret"
      />
    </FormSection>
  );

  function onRemoveItem(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }
}
