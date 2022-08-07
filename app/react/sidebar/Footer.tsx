import { useState } from 'react';
import { useQuery } from 'react-query';
import clsx from 'clsx';
import { Database, Hash, Server, Tag, Tool } from 'react-feather';
import { DialogOverlay } from '@reach/dialog';

import {
  getStatus,
  getVersionStatus,
} from '@/portainer/services/api/status.service';
import { isBE } from '@/portainer/feature-flags/feature-flags.service';

import { Button } from '@@/buttons';

import { UpdateNotification } from './UpdateNotifications';
import '@reach/dialog/styles.css';
import styles from './Footer.module.css';
import Logo from './portainer_logo.svg?c';

export function Footer() {
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  const statusQuery = useStatus();
  const versionQuery = useVersionStatus();

  if (!statusQuery.data || !versionQuery.data) {
    return null;
  }

  const { Edition, Version } = statusQuery.data;
  const { ServerVersion, DatabaseVersion, Build } = versionQuery.data;

  function toggleModal() {
    setShowBuildInfo(!showBuildInfo);
  }

  return (
    <>
      <DialogOverlay className={styles.dialog} isOpen={showBuildInfo}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={toggleModal}>
                ×
              </button>
              <h5 className="modal-title">Portainer {Edition}</h5>
            </div>
            <div className="modal-body">
              <div className={styles.versionInfo}>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <span className="inline-flex items-center">
                          <Server size="13" className="space-right" />
                          Server Version: {ServerVersion}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center">
                          <Database size="13" className="space-right" />
                          Database Version: {DatabaseVersion}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="inline-flex items-center">
                          <Hash size="13" className="space-right" />
                          CI Build Number: {Build.BuildNumber}
                        </span>
                      </td>
                      <td>
                        <span>
                          <Tag size="13" className="space-right" />
                          Image Tag: {Build.ImageTag}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.toolsList}>
                <span className="inline-flex items-center">
                  <Tool size="13" className="space-right" />
                  Compilation tools:
                </span>

                <div className={styles.tools}>
                  <span className="text-muted small">
                    Nodejs v{Build.NodejsVersion}
                  </span>
                  <span className="text-muted small">
                    Yarn v{Build.YarnVersion}
                  </span>
                  <span className="text-muted small">
                    Webpack v{Build.WebpackVersion}
                  </span>
                  <span className="text-muted small">
                    Go v{Build.GoVersion}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="bootbox-accept" onClick={toggleModal}>
                Ok
              </Button>
            </div>
          </div>
        </div>
      </DialogOverlay>

      <div className={clsx(styles.root, 'text-center')}>
        {!isBE && <UpdateNotification />}
        <div className="text-[10px] space-x-1 text-gray-5 be:text-gray-6 flex items-center mx-auto">
          {isBE ? (
            <>
              <span>&copy;</span>
              <span>Portainer Business Edition</span>
            </>
          ) : (
            <>
              <Logo width="90px" height="" />
              <span>Community Edition</span>
            </>
          )}

          <span
            data-cy="portainerSidebar-versionNumber"
            onClick={toggleModal}
            // Accessibility requirements for a clickable span
            onKeyPress={toggleModal}
            role="button"
            tabIndex={0}
          >
            {Version}
          </span>

          {!isBE && (
            <a
              href="https://www.portainer.io/install-BE-now"
              className="text-blue-6 font-medium"
              target="_blank"
              rel="noreferrer"
            >
              Upgrade
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function useStatus() {
  return useQuery(['status'], () => getStatus());
}

function useVersionStatus() {
  return useQuery(['version'], () => getVersionStatus());
}
