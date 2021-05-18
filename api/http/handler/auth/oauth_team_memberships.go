package auth

import (
	"fmt"
	"log"
	"regexp"
	"strings"

	portainer "github.com/portainer/portainer/api"
)

// removeMemberships removes a user's team membership(s) if user does not belong to it/them anymore
func removeMemberships(tms portainer.TeamMembershipService, user portainer.User, teams []portainer.Team) error {
	log.Println("[DEBUG] [internal,oauth] [message: removing user team memberships which no longer exist]")
	memberships, err := tms.TeamMembershipsByUserID(user.ID)
	if err != nil {
		return err
	}

	for _, membership := range memberships {
		teamsContainsTeamID := false
		for _, team := range teams {
			if team.ID == membership.TeamID {
				teamsContainsTeamID = true
				break
			}
		}

		if !teamsContainsTeamID {
			err := tms.DeleteTeamMembership(membership.ID)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// createOrUpdateMembership creates a membership if it does not exist or updates a memberships role (if already existent)
func createOrUpdateMembership(tms portainer.TeamMembershipService, user portainer.User, team portainer.Team) error {
	memberships, err := tms.TeamMembershipsByTeamID(team.ID)
	if err != nil {
		return err
	}
	log.Printf("[DEBUG] [internal,oauth] [message: memberships: %v]", memberships)

	var membership *portainer.TeamMembership
	for _, m := range memberships {
		if m.UserID == user.ID {
			membership = &m
			break
		}
	}

	if membership == nil {
		membership = &portainer.TeamMembership{
			UserID: user.ID,
			TeamID: team.ID,
			Role:   portainer.MembershipRole(user.Role),
		}
		log.Printf("[DEBUG] [internal,oauth] [message: creating oauth user team membership: %v]", membership)
		err = tms.CreateTeamMembership(membership)
		if err != nil {
			return err
		}
	} else {
		log.Printf("[DEBUG] [internal,oauth] [message: membership found %v]", membership)
		if updatedRole := portainer.MembershipRole(user.Role); membership.Role != updatedRole {
			log.Printf("[DEBUG] [internal,oauth] [message: updating membership role %d]", updatedRole)
			membership.Role = updatedRole
			err = tms.UpdateTeamMembership(membership.ID, membership)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

// mapAllClaimValuesToTeams maps claim values to teams if no explicit mapping exists.
// Mapping oauth teams (claim values) to portainer teams by case-insensitive team name
func mapAllClaimValuesToTeams(ts portainer.TeamService, user portainer.User, oAuthTeams []string) ([]portainer.Team, error) {
	teams := make([]portainer.Team, 0)

	log.Println("[DEBUG] [internal,oauth] [message: mapping oauth claim values automatically to existing portainer teams]")
	dsTeams, err := ts.Teams()
	if err != nil {
		return []portainer.Team{}, err
	}

	for _, oAuthTeam := range oAuthTeams {
		for _, team := range dsTeams {
			if strings.EqualFold(team.Name, oAuthTeam) {
				teams = append(teams, team)
			}
		}
	}

	return teams, nil
}

// mapClaimValRegexToTeams maps oauth ClaimValRegex values (stored in settings) to oauth provider teams.
// The `ClaimValRegex` is a regexp string that is matched against the oauth team value(s) extracted from oauth user response.
// A successful match entails extraction of the respective portainer team (for the mapping).
func mapClaimValRegexToTeams(ts portainer.TeamService, claimMappings []portainer.OAuthClaimMappings, oAuthTeams []string) ([]portainer.Team, error) {
	teams := make([]portainer.Team, 0)

	log.Println("[DEBUG] [internal,oauth] [message: using oauth claim mappings to map groups to portainer teams]")
	for _, oAuthTeam := range oAuthTeams {
		for _, mapping := range claimMappings {
			match, err := regexp.MatchString(mapping.ClaimValRegex, oAuthTeam)
			if err != nil {
				return nil, err
			}

			if match {
				log.Printf("[DEBUG] [internal,oauth] [message: oauth mapping claim matched; claim: %s, team: %s]\n", mapping.ClaimValRegex, oAuthTeam)

				team, err := ts.Team(portainer.TeamID(mapping.Team))
				if err != nil {
					return nil, err
				}

				teams = append(teams, *team)
			}
		}
	}

	return teams, nil
}

// updateOAuthTeamMemberships will create, update and delete an oauth user's team memberships.
// The mappings of oauth groups to portainer teams is based on the length of `OAuthClaimMappings`; use them if they exist (len > 0),
// otherwise map the **values** of the oauth `Claim name` (`OAuthClaimName`) to already existent portainer teams (case-insensitive).
func updateOAuthTeamMemberships(dataStore portainer.DataStore, oAuthClaimMappings []portainer.OAuthClaimMappings, user portainer.User, oAuthTeams []string) error {
	var teams []portainer.Team
	var err error

	if len(oAuthClaimMappings) > 0 {
		teams, err = mapClaimValRegexToTeams(dataStore.Team(), oAuthClaimMappings, oAuthTeams)
		if err != nil {
			return fmt.Errorf("failed to map claim value regex(s) to teams, mappings: %v, err: %w", oAuthClaimMappings, err)
		}
	} else {
		teams, err = mapAllClaimValuesToTeams(dataStore.Team(), user, oAuthTeams)
		if err != nil {
			return fmt.Errorf("failed to map claim value(s) to portainer teams, err: %w", err)
		}
	}

	for _, team := range teams {
		err := createOrUpdateMembership(dataStore.TeamMembership(), user, team)
		if err != nil {
			return fmt.Errorf("failed to create or update oauth memberships, user: %v, team: %v, err: %w", user, team, err)
		}
	}

	err = removeMemberships(dataStore.TeamMembership(), user, teams)
	if err != nil {
		return fmt.Errorf("failed to remove oauth memberships, user: %v, err: %w", user, err)
	}

	return nil
}
