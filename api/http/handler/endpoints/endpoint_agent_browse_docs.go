package endpoints

/// This feature is implemented in the agent API and not directly here.
/// However, it's proxied.  So we document it here.

// @summary Upload a file under a specific path on the file system of an environment (endpoint)
// @description Use this environment(endpoint) to upload TLS files.
// @description **Access policy**: administrator
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @accept multipart/form-data
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param volumeID query string false "Optional volume identifier to upload the file"
// @param Path formData string true "The destination path to upload the file to"
// @param file formData file true "The file to upload"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /endpoints/{id}/docker/v2/browse/put [post]
//
//lint:ignore U1000 Ignore unused code, for documentation purposes
func _fileBrowseFileUploadV2() {
	// dummy function to make swag pick up the above docs for the following REST call
	// POST request on /browse/put?volumeID=:id
}
