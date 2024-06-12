import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';

import { getPlatformTypeName } from '../../utils';
import { Environment } from '../../types';

import { DisassociateButton } from './DisassociateButton';

export function EdgeAssociationInfo({
  environment,
}: {
  environment: Environment;
}) {
  const platform = getPlatformTypeName(environment.Type);
  return (
    <InformationPanel title="Edge information">
      <TextTip color="blue">
        This Edge environment is associated to an Edge environment ({platform}).
      </TextTip>

      <div className="small text-muted mt-2">
        <p>
          Edge key: <code>{environment.EdgeKey}</code>
        </p>
        <p>
          Edge identifier: <code>{environment.EdgeID}</code>
        </p>
      </div>

      <DisassociateButton environment={environment} />
    </InformationPanel>
  );
}
