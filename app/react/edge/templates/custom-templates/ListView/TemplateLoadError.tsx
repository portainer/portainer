import { useCurrentUser } from '@/react/hooks/useUser';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';

export function TemplateLoadError({ template }: { template: CustomTemplate }) {
  const {
    isAdmin,
    user: { Id: currentUserId },
  } = useCurrentUser();

  const isAllowedToEdit = isAdmin || currentUserId === template.CreatedByUserId;

  if (isAllowedToEdit) {
    return (
      <TextTip>
        Custom template could not be loaded, please{' '}
        <Link to="docker.templates.custom.edit" params={{ id: template.Id }}>
          click here
        </Link>{' '}
        for configuration.
      </TextTip>
    );
  }

  return (
    <TextTip>
      Custom template could not be loaded, please contact your administrator.
    </TextTip>
  );
}
