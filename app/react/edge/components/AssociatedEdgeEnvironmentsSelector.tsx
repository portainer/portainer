import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';

import { FormError } from '@@/form-components/FormError';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { EdgeGroupAssociationTable } from './EdgeGroupAssociationTable';

export function AssociatedEdgeEnvironmentsSelector({
  onChange,
  value,
  error,
}: {
  onChange: (
    value: EnvironmentId[],
    meta: { type: 'add' | 'remove'; value: EnvironmentId }
  ) => void;
  value: EnvironmentId[];
  error?: ArrayError<Array<EnvironmentId>>;
}) {
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
                types: EdgeTypes,
                excludeIds: value,
              }}
              onClickRow={(env) => {
                if (!value.includes(env.Id)) {
                  onChange([...value, env.Id], { type: 'add', value: env.Id });
                }
              }}
              data-cy="edgeGroupCreate-availableEndpoints"
            />
          </div>
          <div className="w-1/2">
            <EdgeGroupAssociationTable
              title="Associated environments"
              query={{
                types: EdgeTypes,
                endpointIds: value,
              }}
              onClickRow={(env) => {
                if (value.includes(env.Id)) {
                  onChange(
                    value.filter((id) => id !== env.Id),
                    { type: 'remove', value: env.Id }
                  );
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
