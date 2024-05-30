import { UserId } from '@/portainer/users/types';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { Link } from '@@/Link';
import { FormError } from '@@/form-components/FormError';

export function TemplateLoadError({
  templateId,
  creatorId,
}: {
  templateId: CustomTemplate['Id'];
  creatorId: UserId;
}) {
  const { user } = useCurrentUser();
  const isEdgeAdminQuery = useIsEdgeAdmin();

  if (isEdgeAdminQuery.isLoading) {
    return null;
  }

  const isAdminOrWriter = isEdgeAdminQuery.isAdmin || user.Id === creatorId;

  return (
    <FormError>
      {isAdminOrWriter ? (
        <>
          Custom template could not be loaded, please{' '}
          <Link
            to=".edit"
            params={{ id: templateId }}
            data-cy="edit-custom-template-link"
          >
            click here
          </Link>{' '}
          for configuration
        </>
      ) : (
        <>
          Custom template could not be loaded, please contact your
          administrator.
        </>
      )}
    </FormError>
  );
}
