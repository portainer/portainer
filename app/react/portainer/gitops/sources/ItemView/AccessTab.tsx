import { useRef } from 'react';
import { Form, Formik, FormikProps } from 'formik';
import { Eye } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';
import { useCurrentUser } from '@/react/hooks/useUser';
import {
  AccessControlFormData,
  ResourceAccessLevel,
  ResourceControlOwnership,
  ResourceControlType,
} from '@/react/portainer/access-control/types';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { validationSchema } from '@/react/portainer/access-control/AccessControlForm/AccessControlForm.validation';
import { EditDetails } from '@/react/portainer/access-control/EditDetails';
import { AccessControlPanelDetails } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanelDetails';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { Widget } from '@@/Widget';
import { Button } from '@@/buttons';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { StickyFooter } from '@@/StickyFooter/StickyFooter';
import { usePreventFormExit } from '@@/form-components/usePreventFormExit';

import { SourceDetail } from '../queries/useSource';
import {
  UpdateSourceAccessPayload,
  useUpdateSourceAccessMutation,
} from '../queries/useUpdateSourceAccessMutation';

interface Props {
  source: SourceDetail;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
}

export function AccessTab({ source, isEditing, onEditingChange }: Props) {
  const { isPureAdmin } = useCurrentUser();

  if (isEditing && isPureAdmin) {
    return (
      <AccessForm source={source} onClose={() => onEditingChange(false)} />
    );
  }

  return (
    <Widget>
      <Widget.Title title="Access control" icon={Eye} />
      <Widget.Body>
        <AccessControlPanelDetails
          resourceName="source"
          resourceControl={toResourceControl(source)}
          isAuthorisedToFetchUsers
        />
      </Widget.Body>
    </Widget>
  );
}

function AccessForm({
  source,
  onClose,
}: {
  source: SourceDetail;
  onClose: () => void;
}) {
  const { user, isPureAdmin } = useCurrentUser();
  const updateAccess = useUpdateSourceAccessMutation(source.id);
  const formikRef = useRef<FormikProps<AccessControlFormData>>(null);

  usePreventFormExit(() => !!formikRef.current?.dirty);

  const initialValues = parseAccessControlFormData(
    isPureAdmin,
    user.Id,
    toResourceControl(source)
  );

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validateOnMount
      validationSchema={() => validationSchema(isPureAdmin)}
      onSubmit={(values, { setSubmitting }) =>
        updateAccess.mutate(toAccessPayload(values), {
          onSuccess: () => {
            notifySuccess('Source access updated', '');
            onClose();
          },
          onSettled: () => setSubmitting(false),
        })
      }
    >
      {({
        handleSubmit,
        values,
        errors,
        isValid,
        dirty,
        isSubmitting,
        setValues,
      }) => (
        <StickyFooter.Container>
          <Form
            className="form-horizontal space-y-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <Widget>
              <Widget.Title title="Access control" icon={Eye} />
              <Widget.Body>
                <EditDetails
                  resourceName="source"
                  values={values}
                  errors={errors}
                  onChange={setValues}
                  isPublicVisible
                />
              </Widget.Body>
            </Widget>

            <StickyFooter className="gap-4">
              <Button
                type="button"
                color="default"
                onClick={onClose}
                data-cy="cancel-source-access-button"
              >
                Cancel
              </Button>
              <LoadingButton
                isLoading={isSubmitting}
                loadingText="Saving..."
                disabled={!isValid || !dirty}
                data-cy="save-source-access-button"
              >
                Save Changes
              </LoadingButton>
            </StickyFooter>
          </Form>
        </StickyFooter.Container>
      )}
    </Formik>
  );
}

function toResourceControl(source: SourceDetail): ResourceControlViewModel {
  const {
    public: isPublic = false,
    users = [],
    teams = [],
  } = source.access ?? {};

  return new ResourceControlViewModel({
    Id: 0,
    // Sources aren't an inheritable resource, so Type is irrelevant here; it's
    // only required by the model and never read for sources.
    Type: ResourceControlType.CustomTemplate,
    ResourceId: source.id,
    Public: isPublic,
    AdministratorsOnly: !isPublic && users.length === 0 && teams.length === 0,
    System: false,
    UserAccesses: users.map((UserId) => ({
      UserId,
      AccessLevel: ResourceAccessLevel.ReadWriteAccessLevel,
    })),
    TeamAccesses: teams.map((TeamId) => ({
      TeamId,
      AccessLevel: ResourceAccessLevel.ReadWriteAccessLevel,
    })),
  });
}

function toAccessPayload({
  ownership,
  authorizedUsers,
  authorizedTeams,
}: AccessControlFormData): UpdateSourceAccessPayload {
  const isRestricted =
    ownership === ResourceControlOwnership.RESTRICTED ||
    ownership === ResourceControlOwnership.PRIVATE;

  return {
    public: ownership === ResourceControlOwnership.PUBLIC,
    users: isRestricted ? authorizedUsers : [],
    teams: isRestricted ? authorizedTeams : [],
  };
}
