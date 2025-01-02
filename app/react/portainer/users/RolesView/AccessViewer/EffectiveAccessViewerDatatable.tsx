import { TextTip } from '@@/Tip/TextTip';
import { Datatable } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';

import { AccessViewerPolicyModel } from './model';
import { columns } from './columns';

export function EffectiveAccessViewerDatatable({
  dataset,
}: {
  dataset?: Array<AccessViewerPolicyModel>;
}) {
  const tableState = useTableStateWithStorage('access-viewer', 'Environment');

  if (dataset?.length === 0) {
    return (
      <TextTip color="blue">
        The selected user does not have access to any environments.
      </TextTip>
    );
  }

  return (
    <Datatable
      dataset={dataset || []}
      columns={columns}
      settingsManager={tableState}
      noWidget
      title="Access"
      description={
        <TextTip color="blue">
          Effective role for each environment will be displayed for the selected
          user.
        </TextTip>
      }
      disableSelect
      data-cy="effective-access-viewer-datatable"
    />
  );
}
