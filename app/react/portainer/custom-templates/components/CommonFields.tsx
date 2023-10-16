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
  title,
}: {
  currentTemplateId?: CustomTemplate['Id'];
  templates?: Array<CustomTemplate>;
  title?: { pattern: string; error: string };
} = {}): SchemaOf<Values> {
  let titleSchema = string()
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
    );
  if (title?.pattern) {
    const pattern = new RegExp(title.pattern);
    titleSchema = titleSchema.matches(pattern, title.error);
  }

  return object({
    Title: titleSchema,
    Description: string().required('Description is required.'),
    Note: string().default(''),
    Logo: string().default(''),
  });
}
