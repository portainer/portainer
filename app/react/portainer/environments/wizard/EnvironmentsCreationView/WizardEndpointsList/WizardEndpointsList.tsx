import clsx from 'clsx';

import {
  environmentTypeIcon,
  endpointTypeName,
  stripProtocol,
} from '@/portainer/filters/filters';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { EdgeIndicator } from '@/portainer/home/EnvironmentList/EnvironmentItem';
import {
  isEdgeEnvironment,
  isUnassociatedEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import {
  ENVIRONMENTS_POLLING_INTERVAL,
  useEnvironmentList,
} from '@/react/portainer/environments/queries/useEnvironmentList';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import styles from './WizardEndpointsList.module.css';

interface Props {
  environmentIds: EnvironmentId[];
}

export function WizardEndpointsList({ environmentIds }: Props) {
  const { environments } = useEnvironmentList(
    { endpointIds: environmentIds },
    (environments) => {
      if (!environments) {
        return false;
      }

      if (!environments.value.some(isUnassociatedEdgeEnvironment)) {
        return false;
      }

      return ENVIRONMENTS_POLLING_INTERVAL;
    },
    0,
    environmentIds.length > 0
  );

  return (
    <Widget>
      <WidgetTitle icon="svg-plug" title="New Environments" />
      <WidgetBody>
        {environments.map((environment) => (
          <div className={styles.wizardListWrapper} key={environment.Id}>
            <div className={styles.wizardListImage}>
              <i
                aria-hidden="true"
                className={clsx(
                  'space-right',
                  environmentTypeIcon(environment.Type)
                )}
              />
            </div>
            <div className={styles.wizardListTitle}>{environment.Name}</div>
            <div className={styles.wizardListSubtitle}>
              URL: {stripProtocol(environment.URL)}
            </div>
            <div className={styles.wizardListType}>
              Type: {endpointTypeName(environment.Type)}
            </div>
            {isEdgeEnvironment(environment.Type) && (
              <div className={styles.wizardListEdgeStatus}>
                <EdgeIndicator environment={environment} />
              </div>
            )}
          </div>
        ))}
      </WidgetBody>
    </Widget>
  );
}
