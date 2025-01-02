import { SchemaOf, object, string } from 'yup';
import { FormikErrors } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { CustomTemplate } from '../../templates/custom-templates/types';

export interface Values {
  Title: string;
  Description: string;
  Note: string;
  Logo: string;
}

export function CommonFields({
  values,
  onChange,
  errors,
}: {
  values: Values;
  onChange: (values: Values) => void;
  errors?: FormikErrors<Values>;
}) {
  return (
    <>
      <FormControl
        label="Title"
        required
        inputId="template-title"
        errors={errors?.Title}
      >
        <Input
          name="title"
          data-cy="custom-templates-title-input"
          placeholder="e.g. mytemplate"
          id="template-title"
          required
          value={values.Title}
          onChange={(e) => {
            handleChange({ Title: e.target.value });
          }}
        />
      </FormControl>

      <FormControl
        label="Description"
        required
        inputId="template-description"
        errors={errors?.Description}
      >
        <Input
          name="description"
          data-cy="custom-templates-description-input"
          id="template-description"
          required
          value={values.Description}
          onChange={(e) => {
            handleChange({ Description: e.target.value });
          }}
        />
      </FormControl>

      <FormControl label="Note" inputId="template-note" errors={errors?.Note}>
        <Input
          name="note"
          data-cy="custom-templates-note-input"
          id="template-note"
          value={values.Note}
          onChange={(e) => {
            handleChange({ Note: e.target.value });
          }}
        />
      </FormControl>

      <FormControl label="Logo" inputId="template-logo" errors={errors?.Logo}>
        <Input
          name="logo"
          data-cy="custom-templates-logo-input"
          id="template-logo"
          value={values.Logo}
          onChange={(e) => {
            handleChange({ Logo: e.target.value });
          }}
        />
      </FormControl>
    </>
  );

  function handleChange(change: Partial<Values>) {
    onChange({ ...values, ...change });
  }
}

export function validation({
  currentTemplateId,
  templates = [],
}: {
  currentTemplateId?: CustomTemplate['Id'];
  templates?: Array<CustomTemplate>;
} = {}): SchemaOf<Values> {
  return object({
    Title: string()
      .required('Title is required.')
      .test(
        'is-unique',
        'Title must be unique',
        (value) =>
          !value ||
          !templates.some(
            (template) =>
              template.Title === value && template.Id !== currentTemplateId
          )
      )
      .max(
        200,
        'Custom template title must be less than or equal to 200 characters'
      ),
    Description: string().required('Description is required.'),
    Note: string().default(''),
    Logo: string().default(''),
  });
}
