// Package request provides function to retrieve content from a *http.Request object of the net/http standard library,
// be it JSON body payload, multi-part form values or query parameters.
// It also provides functions to retrieve route variables when using gorilla/mux.
package request

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

const (
	// ErrInvalidQueryParameter defines the message of an error raised when a mandatory query parameter has an invalid value.
	ErrInvalidQueryParameter = "Invalid query parameter"
	// ErrInvalidRequestURL defines the message of an error raised when the data sent in the query or the URL is invalid
	ErrInvalidRequestURL = "Invalid request URL"
	// ErrMissingQueryParameter defines the message of an error raised when a mandatory query parameter is missing.
	ErrMissingQueryParameter = "Missing query parameter"
	// ErrMissingFormDataValue defines the message of an error raised when a mandatory form data value is missing.
	ErrMissingFormDataValue = "Missing form data value"
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

// RetrieveMultiPartFormFile returns the content of an uploaded file (form data) as bytes as well
// as the name of the uploaded file.
func RetrieveMultiPartFormFile(request *http.Request, requestParameter string) ([]byte, string, error) {
	file, headers, err := request.FormFile(requestParameter)
	if err != nil {
		return nil, "", err
	}
	defer file.Close()

	fileContent, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, "", err
	}
	return fileContent, headers.Filename, nil
}

// RetrieveMultiPartFormJSONValue decodes the value of some form data as a JSON object into the target parameter.
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
		return "", errors.New(ErrMissingFormDataValue)
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

// RetrieveBooleanMultiPartFormValue returns the value of some form data as a boolean.
// If optional is set to true, will not return an error when the form data value is not found.
func RetrieveBooleanMultiPartFormValue(request *http.Request, name string, optional bool) (bool, error) {
	value, err := RetrieveMultiPartFormValue(request, name, optional)
	if err != nil {
		return false, err
	}
	return value == "true", nil
}

// RetrieveRouteVariableValue returns the value of a route variable as a string.
func RetrieveRouteVariableValue(request *http.Request, name string) (string, error) {
	routeVariables := mux.Vars(request)
	if routeVariables == nil {
		return "", errors.New(ErrInvalidRequestURL)
	}
	routeVar := routeVariables[name]
	if routeVar == "" {
		return "", errors.New(ErrInvalidRequestURL)
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
		return "", errors.New(ErrMissingQueryParameter)
	}
	return queryParameter, nil
}

// RetrieveNumericQueryParameter returns the value of a query parameter as an integer.
// If optional is set to true, will not return an error when the query parameter is not found.
func RetrieveNumericQueryParameter(request *http.Request, name string, optional bool) (int, error) {
	queryParameter, err := RetrieveQueryParameter(request, name, optional)
	if err != nil {
		return 0, err
	}
	if queryParameter == "" && optional {
		return 0, nil
	}
	return strconv.Atoi(queryParameter)
}

// RetrieveBooleanQueryParameter  returns the value of a query parameter as a boolean.
// If optional is set to true, will not return an error when the query parameter is not found.
func RetrieveBooleanQueryParameter(request *http.Request, name string, optional bool) (bool, error) {
	queryParameter, err := RetrieveQueryParameter(request, name, optional)
	if err != nil {
		return false, err
	}
	return queryParameter == "true", nil
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
