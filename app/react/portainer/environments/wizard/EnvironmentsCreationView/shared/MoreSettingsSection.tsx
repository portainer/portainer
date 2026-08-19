import { PropsWithChildren } from 'react';

import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset/MetadataFieldset';

import { FormSection } from '@@/form-components/FormSection';

export function MoreSettingsSection({ children }: PropsWithChildren<unknown>) {
  return (
    <FormSection title="More settings" className="ml-0" isFoldable>
      <div className="ml-8">
        {children}

        <MetadataFieldset />
      </div>
    </FormSection>
  );
}
