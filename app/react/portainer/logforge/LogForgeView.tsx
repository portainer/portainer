import { FormEvent, ReactNode, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ExternalLink,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  EnvironmentType,
  PlatformType,
} from '@/react/portainer/environments/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';
import { useIsPureAdmin } from '@/react/hooks/useUser';

import { Alert } from '@@/Alert';
import { Badge, BadgeType } from '@@/Badge';
import { Button, LoadingButton } from '@@/buttons';
import { confirmDelete } from '@@/modals/confirm';
import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import {
  useInstallOrRegisterLogForgeMutation,
  useLogForgeStatus,
  useUninstallOrClearLogForgeMutation,
} from './queries';
import { LogForgeStatus } from './types';

type SetupMode = 'register' | 'install';

const dockerEnvironmentTypes = [
  EnvironmentType.Docker,
  EnvironmentType.AgentOnDocker,
  EnvironmentType.EdgeAgentOnDocker,
] as const;

const embeddedUIFrameScale = 0.78;
const embeddedUIFrameStyle = {
  width: `${100 / embeddedUIFrameScale}%`,
  height: `${100 / embeddedUIFrameScale}%`,
  transform: `scale(${embeddedUIFrameScale})`,
  transformOrigin: 'top left',
};

export function LogForgeView() {
  const [mode, setMode] = useState<SetupMode>('register');
  const [applianceUrl, setApplianceUrl] = useState('');
  const [image, setImage] = useState('logforge/unicron:latest');
  const [stackName, setStackName] = useState('logforge-unicron');
  const [centralFQDN, setCentralFQDN] = useState('logforge.local');
  const [httpsPort, setHTTPSPort] = useState(9444);
  const [mtlsPort, setMTLSPort] = useState(8443);
  const [selectedEndpointId, setSelectedEndpointId] = useState('');
  const [showEmbeddedUI, setShowEmbeddedUI] = useState(false);

  const isAdmin = useIsPureAdmin();
  const statusQuery = useLogForgeStatus();
  const installMutation = useInstallOrRegisterLogForgeMutation();
  const uninstallMutation = useUninstallOrClearLogForgeMutation();
  const environmentList = useEnvironmentList(
    {
      pageLimit: 0,
      types: dockerEnvironmentTypes,
      platformTypes: [PlatformType.Docker],
      excludeSnapshots: true,
      sort: 'Name',
    },
    { enabled: isAdmin }
  );

  const status = statusQuery.data;
  const dockerEnvironments = environmentList.environments;
  const canOpenEmbeddedUI = Boolean(status?.Enabled && status.Access?.Allowed);

  const canSubmit =
    mode === 'register'
      ? applianceUrl.trim().length > 0
      : selectedEndpointId.length > 0;

  const iframeSrc = useMemo(() => {
    if (!status?.BrowserProxyPath) {
      return '/logforge/ui/';
    }
    return status.BrowserProxyPath;
  }, [status?.BrowserProxyPath]);

  return (
    <div className="flex min-h-screen flex-col">
      {!showEmbeddedUI && (
        <PageHeader
          title="LogForge"
          breadcrumbs={[{ label: 'Observability' }, 'LogForge']}
          reload
          loading={statusQuery.isFetching}
          onReload={() => statusQuery.refetch().then(() => undefined)}
        />
      )}

      <div
        className={
          showEmbeddedUI
            ? 'mx-5 mt-5 flex flex-col gap-4'
            : 'mx-5 flex flex-col gap-4'
        }
      >
        {status?.Enabled && showEmbeddedUI && canOpenEmbeddedUI ? (
          <EmbeddedLogForgeUI
            status={status}
            iframeSrc={iframeSrc}
            onBack={() => setShowEmbeddedUI(false)}
          />
        ) : (
          <>
            <StatusWidget
              status={status}
              isLoading={statusQuery.isLoading}
              onOpen={() => setShowEmbeddedUI(true)}
              onClear={() => handleClear(false)}
              onRemove={() => handleClear(true)}
              isClearing={uninstallMutation.isLoading}
              isAdmin={isAdmin}
            />

            {!status?.Enabled && isAdmin && (
              <SetupWidget
                mode={mode}
                setMode={setMode}
                applianceUrl={applianceUrl}
                setApplianceUrl={setApplianceUrl}
                image={image}
                setImage={setImage}
                stackName={stackName}
                setStackName={setStackName}
                centralFQDN={centralFQDN}
                setCentralFQDN={setCentralFQDN}
                httpsPort={httpsPort}
                setHTTPSPort={setHTTPSPort}
                mtlsPort={mtlsPort}
                setMTLSPort={setMTLSPort}
                selectedEndpointId={selectedEndpointId}
                setSelectedEndpointId={setSelectedEndpointId}
                dockerEnvironments={dockerEnvironments}
                isEnvironmentLoading={environmentList.isLoading}
                isSubmitting={installMutation.isLoading}
                canSubmit={canSubmit}
                onSubmit={handleSubmit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    installMutation.mutate(
      mode === 'register'
        ? {
            ApplianceUrl: applianceUrl.trim(),
          }
        : {
            EndpointId: Number(selectedEndpointId),
            ApplianceUrl: applianceUrl.trim() || undefined,
            Image: image.trim(),
            StackName: stackName.trim(),
            CentralFQDN: centralFQDN.trim(),
            HTTPSPort: httpsPort,
            MTLSPort: mtlsPort,
          },
      {
        onSuccess(data) {
          notifySuccess('Success', 'LogForge configured successfully');
          setShowEmbeddedUI(data.Enabled);
        },
      }
    );
  }

  async function handleClear(removeManagedStack: boolean) {
    const confirmed = await confirmDelete(
      removeManagedStack
        ? 'Remove the managed LogForge appliance stack and clear this registration?'
        : 'Clear the LogForge registration from Portainer?'
    );

    if (!confirmed) {
      return;
    }

    uninstallMutation.mutate(
      { RemoveManagedStack: removeManagedStack },
      {
        onSuccess() {
          notifySuccess('Success', 'LogForge configuration cleared');
          setShowEmbeddedUI(false);
        },
      }
    );
  }
}

interface StatusWidgetProps {
  status?: LogForgeStatus;
  isLoading: boolean;
  isClearing: boolean;
  isAdmin: boolean;
  onOpen(): void;
  onClear(): void;
  onRemove(): void;
}

function StatusWidget({
  status,
  isLoading,
  isClearing,
  isAdmin,
  onOpen,
  onClear,
  onRemove,
}: StatusWidgetProps) {
  const visibleEnvironments = status?.Access?.Endpoints?.length ?? 0;
  const canOpen = Boolean(status?.Access?.Allowed);

  return (
    <Widget>
      <WidgetTitle icon={ShieldCheck} title="Appliance status">
        {status && <HealthBadge status={status.Health.Status} />}
      </WidgetTitle>
      <WidgetBody loading={isLoading}>
        {status?.Enabled ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatusField
                label="Mode"
                value={status.Managed ? 'Managed' : 'Registered'}
              />
              <StatusField
                label="Appliance URL"
                value={status.ApplianceUrl || '-'}
              />
              <StatusField label="Proxy path" value={status.BrowserProxyPath} />
              <StatusField
                label="Service key"
                value={
                  status.ServiceKeyPrefix
                    ? `${status.ServiceKeyPrefix}...`
                    : '-'
                }
              />
              <StatusField
                label="Managed auth"
                value={status.ManagedAuthReady ? 'Ready' : 'Not ready'}
              />
              <StatusField
                label="Stack"
                value={status.Stack?.Name || status.StackName || '-'}
              />
              <StatusField
                label="Stack status"
                value={status.Stack ? String(status.Stack.Status) : '-'}
              />
              <StatusField label="Image" value={status.ApplianceImage || '-'} />
              <StatusField
                label="Visible Docker environments"
                value={String(visibleEnvironments)}
              />
              <StatusField
                label="Health checked"
                value={
                  status.Health.CheckedAt
                    ? new Date(status.Health.CheckedAt * 1000).toLocaleString()
                    : '-'
                }
              />
            </div>

            {status.Health.Message && status.Health.Status !== 'healthy' && (
              <Alert color="warn" title="Health check">
                {status.Health.Message}
              </Alert>
            )}

            {!canOpen && (
              <Alert color="warn" title="Access limited">
                Your Portainer account does not have access to any Docker
                environment monitored by LogForge.
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              {canOpen && (
                <Button
                  icon={ExternalLink}
                  onClick={onOpen}
                  data-cy="logforge-open-ui"
                >
                  Open embedded UI
                </Button>
              )}
              {isAdmin && (
                <LoadingButton
                  color="default"
                  icon={RefreshCw}
                  isLoading={isClearing}
                  loadingText="Clearing..."
                  onClick={onClear}
                  type="button"
                  data-cy="logforge-clear-registration"
                >
                  Clear registration
                </LoadingButton>
              )}
              {isAdmin && status.Managed && (
                <LoadingButton
                  color="dangerlight"
                  icon={Trash2}
                  isLoading={isClearing}
                  loadingText="Removing..."
                  onClick={onRemove}
                  type="button"
                  data-cy="logforge-remove-appliance"
                >
                  Remove managed appliance
                </LoadingButton>
              )}
            </div>
          </div>
        ) : (
          <Alert color="info" title="Not configured">
            {isAdmin
              ? 'LogForge is not registered with this Portainer instance.'
              : 'LogForge is not configured. Ask a Portainer administrator to configure a central appliance.'}
          </Alert>
        )}
      </WidgetBody>
    </Widget>
  );
}

interface EmbeddedLogForgeUIProps {
  status: LogForgeStatus;
  iframeSrc: string;
  onBack(): void;
}

function EmbeddedLogForgeUI({
  status,
  iframeSrc,
  onBack,
}: EmbeddedLogForgeUIProps) {
  return (
    <Widget aria-label="Embedded LogForge UI">
      <WidgetTitle icon={Activity} title="LogForge UI">
        <HealthBadge status={status.Health.Status} />
      </WidgetTitle>
      <WidgetBody className="no-padding">
        <div className="flex min-h-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-solid border-gray-4 px-5 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-7">
              <InlineStatus
                label="Mode"
                value={status.Managed ? 'Managed' : 'Registered'}
              />
              <InlineStatus
                label="Stack"
                value={status.Stack?.Name || status.StackName || '-'}
              />
              <InlineStatus label="Proxy" value={status.BrowserProxyPath} />
            </div>
            <Button
              color="default"
              icon={ArrowLeft}
              onClick={onBack}
              data-cy="logforge-back-to-status"
            >
              Back to status
            </Button>
          </div>
          <div className="h-[calc(100vh-145px)] min-h-[520px] overflow-hidden bg-white">
            <iframe
              title="LogForge"
              src={iframeSrc}
              className="border-0 bg-white"
              style={embeddedUIFrameStyle}
            />
          </div>
        </div>
      </WidgetBody>
    </Widget>
  );
}

function InlineStatus({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <span className="font-medium text-gray-9">{label}:</span>{' '}
      <span className="break-all">{value}</span>
    </span>
  );
}

interface SetupWidgetProps {
  mode: SetupMode;
  setMode(mode: SetupMode): void;
  applianceUrl: string;
  setApplianceUrl(value: string): void;
  image: string;
  setImage(value: string): void;
  stackName: string;
  setStackName(value: string): void;
  centralFQDN: string;
  setCentralFQDN(value: string): void;
  httpsPort: number;
  setHTTPSPort(value: number): void;
  mtlsPort: number;
  setMTLSPort(value: number): void;
  selectedEndpointId: string;
  setSelectedEndpointId(value: string): void;
  dockerEnvironments: Array<{ Id: number; Name: string }>;
  isEnvironmentLoading: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}

function SetupWidget({
  mode,
  setMode,
  applianceUrl,
  setApplianceUrl,
  image,
  setImage,
  stackName,
  setStackName,
  centralFQDN,
  setCentralFQDN,
  httpsPort,
  setHTTPSPort,
  mtlsPort,
  setMTLSPort,
  selectedEndpointId,
  setSelectedEndpointId,
  dockerEnvironments,
  isEnvironmentLoading,
  isSubmitting,
  canSubmit,
  onSubmit,
}: SetupWidgetProps) {
  return (
    <Widget>
      <WidgetTitle icon={PlugZap} title="Setup" />
      <WidgetBody>
        <form className="form-horizontal" onSubmit={onSubmit}>
          <div className="form-group">
            <div className="col-sm-12">
              <div className="btn-group" role="group" aria-label="Setup mode">
                <Button
                  color={mode === 'register' ? 'primary' : 'default'}
                  onClick={() => setMode('register')}
                  type="button"
                  data-cy="logforge-register-mode"
                >
                  Register
                </Button>
                <Button
                  color={mode === 'install' ? 'primary' : 'default'}
                  onClick={() => setMode('install')}
                  type="button"
                  data-cy="logforge-install-mode"
                >
                  Install
                </Button>
              </div>
            </div>
          </div>

          {mode === 'install' && (
            <>
              <FormRow label="Environment">
                <select
                  className="form-control"
                  value={selectedEndpointId}
                  onChange={(event) =>
                    setSelectedEndpointId(event.target.value)
                  }
                  disabled={isEnvironmentLoading}
                  data-cy="logforge-environment-select"
                >
                  <option value="">Select a Docker environment</option>
                  {dockerEnvironments.map((environment) => (
                    <option key={environment.Id} value={environment.Id}>
                      {environment.Name}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Stack name">
                <input
                  className="form-control"
                  value={stackName}
                  onChange={(event) => setStackName(event.target.value)}
                  data-cy="logforge-stack-name"
                />
              </FormRow>
              <FormRow label="Image">
                <input
                  className="form-control"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  data-cy="logforge-image"
                />
              </FormRow>
              <FormRow label="Central FQDN">
                <input
                  className="form-control"
                  value={centralFQDN}
                  onChange={(event) => setCentralFQDN(event.target.value)}
                  data-cy="logforge-central-fqdn"
                />
              </FormRow>
              <FormRow label="HTTPS port">
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  max={65535}
                  value={httpsPort}
                  onChange={(event) => setHTTPSPort(Number(event.target.value))}
                  data-cy="logforge-https-port"
                />
              </FormRow>
              <FormRow label="mTLS port">
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  max={65535}
                  value={mtlsPort}
                  onChange={(event) => setMTLSPort(Number(event.target.value))}
                  data-cy="logforge-mtls-port"
                />
              </FormRow>
            </>
          )}

          <FormRow label="Appliance URL">
            <input
              className="form-control"
              value={applianceUrl}
              onChange={(event) => setApplianceUrl(event.target.value)}
              placeholder={
                mode === 'install'
                  ? 'https://127.0.0.1:9444'
                  : 'https://logforge.example.com'
              }
              data-cy="logforge-appliance-url"
            />
          </FormRow>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                isLoading={isSubmitting}
                loadingText="Configuring..."
                disabled={!canSubmit}
                data-cy="logforge-submit"
              >
                {mode === 'install' ? 'Install LogForge' : 'Register LogForge'}
              </LoadingButton>
            </div>
          </div>
        </form>
      </WidgetBody>
    </Widget>
  );
}

function StatusField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded border border-solid border-gray-4 p-3">
      <div className="text-xs font-medium uppercase text-gray-6">{label}</div>
      <div
        className="mt-1 truncate text-sm font-medium text-gray-9"
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-group">
      <label className="col-sm-3 col-lg-2 control-label text-left">
        {label}
      </label>
      <div className="col-sm-9 col-lg-6">{children}</div>
    </div>
  );
}

function HealthBadge({ status }: { status: string }) {
  const type: BadgeType =
    status === 'healthy'
      ? 'success'
      : status === 'unhealthy'
        ? 'danger'
        : status === 'not_configured'
          ? 'muted'
          : 'warn';

  return (
    <Badge type={type} data-cy="logforge-health-badge">
      {status.replace('_', ' ')}
    </Badge>
  );
}
