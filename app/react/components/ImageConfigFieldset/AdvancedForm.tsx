import { FormikErrors, useFormikContext } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { Values } from './types';

export function AdvancedForm({
  values,
  errors,
  fieldNamespace,
  onChangeImage,
}: {
  values: Values;
  errors?: FormikErrors<Values>;
  fieldNamespace?: string;
  onChangeImage?: (name: string) => void;
}) {
  const { setFieldValue } = useFormikContext<Values>();

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
            setFieldValue(namespaced('image'), value);
            onChangeImage?.(value);
          }}
          placeholder="e.g. registry:port/my-image:my-tag"
          required
        />
      </FormControl>
    </>
  );

  function namespaced(field: string) {
    return fieldNamespace ? `${fieldNamespace}.${field}` : field;
  }
}
