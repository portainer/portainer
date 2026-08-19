import { useStore } from 'zustand';

import { TextTip } from '@@/Tip/TextTip';
import { FormSection } from '@@/form-components/FormSection';

import { summaryStore } from './store';

export type SummaryAction = {
  action: string;
  kind: string;
  name: string;
  type?: string;
};

type Props = {
  actions?: SummaryAction[];
  cpuLimit?: string | null;
  memoryLimit?: string | null;
};

export function KubernetesSummaryView({
  actions = [],
  cpuLimit,
  memoryLimit,
}: Props) {
  const { isExpanded, setIsExpanded } = useStore(summaryStore);

  if (actions.length === 0) {
    return null;
  }

  return (
    <FormSection
      title="Summary"
      isFoldable
      defaultFolded={!isExpanded}
      setIsDefaultFolded={(isFolded) => setIsExpanded(!isFolded)}
    >
      <TextTip color="blue">
        Portainer will execute the following Kubernetes actions.
      </TextTip>
      <ul className="small text-muted ml-5 w-full">
        {actions.map((action, idx) => {
          if (!action.action || !action.kind || !action.name) {
            return null;
          }
          return (
            <li key={`${idx}-${action.kind}-${action.name}`}>
              {`${action.action} ${getArticle(action.action)} `}
              <span className="bold">{action.kind}</span>
              {' named '}
              <code>{action.name}</code>
              {!!action.type && (
                <span>
                  {' of type '}
                  <code>{action.type}</code>
                </span>
              )}
            </li>
          );
        })}
        {!!memoryLimit && (
          <li>
            Set the memory resources limits and requests to{' '}
            <code>{memoryLimit}M</code>
          </li>
        )}
        {!!cpuLimit && (
          <li>
            Set the CPU resources limits and requests to <code>{cpuLimit}</code>
          </li>
        )}
      </ul>
    </FormSection>
  );
}

function getArticle(resourceAction: string): string {
  if (resourceAction !== 'Create') {
    return 'the';
  }
  return 'a';
}
