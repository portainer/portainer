import { Application } from '../ApplicationsDatatable/types';

export type Stack = {
  Name: string;
  ResourcePool: string;
  Applications: Application[];
  Highlighted: boolean;
};
