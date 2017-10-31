package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerDeploymentIdentifierNotFound defines an error raised when Portainer is unable to find a deployment identifier
	ErrDockerDeploymentIdentifierNotFound = portainer.Error("Docker depoyment identifier not found")
	deploymentIdentifier                  = "Id"
	deploymentLabelForServiceIdentifier   = "com.docker.swarm.service.id"
	deploymentLabelForStackIdentifier     = "com.docker.stack.namespace"
)

// deploymentListOperation extracts the response as a JSON object, loop through the deployments array
// decorate and/or filter the deployments based on resource controls before rewriting the response
func deploymentListOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	var err error
	// DeploymentList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/DeploymentList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if executor.operationContext.isAdmin {
		responseArray, err = decorateDeploymentList(responseArray, executor.operationContext.resourceControls)
	} else {
		responseArray, err = filterDeploymentList(responseArray, executor.operationContext)
	}
	if err != nil {
		return err
	}

	if executor.labelBlackList != nil {
		responseArray, err = filterDeploymentsWithBlackListedLabels(responseArray, executor.labelBlackList)
		if err != nil {
			return err
		}
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// deploymentInspectOperation extracts the response as a JSON object, verify that the user
// has access to the deployment based on resource control (check are done based on the deploymentID and optional Swarm service ID)
// and either rewrite an access denied response or a decorated deployment.
func deploymentInspectOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	// DeploymentInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.28/#operation/DeploymentInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if responseObject[deploymentIdentifier] == nil {
		return ErrDockerDeploymentIdentifierNotFound
	}

	deploymentID := responseObject[deploymentIdentifier].(string)
	responseObject, access := applyResourceAccessControl(responseObject, deploymentID, executor.operationContext)
	if !access {
		return rewriteAccessDeniedResponse(response)
	}

	deploymentLabels := extractDeploymentLabelsFromDeploymentInspectObject(responseObject)
	responseObject, access = applyResourceAccessControlFromLabel(deploymentLabels, responseObject, deploymentLabelForServiceIdentifier, executor.operationContext)
	if !access {
		return rewriteAccessDeniedResponse(response)
	}

	responseObject, access = applyResourceAccessControlFromLabel(deploymentLabels, responseObject, deploymentLabelForStackIdentifier, executor.operationContext)
	if !access {
		return rewriteAccessDeniedResponse(response)
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}

// extractDeploymentLabelsFromDeploymentInspectObject retrieve the Labels of the deployment if present.
// Deployment schema reference: https://docs.docker.com/engine/api/v1.28/#operation/DeploymentInspect
func extractDeploymentLabelsFromDeploymentInspectObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Config.Labels
	deploymentConfigObject := extractJSONField(responseObject, "Config")
	if deploymentConfigObject != nil {
		deploymentLabelsObject := extractJSONField(deploymentConfigObject, "Labels")
		return deploymentLabelsObject
	}
	return nil
}

// extractDeploymentLabelsFromDeploymentListObject retrieve the Labels of the deployment if present.
// Deployment schema reference: https://docs.docker.com/engine/api/v1.28/#operation/DeploymentList
func extractDeploymentLabelsFromDeploymentListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Labels
	deploymentLabelsObject := extractJSONField(responseObject, "Labels")
	return deploymentLabelsObject
}

// decorateDeploymentList loops through all deployments and decorates any deployment with an existing resource control.
// Resource controls checks are based on: resource identifier, service identifier (from label), stack identifier (from label).
// Deployment object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/DeploymentList
func decorateDeploymentList(deploymentData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedDeploymentData := make([]interface{}, 0)

	for _, deployment := range deploymentData {

		deploymentObject := deployment.(map[string]interface{})
		if deploymentObject[deploymentIdentifier] == nil {
			return nil, ErrDockerDeploymentIdentifierNotFound
		}

		deploymentID := deploymentObject[deploymentIdentifier].(string)
		deploymentObject = decorateResourceWithAccessControl(deploymentObject, deploymentID, resourceControls)

		deploymentLabels := extractDeploymentLabelsFromDeploymentListObject(deploymentObject)
		deploymentObject = decorateResourceWithAccessControlFromLabel(deploymentLabels, deploymentObject, deploymentLabelForServiceIdentifier, resourceControls)
		deploymentObject = decorateResourceWithAccessControlFromLabel(deploymentLabels, deploymentObject, deploymentLabelForStackIdentifier, resourceControls)

		decoratedDeploymentData = append(decoratedDeploymentData, deploymentObject)
	}

	return decoratedDeploymentData, nil
}

// filterDeploymentList loops through all deployments and filters public deployments (no associated resource control)
// as well as authorized deployments (access granted to the user based on existing resource control).
// Authorized deployments are decorated during the process.
// Resource controls checks are based on: resource identifier, service identifier (from label), stack identifier (from label).
// Deployment object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/DeploymentList
func filterDeploymentList(deploymentData []interface{}, context *restrictedOperationContext) ([]interface{}, error) {
	filteredDeploymentData := make([]interface{}, 0)

	for _, deployment := range deploymentData {
		deploymentObject := deployment.(map[string]interface{})
		if deploymentObject[deploymentIdentifier] == nil {
			return nil, ErrDockerDeploymentIdentifierNotFound
		}

		deploymentID := deploymentObject[deploymentIdentifier].(string)
		deploymentObject, access := applyResourceAccessControl(deploymentObject, deploymentID, context)
		if access {
			deploymentLabels := extractDeploymentLabelsFromDeploymentListObject(deploymentObject)
			deploymentObject, access = applyResourceAccessControlFromLabel(deploymentLabels, deploymentObject, deploymentLabelForServiceIdentifier, context)
			if access {
				deploymentObject, access = applyResourceAccessControlFromLabel(deploymentLabels, deploymentObject, deploymentLabelForStackIdentifier, context)
				if access {
					filteredDeploymentData = append(filteredDeploymentData, deploymentObject)
				}
			}
		}
	}

	return filteredDeploymentData, nil
}

// filterDeploymentsWithLabels loops through a list of deployments, and filters deployments that do not contains
// any labels in the labels black list.
func filterDeploymentsWithBlackListedLabels(deploymentData []interface{}, labelBlackList []portainer.Pair) ([]interface{}, error) {
	filteredDeploymentData := make([]interface{}, 0)

	for _, deployment := range deploymentData {
		deploymentObject := deployment.(map[string]interface{})

		deploymentLabels := extractDeploymentLabelsFromDeploymentListObject(deploymentObject)
		if deploymentLabels != nil {
			if !deploymentHasBlackListedLabel(deploymentLabels, labelBlackList) {
				filteredDeploymentData = append(filteredDeploymentData, deploymentObject)
			}
		} else {
			filteredDeploymentData = append(filteredDeploymentData, deploymentObject)
		}
	}

	return filteredDeploymentData, nil
}

func deploymentHasBlackListedLabel(deploymentLabels map[string]interface{}, labelBlackList []portainer.Pair) bool {
	for key, value := range deploymentLabels {
		labelName := key
		labelValue := value.(string)

		for _, blackListedLabel := range labelBlackList {
			if blackListedLabel.Name == labelName && blackListedLabel.Value == labelValue {
				return true
			}
		}
	}

	return false
}
