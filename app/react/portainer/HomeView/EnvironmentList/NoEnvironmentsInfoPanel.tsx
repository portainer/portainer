import { useTranslation } from 'react-i18next';

import { InformationPanel } from '@@/InformationPanel';
import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';

export function NoEnvironmentsInfoPanel({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="row">
      <div className="col-sm-12">
        <InformationPanel title={t('common.information')}>
          <TextTip>
            {isAdmin ? (
              <span>
                {t('home.no_environment_admin_prefix')}{' '}
                <Link
                  to="portainer.wizard.endpoints"
                  data-cy="wizard-add-environments-link"
                >
                  {t('home.environment_wizard_link')}
                </Link>{' '}
                {t('home.no_environment_admin_suffix')}
              </span>
            ) : (
              <span>{t('home.no_environment_user')}</span>
            )}
          </TextTip>
        </InformationPanel>
      </div>
    </div>
  );
}
