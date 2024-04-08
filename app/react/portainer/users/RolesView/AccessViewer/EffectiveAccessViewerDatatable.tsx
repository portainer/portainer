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
          user
        </TextTip>
      }
      emptyContentLabel={
        dataset
          ? 'The selected user does not have access to any environment(s)'
          : 'Select a user to show associated access and role'
      }
      disableSelect
      data-cy="effective-access-viewer-datatable"
    />
  );
}
