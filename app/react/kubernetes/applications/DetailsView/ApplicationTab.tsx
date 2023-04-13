import { UseQueryResult } from 'react-query';
import { User, Clock, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Pod } from 'kubernetes-types/core/v1';

import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

import { Widget, WidgetBody } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';
import { Badge } from '@@/Badge';
import { Link } from '@@/Link';
import { Button, LoadingButton } from '@@/buttons';

import { isSystemNamespace } from '../../namespaces/utils';
import { Application } from '../types';
import {
  appStackNameLabel,
  appKindToDeploymentTypeMap,
  appOwnerLabel,
  appDeployMethodLabel,
  appNoteAnnotation,
} from '../constants';
import {
  applicationIsKind,
  bytesToReadableFormat,
  getResourceRequests,
  getRunningPods,
  getTotalPods,
  isExternalApplication,
} from '../utils';
import { usePatchApplicationMutation } from '../application.queries';

interface Props {
  namespace: string;
  name: string;
  applicationQuery: UseQueryResult<Application, unknown>;
  environmentId: EnvironmentId;
}

export function ApplicationTab({
  namespace,
  name,
  applicationQuery,
  environmentId,
}: Props) {
  const application = applicationQuery.data;
  const systemNamespace = isSystemNamespace(namespace);
  const externalApplication = application && isExternalApplication(application);
  const applicationRequests = application && getResourceRequests(application);
  const applicationOwner = application?.metadata?.labels?.[appOwnerLabel];
  const applicationDeployMethod =
    application?.metadata?.labels?.[appDeployMethodLabel] || 'application form';
  const applicationNote =
    application?.metadata?.annotations?.[appNoteAnnotation];

  const [isNoteOpen, setIsNoteOpen] = useState(true);
  const [applicationNoteFormValues, setApplicationNoteFormValues] = useState(
    applicationNote || ''
  );
  const patchApplicationMutation = usePatchApplicationMutation(
    environmentId,
    namespace,
    name
  );
  useEffect(() => {
    setApplicationNoteFormValues(
      application?.metadata?.annotations?.[appNoteAnnotation] || ''
    );
  }, [
    application?.metadata?.annotations,
    application?.metadata?.annotations?.appNoteAnnotation,
  ]);

  return (
    <Widget>
      <WidgetBody loading={applicationQuery.isLoading}>
        <DetailsTable>
          <tr>
            <td>Name</td>
            <td>
              <div
                className="flex items-center gap-x-2"
                data-cy="k8sAppDetail-appName"
              >
                {name}
                {externalApplication && !systemNamespace && (
                  <Badge type="info">external</Badge>
                )}
              </div>
            </td>
          </tr>
          <tr>
            <td>Stack</td>
            <td data-cy="k8sAppDetail-stackName">
              {application?.metadata?.labels?.[appStackNameLabel] || '-'}
            </td>
          </tr>
          <tr>
            <td>Namespace</td>
            <td>
              <div
                className="flex items-center gap-x-2"
                data-cy="k8sAppDetail-resourcePoolName"
              >
                <Link
                  to="kubernetes.resourcePools.resourcePool"
                  params={{ id: namespace }}
                >
                  {namespace}
                </Link>
                {systemNamespace && <Badge type="info">system</Badge>}
              </div>
            </td>
          </tr>
          <tr>
            <td>Application type</td>
            <td data-cy="k8sAppDetail-appType">{application?.kind || '-'}</td>
          </tr>
          {application?.kind && (
            <tr>
              <td>Status</td>
              {applicationIsKind<Pod>('Pod', application) && (
                <td data-cy="k8sAppDetail-appType">
                  {application?.status?.phase}
                </td>
              )}
              {!applicationIsKind<Pod>('Pod', application) && (
                <td data-cy="k8sAppDetail-appType">
                  {appKindToDeploymentTypeMap[application.kind]}
                  <code className="ml-1">
                    {getRunningPods(application)}
                  </code> / <code>{getTotalPods(application)}</code>
                </td>
              )}
            </tr>
          )}
          {(applicationRequests?.cpu || applicationRequests?.memoryBytes) && (
            <tr>
              <td>
                Resource reservations
                {!applicationIsKind<Pod>('Pod', application) && (
                  <div className="text-muted small">per instance</div>
                )}
              </td>
              <td>
                {applicationRequests?.cpu && (
                  <div data-cy="k8sAppDetail-cpuReservation">
                    CPU {applicationRequests.cpu}
                  </div>
                )}
                {applicationRequests?.memoryBytes && (
                  <div data-cy="k8sAppDetail-memoryReservation">
                    Memory{' '}
                    {bytesToReadableFormat(applicationRequests.memoryBytes)}
                  </div>
                )}
              </td>
            </tr>
          )}
          <tr>
            <td>Creation</td>
            <td>
              <div className="flex flex-wrap items-center gap-3">
                {applicationOwner && (
                  <span
                    className="flex items-center gap-1"
                    data-cy="k8sAppDetail-owner"
                  >
                    <User />
                    {applicationOwner}
                  </span>
                )}
                <span
                  className="flex items-center gap-1"
                  data-cy="k8sAppDetail-creationDate"
                >
                  <Clock />
                  {moment(application?.metadata?.creationTimestamp).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )}
                </span>
                <span
                  className="flex items-center gap-1"
                  data-cy="k8sAppDetail-creationMethod"
                >
                  <Clock />
                  Deployed from {applicationDeployMethod}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <form className="form-horizontal">
                <div className="form-group">
                  <div className="col-sm-12 vertical-center">
                    <Edit /> Note
                    <Button
                      size="xsmall"
                      type="button"
                      color="light"
                      data-cy="k8sAppDetail-expandNoteButton"
                      onClick={() => setIsNoteOpen(!isNoteOpen)}
                    >
                      {isNoteOpen ? 'Collapse' : 'Expand'}
                      {isNoteOpen ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </div>

                {isNoteOpen && (
                  <>
                    <div className="form-group">
                      <div className="col-sm-12">
                        <textarea
                          className="form-control resize-y"
                          name="application_note"
                          id="application_note"
                          value={applicationNoteFormValues}
                          onChange={(e) =>
                            setApplicationNoteFormValues(e.target.value)
                          }
                          rows={5}
                          placeholder="Enter a note about this application..."
                        />
                      </div>
                    </div>

                    <Authorized authorizations="K8sApplicationDetailsW">
                      <div className="form-group">
                        <div className="col-sm-12">
                          <LoadingButton
                            color="primary"
                            size="small"
                            className="!ml-0"
                            type="button"
                            onClick={() => patchApplicationNote()}
                            disabled={
                              applicationNoteFormValues ===
                              (applicationNote || '')
                            }
                            data-cy="k8sAppDetail-saveNoteButton"
                            isLoading={patchApplicationMutation.isLoading}
                            loadingText={
                              applicationNote ? 'Updating' : 'Saving'
                            }
                          >
                            {applicationNote ? 'Update' : 'Save'} note
                          </LoadingButton>
                        </div>
                      </div>
                    </Authorized>
                  </>
                )}
              </form>
            </td>
          </tr>
        </DetailsTable>
      </WidgetBody>
    </Widget>
  );

  async function patchApplicationNote() {
    const path = `/metadata/annotations/${appNoteAnnotation}`;
    const value = applicationNoteFormValues;
    if (application?.kind) {
      try {
        await patchApplicationMutation.mutateAsync({
          appKind: application.kind,
          path,
          value,
        });
        notifySuccess('Success', 'Application successfully updated');
      } catch (error) {
        notifyError(
          `Failed to ${applicationNote ? 'update' : 'save'} note`,
          error as Error
        );
      }
    }
  }
}
