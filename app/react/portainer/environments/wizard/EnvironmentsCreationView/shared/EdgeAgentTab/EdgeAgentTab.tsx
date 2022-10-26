import { v4 as uuid } from 'uuid';
import { useReducer, useState } from 'react';

import { Environment } from '@/react/portainer/environments/types';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { CommandTab } from '@/react/edge/components/EdgeScriptForm/scripts';
import { OS, EdgeInfo } from '@/react/edge/components/EdgeScriptForm/types';

import { Button } from '@@/buttons';

import { EdgeAgentForm } from './EdgeAgentForm';

interface Props {
  onCreate: (environment: Environment) => void;
  commands: CommandTab[] | Partial<Record<OS, CommandTab[]>>;
  isNomadTokenVisible?: boolean;
  showGpus?: boolean;
}

export function EdgeAgentTab({
  onCreate,
  commands,
  isNomadTokenVisible,
  showGpus = false,
}: Props) {
  const [edgeInfo, setEdgeInfo] = useState<EdgeInfo>();

  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  return (
    <>
      <EdgeAgentForm
        onCreate={handleCreate}
        readonly={!!edgeInfo}
        key={formKey}
        showGpus={showGpus}
      />

      {edgeInfo && (
        <>
          <EdgeScriptForm
            edgeInfo={edgeInfo}
            commands={commands}
            isNomadTokenVisible={isNomadTokenVisible}
          />

          <hr />

          <div className="row">
            <div className="flex justify-end">
              <Button color="primary" type="reset" onClick={handleReset}>
                Add another environment
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );

  function handleCreate(environment: Environment) {
    setEdgeInfo({ key: environment.EdgeKey, id: environment.EdgeID || uuid() });
    onCreate(environment);
  }

  function handleReset() {
    setEdgeInfo(undefined);
    clearForm();
  }
}
