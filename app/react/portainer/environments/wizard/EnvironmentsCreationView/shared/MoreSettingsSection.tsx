import { PropsWithChildren } from 'react';

import { FormSection } from '@@/form-components/FormSection';

import { MetadataFieldset } from './MetadataFieldset';

export function MoreSettingsSection({ children }: PropsWithChildren<unknown>) {
  return (
    <FormSection title="More settings" isFoldable>
      <div className="ml-8">
        {children}

        <MetadataFieldset />
      </div>
    </FormSection>
  );
}
