import { useAMTInfo } from '@/react/edge/edge-devices/open-amt/useAmtInfo';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

import { EnvironmentId } from '../../../types';
import { useSettings } from '../../../../settings/queries';

export function AmtInfo({ environmentId }: { environmentId: EnvironmentId }) {
  const isAmtEnabledQuery = useSettings(
    (settings) => settings.openAMTConfiguration.enabled
  );
  const amtQuery = useAMTInfo(environmentId, {
    enabled: isAmtEnabledQuery.data,
  });

  if (!isAmtEnabledQuery.data) {
    return null;
  }

  const info = amtQuery.data;

  return (
    <FormSection title="Open Active Management Technology">
      <FormControl
        label="AMT Version"
        inputId="endpoint_management_info_version"
      >
        <Input
          id="endpoint_management_info_version"
          value={info?.amt}
          disabled
          placeholder="Loading..."
          data-cy="endpoint-managementInfoVersion"
        />
      </FormControl>

      <FormControl label="UUID" inputId="endpoint_management_info_uuid">
        <Input
          id="endpoint_management_info_uuid"
          value={info?.uuid}
          disabled
          placeholder="Loading..."
          data-cy="endpoint-managementInfoUUID"
        />
      </FormControl>

      <FormControl
        label="Build Number"
        inputId="endpoint_management_info_build_number"
      >
        <Input
          id="endpoint_management_info_build_number"
          value={info?.buildNumber}
          disabled
          placeholder="Loading..."
          data-cy="endpoint-managementInfoBuildNumber"
        />
      </FormControl>

      <FormControl
        label="Control Mode"
        inputId="endpoint_management_info_control_mode"
      >
        <Input
          id="endpoint_management_info_control_mode"
          value={info?.controlMode}
          disabled
          placeholder="Loading..."
          data-cy="endpoint-managementInfoControlMode"
        />
      </FormControl>

      <FormControl
        label="DNS Suffix"
        inputId="endpoint_management_info_dns_suffix"
      >
        <Input
          id="endpoint_management_info_dns_suffix"
          value={info?.dnsSuffix}
          disabled
          placeholder="Loading..."
          data-cy="endpoint-managementInfoDNSSuffix"
        />
      </FormControl>
    </FormSection>
  );
}
