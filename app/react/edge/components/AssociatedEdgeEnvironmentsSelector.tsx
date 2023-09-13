import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeGroupAssociationTable } from './EdgeGroupAssociationTable';

export function AssociatedEdgeEnvironmentsSelector({
  onChange,
  value,
}: {
  onChange: (
    value: EnvironmentId[],
    meta: { type: 'add' | 'remove'; value: EnvironmentId }
  ) => void;
  value: EnvironmentId[];
}) {
  return (
    <>
      <div className="col-sm-12 small text-muted">
        You can select which environment should be part of this group by moving
        them to the associated environments table. Simply click on any
        environment entry to move it from one table to the other.
      </div>

      <div className="col-sm-12 mt-4">
        <div className="flex">
          <div className="w-1/2">
            <EdgeGroupAssociationTable
              title="Available environments"
              emptyContentLabel="No environment available"
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
              emptyContentLabel="No associated environment'"
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
            />
          </div>
        </div>
      </div>
    </>
  );
}
