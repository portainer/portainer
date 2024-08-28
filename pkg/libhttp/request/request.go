// Package request provides function to retrieve content from a *http.Request object of the net/http standard library,
// be it JSON body payload, multi-part form values or query parameters.
// It also provides functions to retrieve route variables when using gorilla/mux.
package request

import (
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
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

// RetrieveMultiPartFormFile returns the content of an uploaded file (form data) as bytes as well
// as the name of the uploaded file.
func RetrieveMultiPartFormFile(request *http.Request, requestParameter string) ([]byte, string, error) {
	file, headers, err := request.FormFile(requestParameter)
	if err != nil {
		return nil, "", err
	}
	defer file.Close()

	fileContent, err := io.ReadAll(file)
	if err != nil {
		return nil, "", err
	}

	return fileContent, headers.Filename, nil
}

// RetrieveMultiPartFormJSONValue decodes the value of some form data as a JSON object into the target parameter.
// If optional is set to true, will not return an error when the form data value is not found.
func RetrieveMultiPartFormJSONValue(request *http.Request, name string, target any, optional bool) error {
	value, err := RetrieveMultiPartFormValue(request, name, optional)
	if err != nil {
		return err
	} else if value == "" {
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
	} else if queryParameter == "" && optional {
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

// RetrieveJSONQueryParameter decodes the value of a query parameter as a JSON object into the target parameter.
// If optional is set to true, will not return an error when the query parameter is not found.
func RetrieveJSONQueryParameter(request *http.Request, name string, target any, optional bool) error {
	queryParameter, err := RetrieveQueryParameter(request, name, optional)
	if err != nil {
		return err
	} else if queryParameter == "" {
		return nil
	}

	return json.Unmarshal([]byte(queryParameter), target)
}
