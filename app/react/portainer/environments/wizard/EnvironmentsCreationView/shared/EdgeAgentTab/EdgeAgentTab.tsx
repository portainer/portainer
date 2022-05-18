import { v4 as uuid } from 'uuid';
import { useReducer, useState } from 'react';

import { Button } from '@/portainer/components/Button';
import { OS } from '@/edge/components/EdgeScriptForm/types';
import { CommandTab } from '@/edge/components/EdgeScriptForm/scripts';
import { Environment } from '@/portainer/environments/types';

import { EdgeInfo } from './types';
import { EdgeScriptForm } from './EdgeScriptForm';
import { EdgeAgentForm } from './EdgeAgentForm';

interface Props {
  onCreate: (environment: Environment) => void;
  commands: CommandTab[] | Partial<Record<OS, CommandTab[]>>;
  isNomadTokenVisible?: boolean;
}

export function EdgeAgentTab({
  onCreate,
  commands,
  isNomadTokenVisible,
}: Props) {
  const [edgeInfo, setEdgeInfo] = useState<EdgeInfo>();

  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  return (
    <>
      <EdgeAgentForm
        onCreate={handleCreate}
        readonly={!!edgeInfo}
        key={formKey}
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
    setEdgeInfo({ key: environment.EdgeKey, id: uuid() });
    onCreate(environment);
  }

  function handleReset() {
    setEdgeInfo(undefined);
    clearForm();
  }
}
