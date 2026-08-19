import { StorageClass } from '@/react/portainer/environments/types';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { StorageQuotaItem } from './StorageQuotaItem';

interface Props {
  storageClasses: StorageClass[];
}

export function StorageQuotaFormSection({ storageClasses }: Props) {
  return (
    <FormSection title="Storage">
      <TextTip color="blue">
        Quotas can be set on each storage option to prevent users from exceeding
        a specific threshold when deploying applications. You can set a quota to
        0 to effectively prevent the usage of a specific storage option inside
        this namespace.
      </TextTip>

      {storageClasses.map((storageClass) => (
        <StorageQuotaItem key={storageClass.Name} storageClass={storageClass} />
      ))}
    </FormSection>
  );
}
