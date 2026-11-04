import { Application } from '../ApplicationsDatatable/types';

import { Stack } from './types';

export function getStacksFromApplications(applications: Application[]) {
  const res = applications.reduce<Stack[]>((stacks, app) => {
    const updatedStacks = stacks.map((stack) => {
      if (stack.Id === app.StackId) {
        return {
          ...stack,
          Applications: [...stack.Applications, app],
        };
      }
      return stack;
    });

    const stackExists = updatedStacks.some((stack) => stack.Id === app.StackId);

    // applications outside a stack have no stack id, or the placeholder id '0'
    if (!stackExists && app.StackId && app.StackId !== '0') {
      updatedStacks.push({
        Id: app.StackId,
        Name: app.StackName ?? '',
        Applications: [app],
        Highlighted: false,
      });
    }
    return updatedStacks;
  }, []);
  return res;
}
