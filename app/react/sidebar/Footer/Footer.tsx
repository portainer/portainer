import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { isBE } from '@/portainer/feature-flags/feature-flags.service';

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
        <Logo width="90px" height="" />
        <span>Community Edition</span>

        <BuildInfoModalButton />

        <a
          href="https://www.portainer.io/install-BE-now"
          className="text-blue-6 font-medium"
          target="_blank"
          rel="noreferrer"
        >
          Upgrade
        </a>
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
    <div className="text-[10px] space-x-1 text-gray-5 be:text-gray-6 flex items-center mx-auto justify-center">
      {children}
    </div>
  );
}
