import { useMutation } from 'react-query';
import { useEffect } from 'react';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { EdgeScriptForm } from '@/edge/components/EdgeScriptForm';
import { generateKey } from '@/portainer/environments/environment.service/edge';
import { TextTip } from '@/portainer/components/Tip/TextTip';

export function AutomaticEdgeEnvCreation() {
  const edgeKeyMutation = useGenerateKeyMutation();
  const { mutate } = edgeKeyMutation;

  useEffect(() => {
    mutate();
  }, [mutate]);

  const edgeKey = edgeKeyMutation.data;

  return (
    <Widget>
      <WidgetTitle
        icon="fa-laptop"
        title="Automatic Edge Environment Creation"
      />
      <WidgetBody>
        {edgeKey ? (
          <EdgeScriptForm edgeKey={edgeKey} />
        ) : (
          <TextTip>Please choose a valid edge portainer URL</TextTip>
        )}
      </WidgetBody>
    </Widget>
  );
}

// using mutation because this action generates an object (although it's not saved in db)
function useGenerateKeyMutation() {
  return useMutation(generateKey);
}
