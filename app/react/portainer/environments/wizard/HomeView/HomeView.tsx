import { Wand2, Plug2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EnvironmentType } from '@/react/portainer/environments/types';
import DockerIcon from '@/assets/ico/vendor/docker-icon.svg?c';
import Kube from '@/assets/ico/kube.svg?c';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Link } from '@@/Link';

import { Option } from '../components/Option';

import { useConnectLocalEnvironment } from './useFetchOrCreateLocalEnvironment';
import styles from './HomeView.module.css';

export function HomeView() {
  const { t } = useTranslation();
  const localEnvironmentAdded = useConnectLocalEnvironment();
  return (
    <>
      <PageHeader
        title={t('wizard.quick_setup')}
        breadcrumbs={[{ label: t('wizard.environment_wizard') }]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetTitle title={t('wizard.environment_wizard')} icon={Wand2} />
            <WidgetBody>
              <div className="row">
                <div className="col-sm-12 form-section-title">
                  {t('wizard.welcome')}
                </div>
                <div className="text-muted small">
                  {localEnvironmentAdded.status === 'success' && (
                    <p>
                      {t('wizard.local_connected', {
                        type: getTypeLabel(localEnvironmentAdded.type),
                      })}
                    </p>
                  )}

                  {localEnvironmentAdded.status === 'error' && (
                    <p>
                      {t('wizard.local_error')}
                      <br />
                      {t('wizard.local_error_help')}{' '}
                      <a
                        href="https://documentation.portainer.io/quickstart/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        https://documentation.portainer.io/quickstart
                      </a>
                    </p>
                  )}

                  <p>{t('wizard.get_started_hint')}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {localEnvironmentAdded.status === 'success' && (
                    <Link
                      to="portainer.home"
                      className={styles.link}
                      data-cy="wizard-get-started-link"
                    >
                      <Option
                        icon={
                          localEnvironmentAdded.type === EnvironmentType.Docker
                            ? DockerIcon
                            : Kube
                        }
                        title={t('wizard.get_started')}
                        description={t('wizard.get_started_description')}
                      />
                    </Link>
                  )}
                  <Link
                    to="portainer.wizard.endpoints"
                    className={styles.link}
                    data-cy="wizard-add-environments-link"
                  >
                    <Option
                      title={t('wizard.add_environments')}
                      icon={Plug2}
                      description={t('wizard.add_environments_description')}
                    />
                  </Link>
                </div>
              </div>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}

function getTypeLabel(type?: EnvironmentType) {
  switch (type) {
    case EnvironmentType.Docker:
      return 'Docker';
    case EnvironmentType.AgentOnDocker:
      return 'Docker Agent';
    case EnvironmentType.KubernetesLocal:
      return 'Kubernetes';
    default:
      return '';
  }
}
