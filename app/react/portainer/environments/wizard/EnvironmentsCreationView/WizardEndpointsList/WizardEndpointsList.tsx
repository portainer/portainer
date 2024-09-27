import { Plug2 } from 'lucide-react';
import clsx from 'clsx';

import { endpointTypeName, stripProtocol } from '@/portainer/filters/filters';
import {
  getEnvironmentTypeIcon,
  isEdgeEnvironment,
  isUnassociatedEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  ENVIRONMENTS_POLLING_INTERVAL,
  useEnvironmentList,
} from '@/react/portainer/environments/queries/useEnvironmentList';

import { EdgeIndicator } from '@@/EdgeIndicator';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Icon } from '@@/Icon';

import styles from './WizardEndpointsList.module.css';

interface Props {
  environmentIds: EnvironmentId[];
}

export function WizardEndpointsList({ environmentIds }: Props) {
  const { environments } = useEnvironmentList(
    { endpointIds: environmentIds },
    {
      refetchInterval: (environments) => {
        if (!environments) {
          return false;
        }

        if (!environments.value.some(isUnassociatedEdgeEnvironment)) {
          return false;
        }

        return ENVIRONMENTS_POLLING_INTERVAL;
      },

      enabled: environmentIds.length > 0,
    }
  );

  return (
    <Widget>
      <WidgetTitle icon={Plug2} title="New Environments" />
      <WidgetBody>
        {environments.map((environment) => (
          <div className={styles.wizardListWrapper} key={environment.Id}>
            <div
              className={clsx(
                styles.wizardListImage,
                'text-blue-8 th-dark:text-blue-7 th-highcontrast:text-white text-5xl'
              )}
            >
              <Icon
                icon={getEnvironmentTypeIcon(
                  environment.Type,
                  environment.ContainerEngine
                )}
                className="mr-1"
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
