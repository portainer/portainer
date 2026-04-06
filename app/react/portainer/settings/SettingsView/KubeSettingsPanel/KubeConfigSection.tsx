import { useField } from 'formik';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

const options = [
  {
    label: i18n.t('settings.kubeconfig_1day'),
    value: '24h',
  },
  {
    label: i18n.t('settings.kubeconfig_7days'),
    value: `${24 * 7}h`,
  },
  {
    label: i18n.t('settings.kubeconfig_30days'),
    value: `${24 * 30}h`,
  },
  {
    label: i18n.t('settings.kubeconfig_1year'),
    value: `${24 * 30 * 12}h`,
  },
  {
    label: i18n.t('settings.kubeconfig_no_expiry'),
    value: '0',
  },
];

export function KubeConfigSection() {
  const { t } = useTranslation();
  const [{ value }, { error }, { setValue }] =
    useField<string>('kubeconfigExpiry');

  return (
    <FormSection title={t('settings.kubeconfig_title')}>
      <FormControl label={t('settings.kubeconfig_expiry')} errors={error}>
        <PortainerSelect
          value={value}
          options={options}
          onChange={(value) => value && setValue(value)}
          data-cy="kubeconfig-expiry-selector"
        />
      </FormControl>
    </FormSection>
  );
}
