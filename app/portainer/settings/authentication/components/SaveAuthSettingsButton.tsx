import { LoadingButton } from '@/react/components/buttons/LoadingButton';
import { FormSectionTitle } from '@/react/components/form-components/FormSectionTitle';

export interface Props {
  onSubmit(): void;
  isLoading: boolean;
}

export function SaveAuthSettingsButton({ onSubmit, isLoading }: Props) {
  return (
    <>
      <FormSectionTitle>Actions</FormSectionTitle>
      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            loadingText="Saving..."
            isLoading={isLoading}
            onClick={() => onSubmit()}
          >
            Save settings
          </LoadingButton>
        </div>
      </div>
    </>
  );
}
