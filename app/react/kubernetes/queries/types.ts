export type Event = {
  type: string;
  name: string;
  reason: string;
  message: string;
  namespace: string;
  eventTime: Date;
  kind?: string;
  count: number;
  lastTimestamp?: Date;
  firstTimestamp?: Date;
  uid: string;
  involvedObject: {
    uid: string;
    kind?: string;
    name: string;
    namespace: string;
  };
};
