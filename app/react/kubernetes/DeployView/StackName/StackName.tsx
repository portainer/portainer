import { useMemo } from 'react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { InsightsBox } from '@@/InsightsBox';
import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';
import { Tooltip } from '@@/Tip/Tooltip';
import { AutocompleteSelect } from '@@/form-components/AutocompleteSelect';

type Props = {
  stackName: string;
  setStackName: (name: string) => void;
  stacks?: string[];
  inputClassName?: string;
  textTip?: string;
};

export function StackName({
  stackName,
  setStackName,
  stacks = [],
  inputClassName,
  textTip = "Enter or select a 'stack' name to group multiple deployments together, or else leave empty to ignore.",
}: Props) {
  const { isAdmin } = useCurrentUser();
  const stackResults = useMemo(
    () => stacks.filter((stack) => stack.includes(stackName ?? '')),
    [stacks, stackName]
  );
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
        {textTip}
      </TextTip>
      <div className="form-group">
        <label
          htmlFor="stack_name"
          className="col-lg-2 col-sm-3 control-label text-left"
        >
          Stack
          <Tooltip message={tooltip} setHtmlMessage />
        </label>
        <div className={inputClassName || 'col-sm-8'}>
          <AutocompleteSelect
            searchResults={stackResults?.map((result) => ({
              value: result,
              label: result,
            }))}
            value={stackName ?? ''}
            onChange={setStackName}
            placeholder="e.g. myStack"
            inputId="stack_name"
          />
        </div>
      </div>
    </>
  );
}
