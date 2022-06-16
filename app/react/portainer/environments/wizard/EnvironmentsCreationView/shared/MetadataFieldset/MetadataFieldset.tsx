import { useField } from 'formik';

import { useUser } from '@/portainer/hooks/useUser';

import { TagSelector } from '@@/TagSelector';
import { FormSection } from '@@/form-components/FormSection';

import { GroupField } from './GroupsField';

export function MetadataFieldset() {
  const [tagProps, , tagHelpers] = useField('meta.tagIds');

  const { isAdmin } = useUser();

  return (
    <FormSection title="Metadata">
      <GroupField />

      <TagSelector
        value={tagProps.value}
        allowCreate={isAdmin}
        onChange={(value) => tagHelpers.setValue(value)}
      />
    </FormSection>
  );
}
