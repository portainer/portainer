import { useMemo } from 'react';

import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';
import { Tooltip } from '@@/Tip/Tooltip';
import { AutocompleteSelect } from '@@/form-components/AutocompleteSelect';
import { FormError } from '@@/form-components/FormError';

type Props = {
  stackName: string;
  setStackName: (name: string) => void;
  stacks?: string[];
  inputClassName?: string;
  textTip?: string;
  error?: string;
};

export function StackName({
  stackName,
  setStackName,
  stacks = [],
  inputClassName,
  textTip = "Enter or select a 'stack' name to group multiple deployments together, or else leave empty to ignore.",
  error = '',
}: Props) {
  const isAdminQuery = useIsEdgeAdmin();
  const stackResults = useMemo(
    () => stacks.filter((stack) => stack.includes(stackName ?? '')),
    [stacks, stackName]
  );

  const { isAdmin } = isAdminQuery;

  const tooltip = (
    <>
      You may specify a stack name to label resources that you want to group.
      This includes Deployments, DaemonSets, StatefulSets and Pods.
      {isAdmin && (
        <>
          <br />
          You can leave the stack name empty, or even turn off Kubernetes Stacks
          functionality entirely via{' '}
          <Link
            to="portainer.settings"
            target="_blank"
            data-cy="k8s-deploy-stack-input-settings-link"
          >
            Kubernetes Settings
          </Link>
          .
        </>
      )}
    </>
  );

  return (
    <>
      {textTip ? (
        <TextTip className="mb-4" color="blue">
          {textTip}
        </TextTip>
      ) : null}
      <div className="form-group">
        <label
          htmlFor="stack_name"
          className="col-lg-2 col-sm-3 control-label text-left"
        >
          Stack
          <Tooltip message={tooltip} setHtmlMessage />
        </label>
        <div className={inputClassName || 'col-sm-9 col-lg-10'}>
          <AutocompleteSelect
            searchResults={stackResults?.map((result) => ({
              value: result,
              label: result,
            }))}
            value={stackName ?? ''}
            onChange={setStackName}
            placeholder="e.g. myStack"
            inputId="stack_name"
            data-cy="k8s-deploy-stack-input"
          />
          {error ? <FormError>{error}</FormError> : null}
        </div>
      </div>
    </>
  );
}
