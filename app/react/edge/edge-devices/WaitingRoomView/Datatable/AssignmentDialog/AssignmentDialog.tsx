import { Form, Formik } from 'formik';

import { addPlural } from '@/portainer/helpers/strings';
import { useUpdateEnvironmentsRelationsMutation } from '@/react/portainer/environments/queries/useUpdateEnvironmentsRelationsMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import { BetaAlert } from '@/react/portainer/environments/update-schedules/common/BetaAlert';

import { Checkbox } from '@@/form-components/Checkbox';
import { FormControl } from '@@/form-components/FormControl';
import { OnSubmit, Modal } from '@@/modals';
import { TextTip } from '@@/Tip/TextTip';
import { Button, LoadingButton } from '@@/buttons';

import { WaitingRoomEnvironment } from '../../types';

import { GroupSelector, EdgeGroupsSelector, TagSelector } from './Selectors';
import { FormValues } from './types';
import { isAssignedToGroup } from './utils';
import { createPayload } from './createPayload';

export function AssignmentDialog({
  onSubmit,
  environments,
}: {
  onSubmit: OnSubmit<boolean>;
  environments: Array<WaitingRoomEnvironment>;
}) {
  const assignRelationsMutation = useUpdateEnvironmentsRelationsMutation();

  const initialValues: FormValues = {
    group: 1,
    overrideGroup: false,
    edgeGroups: [],
    overrideEdgeGroups: false,
    tags: [],
    overrideTags: false,
  };

  const hasPreAssignedEdgeGroups = environments.some(
    (e) => e.EdgeGroups?.length > 0
  );
  const hasPreAssignedTags = environments.some((e) => e.TagIds.length > 0);
  const hasPreAssignedGroup = environments.some((e) => isAssignedToGroup(e));

  return (
    <Modal
      aria-label="Associate and assignment"
      onDismiss={() => onSubmit()}
      size="lg"
    >
      <Modal.Header
        title={`Associate with assignment (${addPlural(
          environments.length,
          'selected edge environment'
        )})`}
      />
      <Formik onSubmit={handleSubmit} initialValues={initialValues}>
        {({ values, setFieldValue, errors }) => (
          <Form noValidate>
            <Modal.Body>
              <div>
                <FormControl
                  size="vertical"
                  label="Group"
                  tooltip="For managing RBAC with user access"
                  errors={errors.group}
                >
                  <GroupSelector />

                  {hasPreAssignedGroup && (
                    <div className="mt-2">
                      <Checkbox
                        label="Override pre-assigned group"
                        id="overrideGroup"
                        bold={false}
                        checked={values.overrideGroup}
                        onChange={(e) =>
                          setFieldValue('overrideGroup', e.target.checked)
                        }
                      />
                    </div>
                  )}
                </FormControl>

                <FormControl
                  size="vertical"
                  label="Edge Groups"
                  tooltip="Required to manage edge job and edge stack deployments"
                  errors={errors.edgeGroups}
                >
                  <EdgeGroupsSelector />

                  {hasPreAssignedEdgeGroups && (
                    <div className="mt-2">
                      <Checkbox
                        label="Override pre-assigned edge groups"
                        bold={false}
                        id="overrideEdgeGroups"
                        checked={values.overrideEdgeGroups}
                        onChange={(e) =>
                          setFieldValue('overrideEdgeGroups', e.target.checked)
                        }
                      />
                    </div>
                  )}
                </FormControl>

                <div className="mb-3">
                  <TextTip color="blue">
                    Edge group(s) created here are static only, use tags to
                    assign to dynamic edge groups
                  </TextTip>
                </div>

                <FormControl
                  size="vertical"
                  label="Tags"
                  tooltip="Assigning tags will auto populate environments to dynamic edge groups that these tags are assigned to and any ege jobs or stacks that are deployed to that edge group"
                  errors={errors.tags}
                >
                  <TagSelector />

                  {hasPreAssignedTags && (
                    <div className="mt-2">
                      <Checkbox
                        label="Override pre-assigned tags"
                        bold={false}
                        id="overrideTags"
                        checked={values.overrideTags}
                        onChange={(e) =>
                          setFieldValue('overrideTags', e.target.checked)
                        }
                      />
                    </div>
                  )}
                </FormControl>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={() => onSubmit()} color="default">
                Cancel
              </Button>
              <LoadingButton
                isLoading={assignRelationsMutation.isLoading}
                loadingText="Associating..."
              >
                Associate
              </LoadingButton>
            </Modal.Footer>
            <div className="mt-2">
              <BetaAlert
                message={
                  <>
                    <b>Beta Feature</b> - This feature is currently in beta,
                    some functions might not work as expected.
                  </>
                }
              />
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );

  function handleSubmit(values: FormValues) {
    assignRelationsMutation.mutate(
      Object.fromEntries(environments.map((e) => createPayload(e, values))),
      {
        onSuccess: () => {
          notifySuccess('Success', 'Edge environments assigned successfully');
          onSubmit(true);
        },
      }
    );
  }
}
