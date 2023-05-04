import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { UpdateNotification } from './UpdateNotifications';
import { BuildInfoModalButton } from './BuildInfoModal';
import '@reach/dialog/styles.css';
import styles from './Footer.module.css';
import Logo from './portainer_logo.svg?c';

export function Footer() {
  return isBE ? <BEFooter /> : <CEFooter />;
}

function CEFooter() {
  return (
    <div className={clsx(styles.root, 'text-center')}>
      <UpdateNotification />

      <FooterContent>
        <Logo width="90px" height="100%" />
        <span>Community Edition</span>

        <BuildInfoModalButton />
      </FooterContent>
    </div>
  );
}

function BEFooter() {
  return (
    <div className={clsx(styles.root, 'text-center')}>
      <FooterContent>
        <span>&copy;</span>
        <span>Portainer Business Edition</span>

        <BuildInfoModalButton />
      </FooterContent>
    </div>
  );
}

function FooterContent({ children }: PropsWithChildren<unknown>) {
  return (
    <div className="mx-auto flex items-center justify-center space-x-1 text-[10px] text-gray-5 be:text-gray-6">
      {children}
    </div>
  );
}
