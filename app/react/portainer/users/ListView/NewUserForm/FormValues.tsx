import { TeamId } from '../../teams/types';

export interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
  teams: TeamId[];
}
