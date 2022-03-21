import { useSref } from '@uirouter/react';
import { Trans, useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import { react2angular } from '@/react-tools/react2angular';

import { Link } from './Link';
import styles from './ReactExample.module.css';

export interface ReactExampleProps {
  /**
   * Example text to displayed in the component.
   */
  text: string;
}

const lngs = {
  en: { nativeName: 'English' },
  de: { nativeName: 'Deutsch' },
  he: { nativeName: 'Hebrew' },
};

export function ReactExample({ text }: ReactExampleProps) {
  const route = 'portainer.registries';
  const { onClick, href } = useSref(route);
  const { t } = useTranslation();

  return (
    <div>
      <div className={styles.redBg}>{text}</div>
      <div>
        <a href={href} onClick={onClick}>
          {t('Registries useSref')}
        </a>
      </div>
      <div>
        <Link to={route}>
          <Trans>
            Registries <strong>Link</strong>
          </Trans>
        </Link>
      </div>
      {Object.entries(lngs).map(([lng, lngConfig]) => (
        <button
          key={lng}
          style={{
            fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal',
          }}
          type="submit"
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lngConfig.nativeName}
        </button>
      ))}
    </div>
  );
}

export const ReactExampleAngular = react2angular(ReactExample, ['text']);
