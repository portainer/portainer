package endpoints

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/assert"
)

func Test_updateTags(t *testing.T) {

	createTags := func(store *datastore.Store, tagNames []string) ([]portainer.Tag, error) {
		tags := make([]portainer.Tag, len(tagNames))
		for index, tagName := range tagNames {
			tag := &portainer.Tag{
				Name:           tagName,
				Endpoints:      make(map[portainer.EndpointID]bool),
				EndpointGroups: make(map[portainer.EndpointGroupID]bool),
			}

			err := store.Tag().Create(tag)
			if err != nil {
				return nil, err
			}

			tags[index] = *tag
		}

		return tags, nil
	}

	checkTags := func(store *datastore.Store, is *assert.Assertions, tagIDs []portainer.TagID, endpointID portainer.EndpointID) {
		for _, tagID := range tagIDs {
			tag, err := store.Tag().Read(tagID)
			is.NoError(err)

			_, ok := tag.Endpoints[endpointID]
			is.True(ok, "expected endpoint to be tagged")
		}
	}

	tagsByName := func(tags []portainer.Tag, tagNames []string) []portainer.Tag {
		result := make([]portainer.Tag, len(tagNames))
		for i, tagName := range tagNames {
			for j, tag := range tags {
				if tag.Name == tagName {
					result[i] = tags[j]
					break
				}
			}
		}

		return result
	}

	getIDs := func(tags []portainer.Tag) []portainer.TagID {
		ids := make([]portainer.TagID, len(tags))
		for i, tag := range tags {
			ids[i] = tag.ID
		}

		return ids
	}

	type testCase struct {
		title              string
		endpoint           *portainer.Endpoint
		tagNames           []string
		endpointTagNames   []string
		tagsToApply        []string
		shouldNotBeUpdated bool
	}

	testFn := func(t *testing.T, testCase testCase) {
		is := assert.New(t)
		_, store := datastore.MustNewTestStore(t, true, true)

		err := store.Endpoint().Create(testCase.endpoint)
		is.NoError(err)

		tags, err := createTags(store, testCase.tagNames)
		is.NoError(err)

		endpointTags := tagsByName(tags, testCase.endpointTagNames)
		for _, tag := range endpointTags {
			tag.Endpoints[testCase.endpoint.ID] = true

			err = store.Tag().Update(tag.ID, &tag)
			is.NoError(err)
		}

		endpointTagIDs := getIDs(endpointTags)
		testCase.endpoint.TagIDs = endpointTagIDs
		err = store.Endpoint().UpdateEndpoint(testCase.endpoint.ID, testCase.endpoint)
		is.NoError(err)

		expectedTags := tagsByName(tags, testCase.tagsToApply)
		expectedTagIDs := make([]portainer.TagID, len(expectedTags))
		for i, tag := range expectedTags {
			expectedTagIDs[i] = tag.ID
		}

		err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			updated, err := updateEnvironmentTags(tx, expectedTagIDs, testCase.endpoint.TagIDs, testCase.endpoint.ID)
			is.NoError(err)

			is.Equal(testCase.shouldNotBeUpdated, !updated)

			return nil
		})

		is.NoError(err)

		checkTags(store, is, expectedTagIDs, testCase.endpoint.ID)
	}

	testCases := []testCase{
		{
			title:            "applying tags to an endpoint without tags",
			endpoint:         &portainer.Endpoint{},
			tagNames:         []string{"tag1", "tag2", "tag3"},
			endpointTagNames: []string{},
			tagsToApply:      []string{"tag1", "tag2", "tag3"},
		},
		{
			title:            "applying tags to an endpoint with tags",
			endpoint:         &portainer.Endpoint{},
			tagNames:         []string{"tag1", "tag2", "tag3", "tag4", "tag5", "tag6"},
			endpointTagNames: []string{"tag1", "tag2", "tag3"},
			tagsToApply:      []string{"tag4", "tag5", "tag6"},
		},
		{
			title:              "applying tags to an endpoint with tags that are already applied",
			endpoint:           &portainer.Endpoint{},
			tagNames:           []string{"tag1", "tag2", "tag3"},
			endpointTagNames:   []string{"tag1", "tag2", "tag3"},
			tagsToApply:        []string{"tag1", "tag2", "tag3"},
			shouldNotBeUpdated: true,
		},
		{
			title:            "adding new tags to an endpoint with tags ",
			endpoint:         &portainer.Endpoint{},
			tagNames:         []string{"tag1", "tag2", "tag3", "tag4", "tag5", "tag6"},
			endpointTagNames: []string{"tag1", "tag2", "tag3"},
			tagsToApply:      []string{"tag1", "tag2", "tag3", "tag4", "tag5", "tag6"},
		},
		{
			title:            "mixing tags that are already applied and new tags",
			endpoint:         &portainer.Endpoint{},
			tagNames:         []string{"tag1", "tag2", "tag3", "tag4", "tag5", "tag6"},
			endpointTagNames: []string{"tag1", "tag2", "tag3"},
			tagsToApply:      []string{"tag2", "tag4", "tag5"},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.title, func(t *testing.T) {
			testFn(t, testCase)
		})
	}
}
