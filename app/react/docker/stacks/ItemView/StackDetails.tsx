import { useRouter } from '@uirouter/react';
import { Edit2, List } from 'lucide-react';
import _ from 'lodash';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Stack } from '@/react/common/stacks/types';
import { useStackFile } from '@/react/common/stacks/queries/useStackFile';
import { isGitConfigDiverged } from '@/react/portainer/gitops/utils';

import { WidgetBody, Widget } from '@@/Widget';
import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

import { useContainers } from '../../containers/queries/useContainers';
import { validateYAML } from '../common/stackYamlValidation';
import { extractContainerNames } from '../common/container-names';

import { StackEditorTab } from './StackEditorTab/StackEditorTab';
import { StackInfoTab } from './StackInfoTab/StackInfoTab';

function showEditorTab(
  isExternal: boolean,
  stack: Stack | undefined,
  fileQueryLoading: boolean
) {
  return (
    !isExternal &&
    !isExternal &&
    !!stack &&
    !fileQueryLoading &&
    (!stack.GitConfig || stack.FromAppTemplate)
  );
}

export function StackDetails({
  isExternal,
  isOrphaned,
  isOrphanedRunning,
  isRegular,
  stackName,
  stack,
}: {
  isOrphaned: boolean;
  isExternal: boolean;
  isOrphanedRunning: boolean;
  isRegular: boolean;
  stackName: string;
  stack: Stack | undefined;
}) {
  const router = useRouter();
  const envId = useEnvironmentId();
  const containerNamesQuery = useContainers(envId, {
    select: (containers) =>
      containers.flatMap((c) => c.Names).map((n) => _.trimStart(n, '/')),
  });
  const shouldLoadFile =
    !stack?.GitConfig ||
    !isGitConfigDiverged(stack.GitConfig, stack.CurrentDeploymentInfo);

  const fileQuery = useStackFile(
    stack?.Id,
    {
      version: stack?.StackFileVersion,
      commitHash: stack?.GitConfig?.ConfigHash,
    },
    {
      enabled: shouldLoadFile,
    }
  );

  const stackFileContent = fileQuery.data?.StackFileContent;
  const originalContainerNames = extractContainerNames(stackFileContent);
  const yamlError = validateYAML(
    stackFileContent || '',
    containerNamesQuery.data,
    originalContainerNames
  );

  const tabs: Tab[] = useMemo(() => {
    const infoTab: Tab = {
      name: 'Stack',
      icon: List,
      widget: (
        <Widget>
          <WidgetBody>
            <StackInfoTab
              environmentId={envId}
              isExternal={isExternal}
              isOrphaned={isOrphaned}
              isOrphanedRunning={isOrphanedRunning}
              stackName={stackName}
              isRegular={isRegular}
              stack={stack}
              stackFileContent={stackFileContent}
              yamlError={yamlError}
            />
          </WidgetBody>
        </Widget>
      ),
      selectedTabParam: 'info',
    };

    const editorTab: Tab = {
      name: 'Editor',
      icon: Edit2,
      widget: (
        <Widget>
          <WidgetBody>
            <StackEditorTab
              stack={stack!}
              isOrphaned={isOrphaned}
              originalFileContent={stackFileContent || ''}
              containerNames={containerNamesQuery.data}
              originalContainerNames={originalContainerNames}
              onSubmitSuccess={() =>
                router.stateService.go('.', { tab: 'info' })
              }
            />
          </WidgetBody>
        </Widget>
      ),
      selectedTabParam: 'editor',
    };

    const withEditor = showEditorTab(isExternal, stack, fileQuery.isLoading);
    return withEditor ? [infoTab, editorTab] : [infoTab];
  }, [
    envId,
    isExternal,
    isOrphaned,
    isOrphanedRunning,
    stackName,
    isRegular,
    stack,
    stackFileContent,
    yamlError,
    fileQuery.isLoading,
    containerNamesQuery.data,
    originalContainerNames,
    router.stateService,
  ]);

  const currentTabIndex = useCurrentTabIndex(tabs);

  if (tabs.length === 1) {
    return (
      <div className="row">
        <div className="col-sm-12">{tabs[0].widget}</div>
      </div>
    );
  }

  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      <div className="row">
        <div className="col-sm-12">{tabs[currentTabIndex].widget}</div>
      </div>
    </>
  );
}
