import { useMemo, useState } from 'react';
import YAML from 'yaml';
import { Minus, Plus } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { AutomationTestingProps } from '@/types';

import { WebEditorForm } from '@@/WebEditorForm';
import { Button } from '@@/buttons';
import { BETeaserButton } from '@@/BETeaserButton';

type Props = {
  identifier: string;
  data: string;
  hideMessage?: boolean;
} & AutomationTestingProps;

export function YAMLInspector({
  identifier,
  data,
  hideMessage,
  'data-cy': dataCy,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const yaml = useMemo(() => cleanYamlUnwantedFields(data), [data]);

  return (
    <div>
      <WebEditorForm
        data-cy={dataCy}
        value={yaml}
        placeholder={
          hideMessage
            ? undefined
            : 'Define or paste the content of your manifest here'
        }
        readonly
        hideTitle
        id={identifier}
        yaml
        height={expanded ? '800px' : '500px'}
        onChange={() => {}} // all kube yaml inspectors in CE are read only
      />
      <div className="flex items-center justify-between py-5">
        <Button
          icon={expanded ? Minus : Plus}
          data-cy={`expand-collapse-yaml-${identifier}`}
          color="default"
          className="!ml-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
        <BETeaserButton
          featureId={FeatureId.K8S_EDIT_YAML}
          heading="Apply YAML changes"
          message="Applies any changes that you make in the YAML editor by calling the Kubernetes API to patch the relevant resources. Any resource removals or unexpected resource additions that you make in the YAML will be ignored. Note that editing is disabled for resources in namespaces marked as system."
          buttonText="Apply changes"
          data-cy="yaml-inspector-apply-changes-teaser-button"
        />
      </div>
    </div>
  );
}

export function cleanYamlUnwantedFields(yml: string) {
  try {
    const ymls = yml.split('---');
    const cleanYmls = ymls.map((yml) => {
      const y = YAML.parse(yml);
      if (y.metadata) {
        const { managedFields, resourceVersion, ...metadata } = y.metadata;
        y.metadata = metadata;
      }
      return YAML.stringify(y);
    });
    return cleanYmls.join('---\n');
  } catch (e) {
    return yml;
  }
}
