import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { NameField } from '../../NameField';

import { PortainerTunnelAddrField } from './PortainerTunnelAddrField';
import { PortainerUrlField } from './PortainerUrlField';

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
