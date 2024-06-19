import { render } from '@testing-library/react';

import { FormValues } from './PullImageFormWidget.types';
import { useValidation } from './PullImageFormWidget.validation';

function setup(...args: Parameters<typeof useValidation>) {
  const returnVal: { schema?: ReturnType<typeof useValidation> } = {
    schema: undefined,
  };
  function TestComponent() {
    Object.assign(returnVal, { schema: useValidation(...args) });
    return null;
  }
  render(<TestComponent />);
  return returnVal;
}

test('image is required', async () => {
  const { schema } = setup(false, false);
  const object: FormValues = {
    config: { image: '', registryId: 0, useRegistry: true },
    node: '',
  };

  await expect(
    schema?.validate(object, { strict: true })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[ValidationError: Image is required]`
  );
});
