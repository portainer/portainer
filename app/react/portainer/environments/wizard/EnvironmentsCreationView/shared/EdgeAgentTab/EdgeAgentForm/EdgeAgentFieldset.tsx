import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { PortainerTunnelAddrField } from '@/react/portainer/common/PortainerTunnelAddrField';
import { PortainerUrlField } from '@/react/portainer/common/PortainerUrlField';

import { NameField } from '../../NameField';

interface EdgeAgentFormProps {
  readonly?: boolean;
  asyncMode?: boolean;
}

export function EdgeAgentFieldset({ readonly, asyncMode }: EdgeAgentFormProps) {
  return (
    <>
      <NameField readonly={readonly} />
      <PortainerUrlField
        fieldName="portainerUrl"
        readonly={readonly}
        required
      />
      {isBE && !asyncMode && (
        <PortainerTunnelAddrField
          fieldName="tunnelServerAddr"
          readonly={readonly}
          required
        />
      )}
    </>
  );
}
