import { FormikErrors } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { Values } from './types';

export function AdvancedForm({
  values,
  errors,
  onChangeImage,
  setFieldValue,
}: {
  values: Values;
  errors?: FormikErrors<Values>;
  onChangeImage?: (name: string) => void;
  setFieldValue: <T>(field: string, value: T) => void;
}) {
  return (
    <>
      <TextTip color="blue">
        When using advanced mode, image and repository <b>must be</b> publicly
        available.
      </TextTip>
      <FormControl label="Image" inputId="image-field" errors={errors?.image}>
        <Input
          id="image-field"
          value={values.image}
          onChange={(e) => {
            const { value } = e.target;
            setFieldValue('image', value);
            setTimeout(() => onChangeImage?.(value), 0);
          }}
          placeholder="e.g. registry:port/my-image:my-tag"
          required
          data-cy="image-config-advanced-input"
        />
      </FormControl>
    </>
  );
}
