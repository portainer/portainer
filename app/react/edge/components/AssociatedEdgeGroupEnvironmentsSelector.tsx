import { useState } from 'react';

import {
  EdgeGroupId,
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';

import { FormError } from '@@/form-components/FormError';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { EdgeGroupAssociationTable } from './EdgeGroupAssociationTable';

export function AssociatedEdgeGroupEnvironmentsSelector({
  onChange,
  value,
  error,
  edgeGroupId,
}: {
  onChange: (
    value: EnvironmentId[],
    meta: { type: 'add' | 'remove'; value: EnvironmentId }
  ) => void;
  value: EnvironmentId[];
  error?: ArrayError<Array<EnvironmentId>>;
  edgeGroupId?: EdgeGroupId;
}) {
  const [associatedEnvironments, setAssociatedEnvironments] = useState<
    Environment[]
  >([]);
  const [dissociatedEnvironments, setDissociatedEnvironments] = useState<
    Environment[]
  >([]);

  function updateEditedEnvironments(env: Environment) {
    // If the env is associated, this update is a dissociation
    const isAssociated = value.includes(env.Id);

    setAssociatedEnvironments((prev) =>
      isAssociated
        ? prev.filter((prevEnv) => prevEnv.Id !== env.Id)
        : [...prev, env]
    );

    setDissociatedEnvironments((prev) =>
      isAssociated
        ? [...prev, env]
        : prev.filter((prevEnv) => prevEnv.Id !== env.Id)
    );

    const updatedValue = isAssociated
      ? value.filter((id) => id !== env.Id)
      : [...value, env.Id];

    onChange(updatedValue, {
      type: isAssociated ? 'remove' : 'add',
      value: env.Id,
    });
  }

  return (
    <>
      <div className="col-sm-12 small text-muted">
        You can select which environment should be part of this group by moving
        them to the associated environments table. Simply click on any
        environment entry to move it from one table to the other.
      </div>

      {error && (
        <div className="col-sm-12">
          <FormError>
            {typeof error === 'string' ? error : error.join(', ')}
          </FormError>
        </div>
      )}

      <div className="col-sm-12 mt-4">
        <div className="flex">
          <div className="w-1/2">
            <EdgeGroupAssociationTable
              title="Available environments"
              query={{
                excludeEdgeGroupIds: edgeGroupId ? [edgeGroupId] : [],
              }}
              addEnvironments={dissociatedEnvironments}
              excludeEnvironments={associatedEnvironments}
              onClickRow={(env) => {
                if (!value.includes(env.Id)) {
                  updateEditedEnvironments(env);
                }
              }}
              data-cy="edgeGroupCreate-availableEndpoints"
            />
          </div>
          <div className="w-1/2">
            <EdgeGroupAssociationTable
              title="Associated environments"
              query={{
                edgeGroupIds: edgeGroupId ? [edgeGroupId] : [],
                endpointIds: edgeGroupId ? undefined : [], // workaround to avoid showing all environments for new edge group
              }}
              addEnvironments={associatedEnvironments}
              excludeEnvironments={dissociatedEnvironments}
              onClickRow={(env) => {
                if (value.includes(env.Id)) {
                  updateEditedEnvironments(env);
                }
              }}
              data-cy="edgeGroupCreate-associatedEndpointsTable"
            />
          </div>
        </div>
      </div>
    </>
  );
}
