import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { ApplicationFormValues } from '../../types';

import { getAppResourceSummaries, getArticle } from './utils';
import { Summary } from './types';

type Props = {
  formValues: ApplicationFormValues;
  oldFormValues: ApplicationFormValues;
};

export function ApplicationSummarySection({
  formValues,
  oldFormValues,
}: Props) {
  // extract cpu and memory requests & limits for pod
  const limits = {
    cpu: formValues.CpuLimit,
    memory: formValues.MemoryLimit,
  };
  const appResourceSummaries = getAppResourceSummaries(
    formValues,
    oldFormValues
  );

  if (!appResourceSummaries || appResourceSummaries?.length === 0) {
    return null;
  }

  return (
    <FormSection title="Summary" isFoldable defaultFolded={false}>
      <TextTip color="blue">
        Portainer will execute the following Kubernetes actions.
      </TextTip>
      <ul className="w-full small text-muted ml-5">
        {appResourceSummaries.map((summary) => (
          <SummaryItem key={JSON.stringify(summary)} summary={summary} />
        ))}
        {!!limits.memory && (
          <li>
            Set the memory resources limits and requests to{' '}
            <code>{limits.memory}M</code>
          </li>
        )}
        {!!limits.cpu && (
          <li>
            Set the CPU resources limits and requests to{' '}
            <code>{limits.cpu}</code>
          </li>
        )}
      </ul>
    </FormSection>
  );
}

function SummaryItem({ summary }: { summary: Summary }) {
  return (
    <li>
      {`${summary.action} ${getArticle(summary.kind, summary.action)} `}
      <span className="bold">{summary.kind}</span>
      {' named '}
      <code>{summary.name}</code>
      {!!summary.type && (
        <span>
          {' of type '}
          <code>{summary.type}</code>
        </span>
      )}
    </li>
  );
}
