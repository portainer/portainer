import { Formik, Field, Form } from 'formik';
import { useReducer } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { User } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { usePublicSettings } from '@/react/portainer/settings/queries';

import { FormControl } from '@@/form-components/FormControl';
import { Widget } from '@@/Widget';
import { Input } from '@@/form-components/Input';
import { UsersSelector } from '@@/UsersSelector';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';

import { Team } from '../../types';
import { useAddTeamMutation } from '../../queries/useAddTeamMutation';

import { FormValues } from './types';
import { validationSchema } from './CreateTeamForm.validation';

interface Props {
  users: User[];
  teams: Team[];
}

export function CreateTeamForm({ users, teams }: Props) {
  const { t } = useTranslation();
  const addTeamMutation = useAddTeamMutation();
  const [formKey, incFormKey] = useReducer((state: number) => state + 1, 0);
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  const initialValues = {
    name: '',
    leaders: [],
  };

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <Widget.Title
            icon={Plus}
            title={t('teams.add_new_team')}
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
                    label={t('teams.name')}
                    errors={errors.name}
                    required
                  >
                    <Field
                      as={Input}
                      name="name"
                      id="team_name"
                      required
                      placeholder={t('teams.name_placeholder')}
                      data-cy="team-teamNameInput"
                    />
                  </FormControl>

                  {users.length > 0 && (
                    <FormControl
                      inputId="users-input"
                      label={t('teams.select_leaders_label')}
                      tooltip={t('teams.leaders_tooltip')}
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
                        placeholder={t('teams.select_leaders_placeholder')}
                        disabled={teamSyncQuery.data}
                      />
                    </FormControl>
                  )}

                  {teamSyncQuery.data && (
                    <div className="form-group">
                      <div className="col-sm-12">
                        <TextTip color="orange">
                          {t('teams.team_sync_tip')}
                        </TextTip>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <div className="col-sm-12">
                      <LoadingButton
                        disabled={!isValid}
                        data-cy="team-createTeamButton"
                        isLoading={isSubmitting || addTeamMutation.isLoading}
                        loadingText={t('teams.creating_team')}
                        icon={Plus}
                        className="!ml-0"
                      >
                        {t('teams.create_team')}
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
        notifySuccess(t('teams.add_success'), '');
      },
    });
  }
}
