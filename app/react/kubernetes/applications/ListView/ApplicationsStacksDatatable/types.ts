import { Application } from '../ApplicationsDatatable/types';

export type Stack = {
  Id: string;
  Name: string;
  Applications: Application[];
  Highlighted: boolean;
};
