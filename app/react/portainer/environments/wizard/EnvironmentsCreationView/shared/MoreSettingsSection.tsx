import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset/MetadataFieldset';

import { FormSection } from '@@/form-components/FormSection';

export function MoreSettingsSection({ children }: PropsWithChildren<unknown>) {
  const { t } = useTranslation();
  return (
    <FormSection title={t('wizard_env.more_settings')} className="ml-0" isFoldable>
      <div className="ml-8">
        {children}

        <MetadataFieldset />
      </div>
    </FormSection>
  );
}
