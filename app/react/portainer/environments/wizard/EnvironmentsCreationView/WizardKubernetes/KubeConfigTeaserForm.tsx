import { Field, Form, Formik } from 'formik';
import { Plug2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { FormControl } from '@@/form-components/FormControl';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { Input } from '@@/form-components/Input';
import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';
import { useDocsUrl } from '@@/PageHeader/ContextHelp';

const initialValues = {
  kubeConfig: '',
  name: '',
  meta: {
    groupId: 1,
    tagIds: [],
  },
};

export function KubeConfigTeaserForm() {
  const { t } = useTranslation();
  const kubeConfigImportDocUrl = useDocsUrl(
    '/admin/environments/add/kubernetes/import'
  );

  return (
    <Formik initialValues={initialValues} onSubmit={() => {}} validateOnMount>
      {() => (
        <Form>
          <FormSectionTitle>
            {t('wizard_kube_scripts.kube_config_details')}
          </FormSectionTitle>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue">
                <span className="text-muted">
                  <a
                    href={kubeConfigImportDocUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('wizard_kube_scripts.kube_config_import_file')}
                  </a>{' '}
                  {t('wizard_kube_scripts.kube_config_desc')}
                </span>
              </TextTip>
            </div>
            <div className="col-sm-12 text-muted text-xs">
              <ul className="p-2 pl-4">
                <li>{t('wizard_kube_scripts.kube_config_req1')}</li>
                <li>{t('wizard_kube_scripts.kube_config_req2')}</li>
                <li>{t('wizard_kube_scripts.kube_config_req3')}</li>
              </ul>
              <p>{t('wizard_kube_scripts.kube_config_cloud_note')}</p>
            </div>
          </div>

          <FormControl label={t('wizard_kube_scripts.name_label')} required>
            <Field
              name="name"
              as={Input}
              data-cy="endpointCreate-nameInput"
              placeholder={t('wizard_kube_scripts.name_placeholder')}
              readOnly
            />
          </FormControl>

          <FormControl
            label={t('wizard_kube_scripts.kubeconfig_file')}
            required
            inputId="kubeconfig_file"
          >
            <Button disabled data-cy="kubeconfig-file-upload">
              {t('wizard_kube_scripts.select_file')}
            </Button>
          </FormControl>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                className="wizard-connect-button !ml-0"
                data-cy="kubeconfig-connect-environment-button"
                loadingText={t('wizard_env.connecting')}
                isLoading={false}
                disabled
                icon={Plug2}
              >
                {t('wizard_env.connect')}
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
