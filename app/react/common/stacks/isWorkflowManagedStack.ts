interface StackLike {
  WorkflowID?: number;
  FromAppTemplate?: boolean;
}

export function isWorkflowManagedStack<T extends StackLike>(
  stack: T | undefined
): stack is T & { WorkflowID: number } {
  return !!stack && !!stack.WorkflowID && !stack.FromAppTemplate;
}
