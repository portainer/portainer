package edgestacks

/*
func Test_updateEndpointRelation_successfulRuns(t *testing.T) {
	edgeStackID := portainer.EdgeStackID(5)
	endpointRelations := []portainer.EndpointRelation{
		{EndpointID: 1, EdgeStacks: map[portainer.EdgeStackID]portainer.EdgeStackStatus{}},
		{EndpointID: 2, EdgeStacks: map[portainer.EdgeStackID]portainer.EdgeStackStatus{}},
		{EndpointID: 3, EdgeStacks: map[portainer.EdgeStackID]portainer.EdgeStackStatus{}},
		{EndpointID: 4, EdgeStacks: map[portainer.EdgeStackID]portainer.EdgeStackStatus{}},
		{EndpointID: 5, EdgeStacks: map[portainer.EdgeStackID]portainer.EdgeStackStatus{}},
	}

	relatedIds := []portainer.EndpointID{2, 3}

	dataStore := testhelpers.NewDatastore(testhelpers.WithEndpointRelations(endpointRelations))

	err := updateEndpointRelations(dataStore.EndpointRelation(), edgeStackID, relatedIds)

	assert.NoError(t, err, "updateEndpointRelations should not fail")

	relatedSet := map[portainer.EndpointID]bool{}
	for _, relationID := range relatedIds {
		relatedSet[relationID] = true
	}

	for _, relation := range endpointRelations {
		shouldBeRelated := relatedSet[relation.EndpointID]
		assert.Equal(t, shouldBeRelated, relation.EdgeStacks[edgeStackID])
	}
}
*/
