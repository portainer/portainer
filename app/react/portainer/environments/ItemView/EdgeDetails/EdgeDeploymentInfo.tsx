import _ from 'lodash';

import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';

import { Widget } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { Environment } from '../../types';
import { EdgeKeyDisplay } from '../../common/EdgeKeyDisplay';

export function EdgeDeploymentInfo({
  environment,
}: {
  environment: Environment;
}) {
  const edgeKeyDetails = decodeEdgeKey(environment.EdgeKey);

  return (
    <Widget>
      <Widget.Body>
        <FormSection title="Deploy an agent">
          <TextTip>
            <p className="vertical-center">
              Refer to the platform related command below to deploy the Edge
              agent in your remote cluster.
            </p>
            <p>
              The agent will communicate with Portainer via{' '}
              <u>{edgeKeyDetails.instanceURL}</u> and{' '}
              <u>tcp://{edgeKeyDetails.tunnelServerAddr}</u>
            </p>
          </TextTip>
        </FormSection>

        <FormSection title="Edge agent deployment script">
          <EdgeScriptForm
            edgeInfo={{ key: environment.EdgeKey, id: environment.EdgeID }}
            commands={{
              linux: _.compact([
                commandsTabs.k8sLinux,
                commandsTabs.swarmLinux,
                commandsTabs.standaloneLinux,
              ]),
              win: [commandsTabs.swarmWindows, commandsTabs.standaloneWindow],
            }}
            asyncMode={environment.Edge.AsyncMode}
          />

          <EdgeKeyDisplay edgeKey={environment.EdgeKey} />
        </FormSection>
      </Widget.Body>
    </Widget>
  );
}

function decodeEdgeKey(key: string) {
  if (key === '') {
    return {};
  }

  const decodedKey = atob(key).split('|');
  return {
    instanceURL: decodedKey[0],
    tunnelServerAddr: decodedKey[1],
  };
}
