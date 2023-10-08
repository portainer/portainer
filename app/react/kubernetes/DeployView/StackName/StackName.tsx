import { InsightsBox } from '@@/InsightsBox';
import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';
import { Tooltip } from '@@/Tip/Tooltip';

type Props = {
  stackName: string;
  setStackName: (name: string) => void;
  isAdmin?: boolean;
};

export function StackName({ stackName, setStackName, isAdmin = false }: Props) {
  const tooltip = (
    <>
      You may specify a stack name to label resources that you want to group.
      This includes Deployments, DaemonSets, StatefulSets and Pods.
      {isAdmin && (
        <>
          <br />
          You can leave the stack name empty, or even turn off Kubernetes Stacks
          functionality entirely via{' '}
          <Link to="portainer.settings" target="_blank">
            Kubernetes Settings
          </Link>
          .
        </>
      )}
    </>
  );

  const insightsBoxContent = (
    <>
      The stack field below was previously labelled &apos;Name&apos; but, in
      fact, it&apos;s always been the stack name (hence the relabelling).
      {isAdmin && (
        <>
          <br />
          Kubernetes Stacks functionality can be turned off entirely via{' '}
          <Link to="portainer.settings" target="_blank">
            Kubernetes Settings
          </Link>
          .
        </>
      )}
    </>
  );

  return (
    <>
      <div className="w-fit mb-4">
        <InsightsBox
          type="slim"
          header="Stack"
          content={insightsBoxContent}
          insightCloseId="k8s-stacks-name"
        />
      </div>

      <TextTip className="mb-4" color="blue">
        Enter or select a &apos;stack&apos; name to group multiple deployments
        together, or else leave empty to ignore.
      </TextTip>
      <div className="form-group">
        <label
          htmlFor="stack_name"
          className="col-lg-2 col-sm-3 control-label text-left"
        >
          Stack
          <Tooltip message={tooltip} setHtmlMessage />
        </label>
        <div className="col-sm-8">
          <input
            type="text"
            className="form-control"
            defaultValue={stackName}
            onChange={(e) => setStackName(e.target.value)}
            id="stack_name"
            placeholder="myStack"
          />
        </div>
      </div>
    </>
  );
}
