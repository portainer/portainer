import { PropsWithChildren, ReactNode } from 'react';

import styles from './SidebarSection.module.css';

interface Props {
  title: ReactNode;
  label?: string;
}

export function SidebarSection({
  title,
  label,
  children,
}: PropsWithChildren<Props>) {
  const labelText = typeof title === 'string' ? title : label;

  return (
    <>
      <li className={styles.sidebarTitle}>{title}</li>

      <nav aria-label={labelText}>
        <ul>{children}</ul>
      </nav>
    </>
  );
}
