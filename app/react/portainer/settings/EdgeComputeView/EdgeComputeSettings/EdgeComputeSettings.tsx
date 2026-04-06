import { Formik, Form } from 'formik';
import { Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Settings } from '@/react/portainer/settings/types';
import { PortainerUrlField } from '@/react/portainer/common/PortainerUrlField';
import { PortainerTunnelAddrField } from '@/react/portainer/common/PortainerTunnelAddrField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Switch } from '@@/form-components/SwitchField/Switch';
import { FormControl } from '@@/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';

import { validationSchema } from './EdgeComputeSettings.validation';
import { FormValues } from './types';

interface Props {
  settings?: Settings;
  onSubmit(values: FormValues): void;
}

export function EdgeComputeSettings({ settings, onSubmit }: Props) {
  const { t } = useTranslation();

  if (!settings) {
    return null;
  }

  const initialValues: FormValues = {
    EnableEdgeComputeFeatures: settings.EnableEdgeComputeFeatures,
    EdgePortainerUrl: settings.EdgePortainerUrl,
    Edge: {
      TunnelServerAddress: settings.Edge?.TunnelServerAddress,
    },
    EnforceEdgeID: settings.EnforceEdgeID,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon={Laptop} title={t('settings.edge_compute_title')} />

        <WidgetBody>
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={() => validationSchema()}
            onSubmit={onSubmit}
            validateOnMount
          >
            {({
              values,
              errors,
              handleSubmit,
              setFieldValue,
              isSubmitting,
              isValid,
              dirty,
            }) => (
              <Form
                className="form-horizontal"
                onSubmit={handleSubmit}
                noValidate
              >
                <FormControl
                  inputId="edge_enable"
                  label={t('settings.edge_enable_label')}
                  size="small"
                  errors={errors.EnableEdgeComputeFeatures}
                >
                  <Switch
                    id="edge_enable"
                    data-cy="edge-enable-switch"
                    name="edge_enable"
                    className="space-right"
                    checked={values.EnableEdgeComputeFeatures}
                    onChange={(e) =>
                      setFieldValue('EnableEdgeComputeFeatures', e)
                    }
                  />
                </FormControl>

                <TextTip color="blue" className="mb-2">
                  {t('settings.edge_enable_tip')}
                </TextTip>

                {isBE && values.EnableEdgeComputeFeatures && (
                  <>
                    <PortainerUrlField
                      fieldName="EdgePortainerUrl"
                      tooltip={t('settings.edge_portainer_url_tooltip')}
                    />

                    <PortainerTunnelAddrField fieldName="Edge.TunnelServerAddress" />
                  </>
                )}

                <FormControl
                  inputId="edge_enforce_id"
                  label={t('settings.edge_enforce_id_label')}
                  size="small"
                  tooltip={t('settings.edge_enforce_id_tooltip')}
                  errors={errors.EnforceEdgeID}
                >
                  <Switch
                    id="edge_enforce_id"
                    data-cy="edge-enforce-id-switch"
                    name="edge_enforce_id"
                    className="space-right"
                    checked={values.EnforceEdgeID}
                    onChange={(e) =>
                      setFieldValue('EnforceEdgeID', e.valueOf())
                    }
                  />
                </FormControl>

                <div className="form-group mt-5">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      data-cy="settings-edgeComputeButton"
                      isLoading={isSubmitting}
                      loadingText={t('settings.saving_settings')}
                    >
                      {t('settings.save_settings')}
                    </LoadingButton>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </WidgetBody>
      </Widget>
    </div>
  );
}
