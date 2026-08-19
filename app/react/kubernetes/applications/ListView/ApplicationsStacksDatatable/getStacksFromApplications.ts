import { Application } from '../ApplicationsDatatable/types';

import { Stack } from './types';

export function getStacksFromApplications(applications: Application[]) {
  const res = applications.reduce<Stack[]>((stacks, app) => {
    const updatedStacks = stacks.map((stack) => {
      if (
        stack.Name === app.StackName &&
        stack.ResourcePool === app.ResourcePool
      ) {
        return {
          ...stack,
          Applications: [...stack.Applications, app],
        };
      }
      return stack;
    });

    const stackExists = updatedStacks.some(
      (stack) =>
        stack.Name === app.StackName && stack.ResourcePool === app.ResourcePool
    );

    if (!stackExists && app.StackName) {
      updatedStacks.push({
        Name: app.StackName,
        ResourcePool: app.ResourcePool,
        Applications: [app],
        Highlighted: false,
      });
    }
    return updatedStacks;
  }, []);
  return res;
}
