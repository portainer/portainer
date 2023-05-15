import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';

export function BetaAlert() {
  return (
    <InformationPanel title="Limited Feature">
      <TextTip icon="svg-beta">
        This feature is currently in beta and is limited to standalone linux
        edge devices.
      </TextTip>
    </InformationPanel>
  );
}
