export interface FormValues {
  name: string;

  url: string;
  publicUrl: string;

  meta: {
    tagIds: number[];
    groupId: number;
  };
}
