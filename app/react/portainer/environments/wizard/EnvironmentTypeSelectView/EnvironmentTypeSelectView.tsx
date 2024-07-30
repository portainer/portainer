import { useState } from 'react';
import { useRouter } from '@uirouter/react';
import _ from 'lodash';
import { Wand2 } from 'lucide-react';

import { useAnalytics } from '@/react/hooks/useAnalytics';
import { useFeatureFlag } from '@/react/portainer/feature-flags/useFeatureFlag';

import { Button } from '@@/buttons';
import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';

import { EnvironmentSelector } from './EnvironmentSelector';
import {
  EnvironmentOptionValue,
  getExistingEnvironmentTypes,
  newEnvironmentTypes,
  getEnvironmentTypes,
} from './environment-types';

export function EnvironmentTypeSelectView() {
  const [types, setTypes] = useState<EnvironmentOptionValue[]>([]);
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const { data: isPodmanEnabled } = useFeatureFlag('podman');
  const existingEnvironmentTypes = getExistingEnvironmentTypes(
    !!isPodmanEnabled
  );
  const environmentTypes = getEnvironmentTypes(!!isPodmanEnabled);

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

    const steps = _.compact(
      types.map((id) => environmentTypes.find((eType) => eType.id === id))
    );

    trackEvent('endpoint-wizard-endpoint-select', {
      category: 'portainer',
      metadata: {
        environment: steps.map((step) => step.label).join('/'),
      },
    });

    router.stateService.go('portainer.wizard.endpoints.create', {
      envType: types,
    });
  }
}
