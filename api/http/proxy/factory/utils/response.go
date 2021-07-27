package utils

import (
	"bytes"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
)

// GetResponseAsJSONObject returns the response content as a generic JSON object
func GetResponseAsJSONObject(response *http.Response) (map[string]interface{}, error) {
	responseData, err := getResponseBody(response)
	if err != nil {
		return nil, err
	}

	responseObject := responseData.(map[string]interface{})
	return responseObject, nil
}

// GetResponseAsJSONArray returns the response content as an array of generic JSON object
func GetResponseAsJSONArray(response *http.Response) ([]interface{}, error) {
	responseData, err := getResponseBody(response)
	if err != nil {
		return nil, err
	}

	switch responseObject := responseData.(type) {
	case []interface{}:
		return responseObject, nil
	case map[string]interface{}:
		if responseObject["message"] != nil {
			return nil, errors.New(responseObject["message"].(string))
		}
		log.Printf("[ERROR] [http,proxy,response] [message: invalid response format, expecting JSON array] [response: %+v]", responseObject)
		return nil, errors.New("unable to parse response: expected JSON array, got JSON object")
	default:
		log.Printf("[ERROR] [http,proxy,response] [message: invalid response format, expecting JSON array] [response: %+v]", responseObject)
		return nil, errors.New("unable to parse response: expected JSON array")
	}
}

type errorResponse struct {
	Message string `json:"message,omitempty"`
}

// WriteAccessDeniedResponse will create a new access denied response
func WriteAccessDeniedResponse() (*http.Response, error) {
	response := &http.Response{}
	err := RewriteResponse(response, errorResponse{Message: "access denied to resource"}, http.StatusForbidden)
	return response, err
}

// RewriteAccessDeniedResponse will overwrite the existing response with an access denied response
func RewriteAccessDeniedResponse(response *http.Response) error {
	return RewriteResponse(response, errorResponse{Message: "access denied to resource"}, http.StatusForbidden)
}

// RewriteResponse will replace the existing response body and status code with the one specified
// in parameters
func RewriteResponse(response *http.Response, newResponseData interface{}, statusCode int) error {
	data, err := marshal(getContentType(response.Header), newResponseData)
	if err != nil {
		return err
	}

	body := ioutil.NopCloser(bytes.NewReader(data))

	response.StatusCode = statusCode
	response.Body = body
	response.ContentLength = int64(len(data))

	if response.Header == nil {
		response.Header = make(http.Header)
	}
	response.Header.Set("Content-Length", strconv.Itoa(len(data)))

	return nil
}

func getResponseBody(response *http.Response) (interface{}, error) {
	isGzip := response.Header.Get("Content-Encoding") == "gzip"

	if isGzip {
		response.Header.Del("Content-Encoding")
	}

	return getBody(response.Body, getContentType(response.Header), isGzip)
}

func getContentType(headers http.Header) string {
	return headers.Get("Content-type")
}
