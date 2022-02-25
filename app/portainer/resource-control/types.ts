import { TeamId } from '@/portainer/teams/types';
import { UserId } from '@/portainer/users/types';

/**
 * Transient type from view data to payload
 */
export interface OwnershipParameters {
  administratorsOnly: boolean;
  public: boolean;
  users: UserId[];
  teams: TeamId[];
  subResources: (number | string)[];
}
