import { FormikErrors } from 'formik';
import { useMemo } from 'react';

import { useNodesQuery } from '@/react/kubernetes/cluster/HomeView/nodes.service';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { InputList } from '@@/form-components/InputList';

import { PlacementsFormValues, NodeLabels, Placement } from './types';
import { PlacementItem } from './PlacementItem';
import { PlacementTypeBoxSelector } from './PlacementTypeBoxSelector';

type Props = {
  values: PlacementsFormValues;
  onChange: (values: PlacementsFormValues) => void;
  errors?: FormikErrors<PlacementsFormValues>;
};

export function PlacementFormSection({ values, onChange, errors }: Props) {
  // node labels are all of the unique node labels across all nodes
  const nodesLabels = useNodeLabels();
  // available node labels are the node labels that are not already in use by a placement
  const availableNodeLabels = useAvailableNodeLabels(
    nodesLabels,
    values.placements
  );
  const firstAvailableNodeLabel = Object.keys(availableNodeLabels)[0] || '';
  const firstAvailableNodeLabelValue =
    availableNodeLabels[firstAvailableNodeLabel]?.[0] || '';
  const nonDeletedPlacements = values.placements.filter(
    (placement) => !placement.needsDeletion
  );

  return (
    <div className="flex flex-col">
      <FormSection title="Placement preferences and constraints" titleSize="sm">
        {values.placements?.length > 0 && (
          <TextTip color="blue">
            Deploy this application on nodes that respect <b>ALL</b> of the
            following placement rules. Placement rules are based on node labels.
          </TextTip>
        )}
        <InputList<Placement>
          value={values.placements}
          onChange={(placements) => onChange({ ...values, placements })}
          renderItem={(item, onChange, index, error) => (
            <PlacementItem
              item={item}
              onChange={onChange}
              error={error}
              index={index}
              nodesLabels={nodesLabels}
              availableNodeLabels={availableNodeLabels}
            />
          )}
          itemBuilder={() => ({
            label: firstAvailableNodeLabel,
            value: firstAvailableNodeLabelValue,
            needsDeletion: false,
          })}
          errors={errors?.placements}
          addLabel="Add rule"
          canUndoDelete
          data-cy="k8sAppCreate-placement"
          disabled={Object.keys(availableNodeLabels).length === 0}
          addButtonError={
            Object.keys(availableNodeLabels).length === 0
              ? 'There are no node labels available to add.'
              : ''
          }
        />
      </FormSection>
      {nonDeletedPlacements.length >= 1 && (
        <FormSection
          title="Placement policy"
          titleSize="sm"
          titleClassName="control-label !text-[0.9em]"
        >
          <TextTip color="blue">
            Specify the policy associated to the placement rules.
          </TextTip>
          <PlacementTypeBoxSelector
            placementType={values.placementType}
            onChange={(placementType) => onChange({ ...values, placementType })}
          />
        </FormSection>
      )}
    </div>
  );
}

function useAvailableNodeLabels(
  nodeLabels: NodeLabels,
  placements: Placement[]
): NodeLabels {
  return useMemo(() => {
    const existingPlacementLabels = placements.map(
      (placement) => placement.label
    );
    const availableNodeLabels = Object.keys(nodeLabels).filter(
      (label) => !existingPlacementLabels.includes(label)
    );
    return availableNodeLabels.reduce((acc, label) => {
      acc[label] = nodeLabels[label];
      return acc;
    }, {} as NodeLabels);
  }, [nodeLabels, placements]);
}

function useNodeLabels(): NodeLabels {
  const environmentId = useEnvironmentId();
  const { data: nodes } = useNodesQuery(environmentId);

  // all node label pairs (some might have the same key but different values)
  const nodeLabelPairs =
    nodes?.flatMap((node) =>
      Object.entries(node.metadata?.labels || {}).map(([k, v]) => ({
        key: k,
        value: v,
      }))
    ) || [];

  // create a NodeLabels object with each label key's possible values, without duplicate keys or values. e.g. { 'beta.kubernetes.io/arch': ['amd64', 'arm64'] }
  // in multinode clusters, there can be multiple nodes with the same label key
  const allNodesLabels = nodeLabelPairs.map((pair) => pair.key);
  const uniqueNodesLabels = new Set(allNodesLabels);
  const nodesLabels: NodeLabels = Array.from(uniqueNodesLabels).reduce(
    (acc: NodeLabels, key) => {
      // get all possible values for a given node label key
      const allNodeValuesForKey = nodeLabelPairs
        .filter((pair) => pair.key === key)
        .map((pair) => pair.value);
      // in multinode clusters, there can be duplicate values for a given key, so remove them
      const uniqueValues = Array.from(new Set(allNodeValuesForKey));

      acc[key] = uniqueValues;
      return acc;
    },
    {} as NodeLabels
  );

  return nodesLabels;
}
