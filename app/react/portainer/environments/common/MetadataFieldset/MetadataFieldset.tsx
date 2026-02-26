import { useField } from 'formik';
import { PropsWithChildren } from 'react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { TagSelector } from '@@/TagSelector';
import { FormSection } from '@@/form-components/FormSection';

import { GroupField } from './GroupsField';

export function MetadataFieldset({ children }: PropsWithChildren<unknown>) {
  const [tagProps, , tagHelpers] = useField('meta.tagIds');

  const { isPureAdmin } = useCurrentUser();

  return (
    <FormSection title="Metadata">
      {children}

      <GroupField />

      <TagSelector
        value={tagProps.value}
        allowCreate={isPureAdmin}
        onChange={(value) => tagHelpers.setValue(value)}
      />
    </FormSection>
  );
}
