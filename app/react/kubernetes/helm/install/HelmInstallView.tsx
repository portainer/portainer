import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { FormSection } from '@@/form-components/FormSection';

import { HelmTemplates } from '../HelmTemplates/HelmTemplates';

export function HelmInstallView() {
  const { t } = useTranslation();
  const environmentId = useEnvironmentId();
  const [namespace, setNamespace] = useState('');
  const [name, setName] = useState('');

  const namespacesQuery = useNamespacesQuery(environmentId);
  const namespaces = useMemo(
    () =>
      Object.values(namespacesQuery.data ?? {}).map((ns) => ({
        label: ns.Name,
        value: ns.Name,
      })),
    [namespacesQuery.data]
  );

  const defaultNamespace =
    namespaces.find((ns) => ns.value === 'default')?.value ||
    namespaces[0]?.value ||
    '';

  // Set default namespace if not set
  if (!namespace && defaultNamespace) {
    setNamespace(defaultNamespace);
  }

  return (
    <>
      <PageHeader title={t('kubernetes.helm.install.title')} breadcrumbs={t('kubernetes.helm.install.title')} reload />
      <div className="row">
        <div className="col-sm-12 form-horizontal">
          <Widget>
            <WidgetBody>
              <FormSection title={t('kubernetes.helm.install.deployTo')}>
                <FormControl label={t('kubernetes.helm.install.namespace')} required>
                  <PortainerSelect
                    value={namespace}
                    onChange={setNamespace}
                    options={namespaces}
                    data-cy="namespace-select"
                  />
                </FormControl>

                <FormControl label={t('kubernetes.helm.install.releaseName')} required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('kubernetes.helm.install.releaseNamePlaceholder')}
                    data-cy="k8sHelmInstall-nameInput"
                  />
                </FormControl>
              </FormSection>

              <HelmTemplates
                namespace={namespace}
                name={name}
                onSelectHelmChart={() => {}}
              />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
