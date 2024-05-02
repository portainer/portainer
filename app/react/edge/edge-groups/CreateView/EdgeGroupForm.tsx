import { Field, Form, Formik, useFormikContext } from 'formik';

import { TagId } from '@/portainer/tags/types';
import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';

import { BoxSelector } from '@@/BoxSelector';
import { TagSelector } from '@@/TagSelector';
import { FormActions } from '@@/form-components/FormActions';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

import { AssociatedEdgeEnvironmentsSelector } from '../../components/AssociatedEdgeEnvironmentsSelector';
import { EdgeGroupAssociationTable } from '../../components/EdgeGroupAssociationTable';

import { groupTypeOptions } from './group-type-options';
import { tagOptions } from './tag-options';

interface FormValues {
  name: string;
  dynamic: boolean;
  environmentIds: EnvironmentId[];
  partialMatch: boolean;
  tagIds: TagId[];
}

export function EdgeGroupForm({
  onSubmit,
  isLoading,
  initialValues,
}: {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  initialValues?: FormValues;
}) {
  return (
    <Formik
      initialValues={
        initialValues || {
          name: '',
          dynamic: false,
          environmentIds: [],
          partialMatch: false,
          tagIds: [],
        }
      }
      onSubmit={onSubmit}
    >
      <InnerForm isLoading={isLoading} isCreate={!initialValues} />
    </Formik>
  );
}

function InnerForm({
  isLoading,
  isCreate,
}: {
  isLoading: boolean;
  isCreate: boolean;
}) {
  const { values, errors, setFieldValue, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <FormControl
        label="Name"
        required
        errors={errors.name}
        inputId="group_name"
      >
        <Field
          as={Input}
          name="name"
          placeholder="e.g. mygroup"
          data-cy="edgeGroupCreate-groupNameInput"
          id="group_name"
        />
      </FormControl>

      <FormSection title="Group type">
        <BoxSelector
          slim
          value={values.dynamic}
          onChange={(dynamic) => setFieldValue('dynamic', dynamic)}
          options={groupTypeOptions}
          radioName="groupTypeDynamic"
        />
      </FormSection>

      {values.dynamic ? <DynamicGroupFieldset /> : <StaticGroupFieldset />}

      <FormActions
        submitLabel={isCreate ? 'Add edge group' : 'Save edge group'}
        isLoading={isLoading}
        isValid={isValid}
        data-cy="edgeGroupCreate-addGroupButton"
        loadingText="In progress..."
      />
    </Form>
  );
}

function StaticGroupFieldset({ isEdit }: { isEdit?: boolean }) {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <FormSection title="Associated environments">
      <div className="form-group">
        <AssociatedEdgeEnvironmentsSelector
          value={values.environmentIds}
          onChange={async (environmentIds, meta) => {
            if (meta.type === 'remove' && isEdit) {
              const confirmed = await confirmDestructive({
                title: 'Confirm action',
                message:
                  'Removing the environment from this group will remove its corresponding edge stacks',
                confirmButton: buildConfirmButton('Confirm'),
              });

              if (!confirmed) {
                return;
              }
            }

            setFieldValue('environmentIds', environmentIds);
          }}
        />
      </div>
    </FormSection>
  );
}

function DynamicGroupFieldset() {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  return (
    <>
      <FormSection title="Tags">
        <BoxSelector
          slim
          value={values.partialMatch}
          onChange={(partialMatch) =>
            setFieldValue('partialMatch', partialMatch)
          }
          options={tagOptions}
          radioName="partialMatch"
        />
        <TagSelector
          value={values.tagIds}
          onChange={(tagIds) => setFieldValue('tagIds', tagIds)}
        />
      </FormSection>

      <EdgeGroupAssociationTable
        data-cy="edgeGroupCreate-associatedEnvironmentsTable"
        title="Associated environments by tags"
        query={{
          types: EdgeTypes,
          tagIds: values.tagIds,
          tagsPartialMatch: values.partialMatch,
        }}
      />
    </>
  );
}
