import { useTranslation } from 'react-i18next';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

export interface Props {
  onSubmit(): void;
  isLoading: boolean;
}

export function SaveAuthSettingsButton({ onSubmit, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <FormSectionTitle>{t('settings.actions_section')}</FormSectionTitle>
      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            loadingText={t('settings.saving')}
            data-cy="save-auth-settings-button"
            isLoading={isLoading}
            onClick={() => onSubmit()}
          >
            {t('settings.save_settings')}
          </LoadingButton>
        </div>
      </div>
    </>
  );
}
