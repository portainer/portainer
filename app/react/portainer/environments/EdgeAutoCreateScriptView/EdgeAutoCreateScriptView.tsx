import { withLimitToBE } from '@/react/hooks/useLimitToBE';

import { PageHeader } from '@@/PageHeader';

import { AutomaticEdgeEnvCreation } from './AutomaticEdgeEnvCreation';

export const EdgeAutoCreateScriptViewWrapper = withLimitToBE(
  EdgeAutoCreateScriptView
);

function EdgeAutoCreateScriptView() {
  return (
    <>
      <PageHeader
        title="Automatic Edge Environment Creation"
        breadcrumbs={[
          { label: 'Environments', link: 'portainer.endpoints' },
          'Automatic Edge Environment Creation',
        ]}
      />

      <div className="mx-3">
        <AutomaticEdgeEnvCreation />
      </div>
    </>
  );
}
