import { EnvironmentId } from '../../types';

import { GroupAssociationTable } from './GroupAssociationTable';

export function AssociatedEnvironmentsSelector({
  onAssociate,
  onDissociate,
  value,
}: {
  onAssociate: (endpointId: EnvironmentId) => void;
  onDissociate: (endpointId: EnvironmentId) => void;
  value: EnvironmentId[];
}) {
  return (
    <>
      <div className="col-sm-12 small text-muted">
        You can select which environment should be part of this group by moving
        them to the associated environments table. Simply click on any
        environment entry to move it from one table to the other.
      </div>

      <div className="-mx-[15px]">
        <div className="col-sm-12 mt-4">
          <div className="flex">
            <div className="w-1/2">
              <GroupAssociationTable
                title="Available environments"
                emptyContentLabel="No environment available"
                query={{
                  groupIds: [1],
                }}
                onClickRow={(env) => onAssociate(env.Id)}
                data-cy="edgeGroupCreate-availableEndpoints"
              />
            </div>
            <div className="w-1/2">
              <GroupAssociationTable
                title="Associated environments"
                emptyContentLabel="No associated environment'"
                query={{
                  endpointIds: value,
                }}
                onClickRow={(env) => onDissociate(env.Id)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
