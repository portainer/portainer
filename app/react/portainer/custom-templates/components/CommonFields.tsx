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
  viewType = 'docker',
}: {
  currentTemplateId?: CustomTemplate['Id'];
  templates?: Array<CustomTemplate>;
  viewType?: 'kube' | 'docker' | 'edge';
} = {}): SchemaOf<Values> {
  const titlePattern = titlePatternValidation(viewType);

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
      .matches(titlePattern.pattern, titlePattern.error),
    Description: string().required('Description is required.'),
    Note: string().default(''),
    Logo: string().default(''),
  });
}

export const TEMPLATE_NAME_VALIDATION_REGEX = '^[-_a-z0-9]+$';

const KUBE_TEMPLATE_NAME_VALIDATION_REGEX =
  '^(([a-z0-9](?:(?:[-a-z0-9_.]){0,61}[a-z0-9])?))$'; // alphanumeric, lowercase, can contain dashes, dots and underscores, max 63 characters

function titlePatternValidation(type: 'kube' | 'docker' | 'edge') {
  switch (type) {
    case 'kube':
      return {
        pattern: new RegExp(KUBE_TEMPLATE_NAME_VALIDATION_REGEX),
        error:
          "This field must consist of lower-case alphanumeric characters, '.', '_' or '-', must start and end with an alphanumeric character and must be 63 characters or less (e.g. 'my-name', or 'abc-123').",
      };
    default:
      return {
        pattern: new RegExp(TEMPLATE_NAME_VALIDATION_REGEX),
        error:
          "This field must consist of lower-case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123').",
      };
  }
}
