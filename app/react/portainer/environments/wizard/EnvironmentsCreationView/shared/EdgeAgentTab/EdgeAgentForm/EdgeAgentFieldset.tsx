import { NameField } from '../../NameField';

import { PortainerUrlField } from './PortainerUrlField';

interface EdgeAgentFormProps {
  readonly?: boolean;
}

export function EdgeAgentFieldset({ readonly }: EdgeAgentFormProps) {
  return (
    <>
      <NameField readonly={readonly} />
      <PortainerUrlField fieldName="portainerUrl" readonly={readonly} />
    </>
  );
}
