import { Link } from 'lucide-react';
import { useState } from 'react';

import { Environment } from '@/react/portainer/environments/types';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { Query } from '@/react/portainer/environments/queries/useEnvironmentList';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

import { Button } from '@@/buttons';

import { AssociateAMTDialog } from './AssociateAMTDialog';

export function AMTButton({
  environments,
  envQueryParams,
}: {
  environments: Environment[];
  envQueryParams: Query;
}) {
  const [isOpenDialog, setOpenDialog] = useState(false);
  const isOpenAmtEnabledQuery = usePublicSettings({
    select: (settings) =>
      settings.EnableEdgeComputeFeatures && settings.IsAMTEnabled,
  });

  const isOpenAMTEnabled = !!isOpenAmtEnabledQuery.data;

  if (!isOpenAMTEnabled) {
    return null;
  }

  const edgeEnvironments = environments.filter((env) =>
    isEdgeEnvironment(env.Type)
  );

  return (
    <>
      <Button
        onClick={openDialog}
        icon={Link}
        color="light"
        data-cy="associate-amt-button"
      >
        Associate with OpenAMT
      </Button>
      {isOpenDialog && (
        <AssociateAMTDialog
          selectedItems={edgeEnvironments.map((env) => env.Id)}
          onClose={() => setOpenDialog(false)}
          envQueryParams={envQueryParams}
        />
      )}
    </>
  );

  function openDialog() {
    setOpenDialog(true);
  }
}
