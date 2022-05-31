import { useField } from 'formik';

import { TagSelector } from '@/react/components/TagSelector';
import { useUser } from '@/portainer/hooks/useUser';
import { FormSection } from '@/portainer/components/form-components/FormSection';

import { GroupField } from './GroupsField';

interface Props {
  isFoldable?: boolean;
}

export function MetadataFieldset({ isFoldable = true }: Props) {
  const [tagProps, , tagHelpers] = useField('meta.tagIds');

  const { isAdmin } = useUser();

  return (
    <FormSection title="Metadata" isFoldable={isFoldable}>
      <GroupField />

      <TagSelector
        value={tagProps.value}
        allowCreate={isAdmin}
        onChange={(value) => tagHelpers.setValue(value)}
      />
    </FormSection>
  );
}
