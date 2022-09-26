import { Formik, Field, Form } from 'formik';
import { useMutation, useQueryClient } from 'react-query';
import { useReducer } from 'react';

import { Icon } from '@/react/components/Icon';
import { User } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { FormControl } from '@@/form-components/FormControl';
import { Widget } from '@@/Widget';
import { Input } from '@@/form-components/Input';
import { UsersSelector } from '@@/UsersSelector';
import { LoadingButton } from '@@/buttons/LoadingButton';

import { createTeam } from '../../teams.service';
import { Team } from '../../types';

import { FormValues } from './types';
import { validationSchema } from './CreateTeamForm.validation';

interface Props {
  users: User[];
  teams: Team[];
}

export function CreateTeamForm({ users, teams }: Props) {
  const addTeamMutation = useAddTeamMutation();
  const [formKey, incFormKey] = useReducer((state: number) => state + 1, 0);

  const initialValues = {
    name: '',
    leaders: [],
  };

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <Widget.Title
            icon="plus"
            title="Add a new team"
            featherIcon
            className="vertical-center"
          />
          <Widget.Body>
            <Formik
              initialValues={initialValues}
              validationSchema={() => validationSchema(teams)}
              onSubmit={handleAddTeamClick}
              validateOnMount
              key={formKey}
            >
              {({
                values,
                errors,
                handleSubmit,
                setFieldValue,
                isSubmitting,
                isValid,
              }) => (
                <Form
                  className="form-horizontal"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <FormControl
                    inputId="team_name"
                    label="Name"
                    errors={errors.name}
                    required
                  >
                    <Field
                      as={Input}
                      name="name"
                      id="team_name"
                      required
                      placeholder="e.g. development"
                      data-cy="team-teamNameInput"
                    />
                  </FormControl>

                  {users.length > 0 && (
                    <FormControl
                      inputId="users-input"
                      label="Select team leader(s)"
                      tooltip="You can assign one or more leaders to this team. Team leaders can manage their teams users and resources."
                      errors={errors.leaders}
                    >
                      <UsersSelector
                        value={values.leaders}
                        onChange={(leaders) =>
                          setFieldValue('leaders', leaders)
                        }
                        users={users}
                        dataCy="team-teamLeaderSelect"
                        inputId="users-input"
                        placeholder="Select one or more team leaders"
                      />
                    </FormControl>
                  )}

                  <div className="form-group">
                    <div className="col-sm-12">
                      <LoadingButton
                        disabled={!isValid}
                        data-cy="team-createTeamButton"
                        isLoading={isSubmitting || addTeamMutation.isLoading}
                        loadingText="Creating team..."
                      >
                        <Icon icon="plus" feather size="md" />
                        Create team
                      </LoadingButton>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );

  async function handleAddTeamClick(values: FormValues) {
    addTeamMutation.mutate(values, {
      onSuccess() {
        incFormKey();
        notifySuccess('Team successfully added', '');
      },
    });
  }
}

export function useAddTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    (values: FormValues) => createTeam(values.name, values.leaders),
    {
      meta: {
        error: {
          title: 'Failure',
          message: 'Failed to create team',
        },
      },
      onSuccess() {
        return queryClient.invalidateQueries(['teams']);
      },
    }
  );
}
