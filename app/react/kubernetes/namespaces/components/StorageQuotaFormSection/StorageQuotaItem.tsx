import { Database } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Icon } from '@@/Icon';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { SwitchField } from '@@/form-components/SwitchField';

export function StorageQuotaItem() {
  return (
    <div>
      <FormSectionTitle>
        <div className="vertical-center text-muted inline-flex gap-1 align-top">
          <Icon icon={Database} className="!mt-0.5 flex-none" />
          <span>standard</span>
        </div>
      </FormSectionTitle>
      <hr className="mb-0 mt-2 w-full" />
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            data-cy="k8sNamespaceEdit-storageClassQuota"
            disabled={false}
            label="Enable quota"
            labelClass="col-sm-3 col-lg-2"
            fieldClass="pt-2"
            checked={false}
            onChange={() => {}}
            featureId={FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA}
          />
        </div>
      </div>
    </div>
  );
}
