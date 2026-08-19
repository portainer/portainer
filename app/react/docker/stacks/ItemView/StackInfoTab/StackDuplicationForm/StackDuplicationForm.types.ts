export interface FormValues {
  environmentId: number | undefined;
  newName: string;
}

export type ActionType = 'duplicate' | 'migrate';

export interface FormSubmitValues extends FormValues {
  actionType: ActionType;
}
