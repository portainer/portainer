import { useState } from 'react';
import { useRouter } from '@uirouter/react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@@/buttons';
import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';

import { EnvironmentSelector } from './EnvironmentSelector';
import {
  EnvironmentOptionValue,
  getExistingEnvironmentTypes,
  getNewEnvironmentTypes,
} from './environment-types';

export function EnvironmentTypeSelectView() {
  const { t } = useTranslation();
  const [types, setTypes] = useState<EnvironmentOptionValue[]>([]);
  const router = useRouter();

  const existingEnvironmentTypes = getExistingEnvironmentTypes();
  const newEnvironmentTypes = getNewEnvironmentTypes();

  return (
    <>
      <PageHeader
        title={t('wizard_env.quick_setup')}
        breadcrumbs={[{ label: t('wizard_env.environment_wizard') }]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetTitle icon={Wand2} title={t('wizard_env.environment_wizard')} />
            <WidgetBody>
              <div className="form-horizontal">
                <FormSection title={t('wizard_env_types.select_environments')}>
                  <p className="text-muted small">
                    {t('wizard_env_types.select_environments_description')}
                  </p>
                  <p className="control-label !mb-2">
                    {t('wizard_env_types.connect_existing')}
                  </p>
                  <EnvironmentSelector
                    value={types}
                    onChange={setTypes}
                    options={existingEnvironmentTypes}
                  />
                  <p className="control-label !mb-2">{t('wizard_env_types.setup_new')}</p>
                  <EnvironmentSelector
                    value={types}
                    onChange={setTypes}
                    options={newEnvironmentTypes}
                    hiddenSpacingCount={
                      existingEnvironmentTypes.length -
                      newEnvironmentTypes.length
                    }
                  />
                </FormSection>
              </div>
              <Button
                disabled={types.length === 0}
                data-cy="start-wizard-button"
                onClick={() => startWizard()}
                className="!ml-0"
              >
                {t('wizard_env_types.start_wizard')}
              </Button>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );

  function startWizard() {
    if (types.length === 0) {
      return;
    }

    router.stateService.go('portainer.wizard.endpoints.create', {
      envType: types,
    });
  }
}
