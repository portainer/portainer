import { Form, useFormikContext } from 'formik';

import { ImageConfigFieldset } from '@@/ImageConfigFieldset';
import { LoadingButton } from '@@/buttons';

import { FormValues } from './types';

export function CreateImageForm({
  onRateLimit,
  isLoading,
}: {
  onRateLimit: (limited?: boolean) => void;
  isLoading: boolean;
}) {
  const { values, setFieldValue, errors, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <div className="form-group">
        <div className="col-sm-12">
          <span className="small text-muted">
            You can create an image from this container, this allows you to
            backup important data or save helpful configurations. You&apos;ll be
            able to spin up another container based on this image afterward.
          </span>
        </div>
      </div>

      <ImageConfigFieldset
        autoComplete
        values={values.config}
        setFieldValue={(field, value) =>
          setFieldValue(`config.${field}`, value)
        }
        errors={errors.config}
        onRateLimit={onRateLimit}
      />

      {/* Tag note */}
      <div className="form-group">
        <div className="col-sm-12">
          <span className="small text-muted">
            Note: if you don&apos;t specify the tag in the image name,{' '}
            <span className="label label-default">latest</span> will be used.
          </span>
        </div>
      </div>

      <LoadingButton
        isLoading={isLoading}
        disabled={!isValid}
        loadingText="Creating image..."
        data-cy="create-image-button"
      >
        Create
      </LoadingButton>
    </Form>
  );
}
