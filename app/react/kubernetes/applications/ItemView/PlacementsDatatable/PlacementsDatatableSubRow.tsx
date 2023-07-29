import clsx from 'clsx';
import { Fragment } from 'react';

import { nodeAffinityValues } from '@/kubernetes/filters/application';
import { useAuthorizations } from '@/react/hooks/useUser';

import { Affinity, Label, Node, Taint } from '../types';

interface SubRowProps {
  node: Node;
  cellCount: number;
}

export function SubRow({ node, cellCount }: SubRowProps) {
  const authorized = useAuthorizations(
    'K8sApplicationErrorDetailsR',
    undefined,
    true
  );

  if (!authorized) {
    <>
      {isDefined(node.UnmetTaints) && (
        <tr
          className={clsx({
            'datatable-highlighted': node.Highlighted,
            'datatable-unhighlighted': !node.Highlighted,
          })}
        >
          <td colSpan={cellCount}>
            Placement constraint not respected for that node.
          </td>
        </tr>
      )}

      {(isDefined(node.UnmatchedNodeSelectorLabels) ||
        isDefined(node.UnmatchedNodeAffinities)) && (
        <tr
          className={clsx({
            'datatable-highlighted': node.Highlighted,
            'datatable-unhighlighted': !node.Highlighted,
          })}
        >
          <td colSpan={cellCount}>
            Placement label not respected for that node.
          </td>
        </tr>
      )}
    </>;
  }

  return (
    <>
      {isDefined(node.UnmetTaints) && (
        <UnmetTaintsInfo
          taints={node.UnmetTaints}
          cellCount={cellCount}
          isHighlighted={node.Highlighted}
        />
      )}
      {isDefined(node.UnmatchedNodeSelectorLabels) && (
        <UnmatchedLabelsInfo
          labels={node.UnmatchedNodeSelectorLabels}
          cellCount={cellCount}
          isHighlighted={node.Highlighted}
        />
      )}
      {isDefined(node.UnmatchedNodeAffinities) && (
        <UnmatchedAffinitiesInfo
          affinities={node.UnmatchedNodeAffinities}
          cellCount={cellCount}
          isHighlighted={node.Highlighted}
        />
      )}
    </>
  );
}

function isDefined<T>(arr?: Array<T>): arr is Array<T> {
  return !!arr && arr.length > 0;
}

function UnmetTaintsInfo({
  taints,
  isHighlighted,
  cellCount,
}: {
  taints: Array<Taint>;
  isHighlighted: boolean;
  cellCount: number;
}) {
  return (
    <>
      {taints.map((taint) => (
        <tr
          className={clsx({
            'datatable-highlighted': isHighlighted,
            'datatable-unhighlighted': !isHighlighted,
          })}
          key={taint.Key}
        >
          <td colSpan={cellCount}>
            This application is missing a toleration for the taint
            <code className="space-left">
              {taint.Key}
              {taint.Value ? `=${taint.Value}` : ''}:{taint.Effect}
            </code>
          </td>
        </tr>
      ))}
    </>
  );
}

function UnmatchedLabelsInfo({
  labels,
  isHighlighted,
  cellCount,
}: {
  labels: Array<Label>;
  isHighlighted: boolean;
  cellCount: number;
}) {
  return (
    <>
      {labels.map((label) => (
        <tr
          className={clsx({
            'datatable-highlighted': isHighlighted,
            'datatable-unhighlighted': !isHighlighted,
          })}
          key={label.key}
        >
          <td colSpan={cellCount}>
            This application can only be scheduled on a node where the label{' '}
            <code>{label.key}</code> is set to <code>{label.value}</code>
          </td>
        </tr>
      ))}
    </>
  );
}

function UnmatchedAffinitiesInfo({
  affinities,
  isHighlighted,
  cellCount,
}: {
  affinities: Array<Affinity>;
  isHighlighted: boolean;
  cellCount: number;
}) {
  return (
    <>
      <tr
        className={clsx({
          'datatable-highlighted': isHighlighted,
          'datatable-unhighlighted': !isHighlighted,
        })}
      >
        <td colSpan={cellCount}>
          This application can only be scheduled on nodes respecting one of the
          following labels combination:
        </td>
      </tr>
      {affinities.map((aff) => (
        <tr
          className={clsx({
            'datatable-highlighted': isHighlighted,
            'datatable-unhighlighted': !isHighlighted,
          })}
        >
          <td />
          <td colSpan={cellCount - 1}>
            {aff.map((term, index) => (
              <Fragment key={index}>
                <code>
                  {term.key} {term.operator}{' '}
                  {nodeAffinityValues(term.values, term.operator)}
                </code>
                <span>{index === aff.length - 1 ? '' : ' + '}</span>
              </Fragment>
            ))}
          </td>
        </tr>
      ))}
    </>
  );
}
