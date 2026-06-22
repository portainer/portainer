import { ReactNode } from 'react';
import { CheckCircle, GitMerge, Loader2, XCircle } from 'lucide-react';

import { truncateLeftRight } from '@/portainer/filters/filters';
import { baseStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { GitCommitLink } from '@/react/portainer/gitops/GitCommitLink';
import { useGitRefs } from '@/react/portainer/gitops/queries/useGitRefs';
import { useSearch } from '@/react/portainer/gitops/queries/useSearch';
import { isGitConfigDiverged } from '@/react/portainer/gitops/utils';
import { AutomationTestingProps } from '@/types';
import {
  AutoUpdateResponse,
  RepoConfigResponse,
} from '@/react/portainer/gitops/types';
import { StackDeploymentInfo } from '@/react/common/stacks/types';
import { useSource } from '@/react/portainer/gitops/sources/queries/useSource';

import { CopyButton } from '@@/buttons';
import { Card } from '@@/Card';
import { Icon } from '@@/Icon';
import { Alert } from '@@/Alert';
import { Link } from '@@/Link';

import { getGitValidityError } from './hooks/useGitRepoValidity';

export function GitReferenceCard({
  stackType,
  gitConfig,
  autoUpdate,
  currentDeploymentInfo,
  sourceId,
}: {
  stackType: 'docker' | 'helm' | 'edge' | 'edge-helm' | 'kubernetes';
  gitConfig: RepoConfigResponse;
  autoUpdate?: AutoUpdateResponse | null;
  currentDeploymentInfo?: StackDeploymentInfo | null;
  sourceId: number;
}) {
  const hasDivergence = isGitConfigDiverged(gitConfig, currentDeploymentInfo);

  const deployed = hasDivergence ? currentDeploymentInfo : undefined;
  const url = deployed?.RepositoryURL ?? gitConfig.URL;
  const configFilePath = deployed?.ConfigFilePath ?? gitConfig.ConfigFilePath;
  const reference = deployed?.ReferenceName ?? gitConfig.ReferenceName;
  const commitId = deployed?.ConfigHash ?? gitConfig.ConfigHash;
  const sourceIdToShow = deployed?.SourceID ?? sourceId;

  const refCheckQuery = useGitRefs(
    {
      sourceId: sourceIdToShow,
    },
    { enabled: !!sourceIdToShow, suppressError: true }
  );

  const repoError = getGitValidityError(
    refCheckQuery.error,
    !!gitConfig.Authentication
  );
  const hasRepoError = refCheckQuery.isError;

  const foundRef =
    !!reference &&
    !!refCheckQuery.data &&
    refCheckQuery.data.includes(reference);

  const hasRefError = !reference || (refCheckQuery.isSuccess && !foundRef);

  // check file
  const enableFileCheck = stackType !== 'helm' && stackType !== 'edge-helm';
  const fileCheckQuery = useSearch(
    {
      keyword: configFilePath || '',
      reference,
      sourceId: sourceIdToShow,
    },
    enableFileCheck &&
      !!sourceIdToShow &&
      !!reference &&
      !!configFilePath &&
      !hasRepoError &&
      !hasRefError
  );

  const foundFile =
    !!configFilePath &&
    !!fileCheckQuery.data &&
    fileCheckQuery.data.includes(configFilePath);

  const hasFileError =
    enableFileCheck &&
    (!configFilePath ||
      fileCheckQuery.isError ||
      (fileCheckQuery.isFetched && !foundFile));

  const { Interval: autoUpdateInterval, Webhook: webhook } = autoUpdate || {};
  const webhookUrl = webhook ? `${baseStackWebhookUrl()}/${webhook}` : '';

  const isRefLoading = refCheckQuery.isFetching;
  const isFileLoading = enableFileCheck && fileCheckQuery.isFetching;

  const hasError = hasRepoError || hasRefError || hasFileError;
  const explainedError = getExplainedError(
    refCheckQuery.error,
    fileCheckQuery.error
  );
  const infoMessage = explainedError || repoError;

  return (
    <Card>
      <div className="form-section-title !mt-0 flex items-center gap-2">
        <Icon icon={GitMerge} /> Managed by Git
      </div>
      {hasError && (
        <>
          <Alert color="error" className="mb-5">
            <div className="flex flex-col">
              {hasRepoError && (
                <div>
                  The git repository <span>{url || ''}</span> could not be
                  reached.
                </div>
              )}
              {hasRefError && (
                <div>
                  The git reference <span>{reference || ''}</span> could not be
                  found on the remote repository.
                </div>
              )}
              {hasFileError && (
                <div>
                  The referenced file{' '}
                  <span className="muted">{configFilePath || ''}</span> could
                  not be found on the remote repository.
                </div>
              )}
            </div>
          </Alert>
          {!!infoMessage && (
            <Alert color="info" className="mb-5">
              {infoMessage}
            </Alert>
          )}
        </>
      )}

      <div
        className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm lg:grid-cols-2 xl:grid-cols-3"
        data-cy="git-reference-card-info"
      >
        <LineItem
          label="Repo"
          value={url || 'missing'}
          title={url || 'missing'}
          isLoading={isRefLoading}
          isValid={!!url && !hasRepoError}
          isError={!url || hasRepoError}
          data-cy="git-url"
        />
        <LineItem
          label="Ref"
          value={reference || 'missing'}
          title={reference || 'missing'}
          isLoading={isRefLoading}
          isValid={foundRef}
          isError={!reference || hasRefError}
          data-cy="git-ref"
        />
        {enableFileCheck && (
          <LineItem
            label="File"
            value={configFilePath || 'missing'}
            title={configFilePath || 'missing'}
            isLoading={isFileLoading}
            isValid={foundFile}
            isError={!configFilePath || hasFileError}
            data-cy="git-file-path"
          />
        )}
        {!!sourceIdToShow && <SourceLineItem sourceId={sourceIdToShow} />}
        {!!commitId && (
          <LineItem
            label="Commit"
            value={<GitCommitLink baseURL={url || ''} commitHash={commitId} />}
            title={commitId}
            data-cy="git-commit"
          />
        )}
        <LineItem
          label="Auto-update"
          value={autoUpdate ? 'On' : 'Off'}
          title="auto-update"
          data-cy="git-auto-update"
        />
        {!!autoUpdateInterval && (
          <LineItem
            label="Interval"
            value={autoUpdateInterval}
            title="auto-update-interval"
            data-cy="git-interval"
          />
        )}
        {!!webhook && (
          <LineItem
            label="Webhook"
            value={
              <>
                <span data-cy="git-webhook-url">
                  {truncateLeftRight(webhookUrl, 0, 10, 25)}
                </span>
                <CopyButton
                  copyText={webhookUrl}
                  color="light"
                  data-cy="git-webhook-copy-button"
                >
                  Copy link
                </CopyButton>
              </>
            }
            title="webhook"
            data-cy="git-webhook"
          />
        )}
      </div>
      {currentDeploymentInfo && hasDivergence && (
        <DivergenceAlert
          gitConfig={gitConfig}
          currentDeploymentInfo={currentDeploymentInfo}
        />
      )}
    </Card>
  );
}

function SourceLineItem({ sourceId }: { sourceId: number }) {
  const sourceQuery = useSource(sourceId);
  const sourceName = sourceQuery.data?.name;

  return (
    <LineItem
      label="Source"
      value={
        sourceName ? (
          <Link
            to="portainer.gitops.sources.item"
            params={{ sourceId }}
            data-cy="git-source-link"
          >
            {sourceName}
          </Link>
        ) : sourceQuery.isLoading ? (
          ''
        ) : (
          'not found'
        )
      }
      title={sourceName ?? ''}
      isLoading={sourceQuery.isLoading}
      isError={sourceQuery.isError || (!sourceQuery.isLoading && !sourceName)}
      isValid={!!sourceName}
      data-cy="git-source"
    />
  );
}

function DivergenceAlert({
  gitConfig,
  currentDeploymentInfo,
}: {
  gitConfig: RepoConfigResponse;
  currentDeploymentInfo: StackDeploymentInfo;
}) {
  const urlChanged =
    typeof currentDeploymentInfo.RepositoryURL !== 'undefined' &&
    currentDeploymentInfo.RepositoryURL !== gitConfig.URL;

  const refChanged =
    typeof currentDeploymentInfo.ReferenceName !== 'undefined' &&
    currentDeploymentInfo.ReferenceName !== gitConfig.ReferenceName;

  return (
    <Alert color="info" className="mt-4">
      <div className="flex flex-col gap-1 text-sm">
        <strong>Settings changed since last deploy</strong>
        <div>
          Next: {urlChanged && <code>{gitConfig.URL ?? ''}</code>}{' '}
          {refChanged && <code>{gitConfig.ReferenceName ?? ''}</code>} Config:{' '}
          <code>{gitConfig.ConfigFilePath ?? ''}</code>
        </div>
      </div>
    </Alert>
  );
}

function getExplainedError(...errors: Array<unknown | null>) {
  if (
    errors.some(
      (e) =>
        e instanceof Error &&
        e?.message.startsWith(
          'Authentication required: Invalid username or token'
        )
    )
  ) {
    return 'The configured Git Credentials are invalid or expired. Update the credentials to restore access.';
  }
  return '';
}

function LineItem({
  label,
  isLoading,
  isValid,
  isError,
  value,
  title,
  'data-cy': dataCy,
}: {
  label: string;
  value: ReactNode;
  title: string;
  isLoading?: boolean;
  isValid?: boolean;
  isError?: boolean;
} & AutomationTestingProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex min-w-0 items-center gap-1"
    >
      <StateIcon isLoading={isLoading} isValid={isValid} isError={isError} />
      <span className="text-muted">{label}:</span>
      <span
        className="inline-flex max-w-[40rem] flex-wrap items-center gap-1 truncate align-middle"
        title={title}
        data-cy={dataCy}
      >
        {value}
      </span>
    </div>
  );
}

function StateIcon({
  isLoading,
  isValid,
  isError,
}: {
  isLoading?: boolean;
  isValid?: boolean;
  isError?: boolean;
}) {
  if (isLoading)
    return <Icon icon={Loader2} className="animate-spin" size="md" />;
  if (isError) return <Icon icon={XCircle} mode="danger" size="md" />;
  if (isValid) return <Icon icon={CheckCircle} mode="success" size="md" />;
  return null;
}
