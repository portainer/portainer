import { ExternalStackViewModel } from './external-stack';
import { StackViewModel } from './stack';

export function isExternalStack(
  stack: StackViewModel | ExternalStackViewModel
): stack is ExternalStackViewModel {
  return 'External' in stack && stack.External;
}

export function isRegularStack(
  stack: StackViewModel | ExternalStackViewModel
): stack is StackViewModel & { Regular: true } {
  return 'Regular' in stack && stack.Regular;
}

export function isOrphanedStack(
  stack: StackViewModel | ExternalStackViewModel
): stack is StackViewModel & { Orphaned: true } {
  return 'Orphaned' in stack && stack.Orphaned;
}
