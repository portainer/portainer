import { InformationPanel } from '@@/InformationPanel';
import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';

export function NoEnvironmentsInfoPanel({ isAdmin }: { isAdmin: boolean }) {
  return (
    <InformationPanel title="Information">
      <TextTip>
        {isAdmin ? (
          <span>
            No environment available for management. Please head over the{' '}
            <Link to="portainer.wizard.endpoints">environment wizard</Link> to
            add an environment.
          </span>
        ) : (
          <span>
            You do not have access to any environment. Please contact your
            administrator.
          </span>
        )}
      </TextTip>
    </InformationPanel>
  );
}
