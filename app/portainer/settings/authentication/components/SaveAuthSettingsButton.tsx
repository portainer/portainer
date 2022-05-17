import { LoadingButton } from '@/portainer/components/Button/LoadingButton';

export interface Props {
  onSaveSettings(): void;
  saveButtonState: boolean;
  saveButtonDisabled?: boolean;
  limitedFeatureId?: string;
  limitedFeatureClass?: string;
  className?: string;
}

export function SaveAuthSettingsButton({
  onSaveSettings,
  saveButtonDisabled,
  saveButtonState,
  limitedFeatureId,
  limitedFeatureClass,
  className,
}: Props) {
  return (
    <>
      <div className="col-sm-12 form-section-title"> Actions </div>
      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            disabled={saveButtonDisabled}
            loadingText="Saving..."
            isLoading={saveButtonState}
            className={className}
            onClick={() => onSaveSettings()}
            {...{ limitedFeatureId, limitedFeatureClass }}
          >
            Save settings
          </LoadingButton>
        </div>
      </div>
    </>
  );
}
