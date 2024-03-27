import { PageHeader } from '@@/PageHeader';
import { InformationPanel } from '@@/InformationPanel';

import { RegistriesDatatable } from './RegistriesDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Registries" breadcrumbs="Registry management" reload />

      <InformationPanel title="Information">
        <span className="small text-muted">
          View registries via an environment to manage access for user(s) and/or
          team(s)
        </span>
      </InformationPanel>

      <RegistriesDatatable />
    </>
  );
}
