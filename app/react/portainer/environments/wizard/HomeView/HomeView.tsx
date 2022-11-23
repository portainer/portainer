import { EnvironmentType } from '@/react/portainer/environments/types';
import { useAnalytics } from '@/angulartics.matomo/analytics-services';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Link } from '@@/Link';

import { Option } from '../components/Option';

import { useConnectLocalEnvironment } from './useFetchOrCreateLocalEnvironment';
import styles from './HomeView.module.css';

export function HomeView() {
  const localEnvironmentAdded = useConnectLocalEnvironment();
  const { trackEvent } = useAnalytics();
  return (
    <>
      <PageHeader
        title="Quick Setup"
        breadcrumbs={[{ label: 'Environment Wizard' }]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetTitle title="Environment Wizard" icon="svg-magic" />
            <WidgetBody>
              <div className="row">
                <div className="col-sm-12 form-section-title">
                  Welcome to Portainer
                </div>
                <div className="text-muted small">
                  {localEnvironmentAdded.status === 'success' && (
                    <p>
                      We have connected your local environment of{' '}
                      {getTypeLabel(localEnvironmentAdded.type)} to Portainer.
                    </p>
                  )}

                  {localEnvironmentAdded.status === 'error' && (
                    <p>
                      We could not connect your local environment to Portainer.
                      <br />
                      Please ensure your environment is correctly exposed. For
                      help with installation visit
                      <a href="https://documentation.portainer.io/quickstart/">
                        https://documentation.portainer.io/quickstart
                      </a>
                    </p>
                  )}

                  <p>
                    Get started below with your local portainer or connect more
                    container environments.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {localEnvironmentAdded.status === 'success' && (
                    <Link to="portainer.home" className={styles.link}>
                      <Option
                        icon={
                          localEnvironmentAdded.type === EnvironmentType.Docker
                            ? 'fab fa-docker'
                            : 'fas fa-dharmachakra'
                        }
                        title="Get Started"
                        description="Proceed using the local environment which Portainer is running in"
                        onClick={() => trackLocalEnvironmentAnalytics()}
                      />
                    </Link>
                  )}
                  <Link to="portainer.wizard.endpoints" className={styles.link}>
                    <Option
                      title="Add Environments"
                      icon="fa fa-plug"
                      description="Connect to other environments"
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

  function trackLocalEnvironmentAnalytics() {
    trackEvent('endpoint-wizard-endpoint-select', {
      category: 'portainer',
      metadata: { environment: 'Get-started-local-environment' },
    });
  }
}

function getTypeLabel(type?: EnvironmentType) {
  switch (type) {
    case EnvironmentType.Docker:
      return 'Docker';
    case EnvironmentType.KubernetesLocal:
      return 'Kubernetes';
    default:
      return '';
  }
}
