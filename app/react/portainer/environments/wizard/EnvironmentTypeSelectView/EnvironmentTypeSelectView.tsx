import { useState } from 'react';
import { useRouter } from '@uirouter/react';
import { Wand2 } from 'lucide-react';

import { Button } from '@@/buttons';
import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';

import { EnvironmentSelector } from './EnvironmentSelector';
import {
  EnvironmentOptionValue,
  existingEnvironmentTypes,
  newEnvironmentTypes,
} from './environment-types';

export function EnvironmentTypeSelectView() {
  const [types, setTypes] = useState<EnvironmentOptionValue[]>([]);
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Quick Setup"
        breadcrumbs={[{ label: 'Environment Wizard' }]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetTitle icon={Wand2} title="Environment Wizard" />
            <WidgetBody>
              <div className="form-horizontal">
                <FormSection title="Select your environment(s)">
                  <p className="text-muted small">
                    You can onboard different types of environments, select all
                    that apply.
                  </p>
                  <p className="control-label !mb-2">
                    Connect to existing environments
                  </p>
                  <EnvironmentSelector
                    value={types}
                    onChange={setTypes}
                    options={existingEnvironmentTypes}
                  />
                  <p className="control-label !mb-2">Set up new environments</p>
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
                Start Wizard
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
