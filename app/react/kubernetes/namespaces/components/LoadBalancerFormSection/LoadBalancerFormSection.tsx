import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';

export function LoadBalancerFormSection() {
  return (
    <FormSection title="Load balancers">
      <TextTip color="blue">
        You can set a quota on the number of external load balancers that can be
        created inside this namespace. Set this quota to 0 to effectively
        disable the use of load balancers in this namespace.
      </TextTip>
      <SwitchField
        data-cy="k8sNamespaceCreate-loadBalancerQuotaToggle"
        label="Load balancer quota"
        labelClass="col-sm-3 col-lg-2"
        fieldClass="pt-2"
        checked={false}
        featureId={FeatureId.K8S_RESOURCE_POOL_LB_QUOTA}
        onChange={() => {}}
      />
    </FormSection>
  );
}
