import { FormikErrors } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useK8sConfigMaps } from '@/react/kubernetes/configs/queries/useK8sConfigMaps';

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

export function ConfigMapsFormSection({
  values,
  onChange,
  errors,
  namespace,
}: Props) {
  const configMapsQuery = useK8sConfigMaps(useEnvironmentId(), namespace);
  const configMaps = configMapsQuery.data || [];

  if (configMapsQuery.isLoading) {
    return <InlineLoader>Loading ConfigMaps...</InlineLoader>;
  }

  return (
    <FormSection title="ConfigMaps" titleSize="sm">
      {!!values.length && (
        <TextTip color="blue">
          Portainer will automatically expose all the keys of a ConfigMap as
          environment variables. This behavior can be overridden to filesystem
          mounts for each key via the override option.
        </TextTip>
      )}

      <InputList<ConfigurationFormValues>
        value={values}
        onChange={onChange}
        errors={errors}
        isDeleteButtonHidden
        data-cy="k8sAppCreate-config"
        disabled={configMaps.length === 0}
        addButtonError={
          configMaps.length === 0
            ? 'There are no ConfigMaps available in this namespace.'
            : undefined
        }
        renderItem={(item, onChange, index, error) => (
          <ConfigurationItem
            item={item}
            onChange={onChange}
            error={error}
            configurations={configMaps}
            onRemoveItem={() => onRemoveItem(index)}
            index={index}
            configurationType="ConfigMap"
          />
        )}
        itemBuilder={() => ({
          selectedConfigMap: configMaps[0]?.metadata?.name || '',
          overriden: false,
          overridenKeys: [],
          selectedConfiguration: configMaps[0],
        })}
        addLabel="Add ConfigMap"
      />
    </FormSection>
  );

  function onRemoveItem(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }
}
