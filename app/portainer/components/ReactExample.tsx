import { useSref } from '@uirouter/react';

import { react2angular } from '@/react-tools/react2angular';

import { Link } from './Link';
import styles from './ReactExample.module.css';

export interface ReactExampleProps {
  /**
   * Example text to displayed in the component.
   */
  text: string;
}

export function ReactExample({ text }: ReactExampleProps) {
  const route = 'portainer.registries';
  const { onClick, href } = useSref(route);

  return (
    <div className={styles.redBg}>
      {text}
      <div>
        <a href={href} onClick={onClick}>
          Registries useSref
        </a>
      </div>
      <div>
        <Link to={route}>Registries Link</Link>
      </div>
    </div>
  );
}

export const ReactExampleAngular = react2angular(ReactExample, ['text']);
