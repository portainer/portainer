package request

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/portainer/http/error"
)

// PayloadValidation is an interface used to validate the payload of a request.
type PayloadValidation interface {
	Validate(request *http.Request) error
}

// DecodeAndValidateJSONPayload decodes the body of the request into an object
// implementing the PayloadValidation interface.
// It also triggers a validation of object content.
func DecodeAndValidateJSONPayload(request *http.Request, v PayloadValidation) error {
	if err := json.NewDecoder(request.Body).Decode(v); err != nil {
		return err
	}
	return v.Validate(request)
}

// RetrieveMultiPartFormFile returns the content of an uploaded file (form data) as bytes.
func RetrieveMultiPartFormFile(request *http.Request, requestParameter string) ([]byte, error) {
	file, _, err := request.FormFile(requestParameter)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	fileContent, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, err
	}
	return fileContent, nil
}

// RetrieveMultiPartFormJSONValue // decodes the value of some form data as a JSON object into the target parameter.
// If optional is set to true, will not return an error when the form data value is not found.
func RetrieveMultiPartFormJSONValue(request *http.Request, name string, target interface{}, optional bool) error {
	value, err := RetrieveMultiPartFormValue(request, name, optional)
	if err != nil {
		return err
	}
	if value == "" {
		return nil
	}
	return json.Unmarshal([]byte(value), target)
}

// RetrieveMultiPartFormValue returns the value of some form data as a string.
// If optional is set to true, will not return an error when the form data value is not found.
func RetrieveMultiPartFormValue(request *http.Request, name string, optional bool) (string, error) {
	value := request.FormValue(name)
	if value == "" && !optional {
		return "", httperror.ErrMissingFormDataValue
	}
	return value, nil
}

// RetrieveNumericMultiPartFormValue returns the value of some form data as an integer.
// If optional is set to true, will not return an error when the form data value is not found.
func RetrieveNumericMultiPartFormValue(request *http.Request, name string, optional bool) (int, error) {
	value, err := RetrieveMultiPartFormValue(request, name, optional)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(value)
}

// RetrieveRouteVariableValue returns the value of a route variable as a string.
func RetrieveRouteVariableValue(request *http.Request, name string) (string, error) {
	routeVariables := mux.Vars(request)
	if routeVariables == nil {
		return "", httperror.ErrInvalidQueryFormat
	}
	routeVar := routeVariables[name]
	if routeVar == "" {
		return "", httperror.ErrInvalidQueryFormat
	}
	return routeVar, nil
}

// RetrieveNumericRouteVariableValue returns the value of a route variable as an integer.
func RetrieveNumericRouteVariableValue(request *http.Request, name string) (int, error) {
	routeVar, err := RetrieveRouteVariableValue(request, name)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(routeVar)
}

// RetrieveQueryParameter returns the value of a query parameter as a string.
// If optional is set to true, will not return an error when the query parameter is not found.
func RetrieveQueryParameter(request *http.Request, name string, optional bool) (string, error) {
	queryParameter := request.FormValue(name)
	if queryParameter == "" && !optional {
		return "", httperror.ErrMissingQueryParameter
	}
	return queryParameter, nil
}

// RetrieveNumericQueryParameter returns the value of a query parameter as an integer.
// If optional is set to true, will not return an error when the query parameter is not found.
// TODO: check if used.
func RetrieveNumericQueryParameter(request *http.Request, name string, optional bool) (int, error) {
	queryParameter, err := RetrieveQueryParameter(request, name, optional)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(queryParameter)
}

// RetrieveJSONQueryParameter decodes the value of a query paramater as a JSON object into the target parameter.
// If optional is set to true, will not return an error when the query parameter is not found.
func RetrieveJSONQueryParameter(request *http.Request, name string, target interface{}, optional bool) error {
	queryParameter, err := RetrieveQueryParameter(request, name, optional)
	if err != nil {
		return err
	}
	if queryParameter == "" {
		return nil
	}
	return json.Unmarshal([]byte(queryParameter), target)
}

// TODO: remove
// GetUploadedFileContent retrieve the content of a file uploaded in the request.
// Uses requestParameter as the key to retrieve the file in the request payload.
func GetUploadedFileContent(request *http.Request, requestParameter string) ([]byte, error) {
	file, _, err := request.FormFile(requestParameter)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	fileContent, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, err
	}
	return fileContent, nil
}
