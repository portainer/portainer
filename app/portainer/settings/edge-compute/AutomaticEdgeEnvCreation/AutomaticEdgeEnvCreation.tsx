import { useState } from 'react';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';

import { EdgeKeyGeneration } from './EdgeKeyGenerationForm';
import { EdgeScriptForm } from './EdgeScriptForm';

export function AutomaticEdgeEnvCreation() {
  const [edgeKey, setEdgeKey] = useState('');

  return (
    <Widget>
      <WidgetTitle
        icon="fa-laptop"
        title="Automatic Edge Environment Creation"
      />
      <WidgetBody>
        <EdgeKeyGeneration onCreate={setEdgeKey} />
        {edgeKey && (
          <>
            <hr />
            <EdgeScriptForm edgeKey={edgeKey} />
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
