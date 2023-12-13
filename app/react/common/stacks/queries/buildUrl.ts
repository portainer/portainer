import { StackId } from '@/react/common/stacks/types';

// actions in the url path in api/http/handler/stacks/handler.go
type StackAction =
  | 'git'
  | 'git/redeploy'
  | 'file'
  | 'migrate'
  | 'start'
  | 'stop'
  | 'images_status';

export function buildStackUrl(stackId?: StackId, action?: StackAction) {
  let url = 'stacks';
  if (stackId) {
    url += `/${stackId}`;
  }
  if (action) {
    url += `/${action}`;
  }
  return url;
}
