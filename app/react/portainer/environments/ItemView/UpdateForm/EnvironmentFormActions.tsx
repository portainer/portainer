import { FormActions } from '@@/form-components/FormActions';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

export function EnvironmentFormActions({
  isLoading,
  isValid,
}: {
  isLoading: boolean;
  isValid: boolean;
}) {
  return (
    <FormActions
      isLoading={isLoading}
      isValid={isValid}
      loadingText="Updating environment..."
      submitLabel="Update environment"
      data-cy="update-environment-button"
    >
      <Button
        as={Link}
        props={{
          to: '^',
          'data-cy': 'cancel-update-environment-button',
        }}
        color="default"
        data-cy="cancel-update-environment-button"
      >
        Cancel
      </Button>
    </FormActions>
  );
}
