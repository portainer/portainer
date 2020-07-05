/**
 * KubernetesPod Model
 */
const _KubernetesPod = Object.freeze({
  Id: '',
  Name: '',
  Namespace: '',
  Images: [],
  Status: '',
  Restarts: 0,
  Node: '',
  CreationDate: '',
  Containers: [],
  Labels: [],
});

export class KubernetesPod {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPod)));
  }
}
