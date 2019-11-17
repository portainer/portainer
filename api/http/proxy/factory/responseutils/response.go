package responseutils

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
)

// GetResponseAsJSONOBject returns the response content as a generic JSON object
func GetResponseAsJSONOBject(response *http.Response) (map[string]interface{}, error) {
	responseData, err := getResponseBodyAsGenericJSON(response)
	if err != nil {
		return nil, err
	}

	responseObject := responseData.(map[string]interface{})
	return responseObject, nil
}

// GetResponseAsJSONArray returns the response content as an array of generic JSON object
func GetResponseAsJSONArray(response *http.Response) ([]interface{}, error) {
	responseData, err := getResponseBodyAsGenericJSON(response)
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

func getResponseBodyAsGenericJSON(response *http.Response) (interface{}, error) {
	if response.Body == nil {
		return nil, errors.New("unable to parse response: empty response body")
	}

	var data interface{}
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	err = response.Body.Close()
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(body, &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

type dockerErrorResponse struct {
	Message string `json:"message,omitempty"`
}

// WriteAccessDeniedResponse will create a new access denied response
func WriteAccessDeniedResponse() (*http.Response, error) {
	response := &http.Response{}
	err := RewriteResponse(response, dockerErrorResponse{Message: "access denied to resource"}, http.StatusForbidden)
	return response, err
}

// RewriteAccessDeniedResponse will overwrite the existing response with an access denied response
func RewriteAccessDeniedResponse(response *http.Response) error {
	return RewriteResponse(response, dockerErrorResponse{Message: "access denied to resource"}, http.StatusForbidden)
}

// RewriteResponse will replace the existing response body and status code with the one specified
// in parameters
func RewriteResponse(response *http.Response, newResponseData interface{}, statusCode int) error {
	jsonData, err := json.Marshal(newResponseData)
	if err != nil {
		return err
	}

	body := ioutil.NopCloser(bytes.NewReader(jsonData))

	response.StatusCode = statusCode
	response.Body = body
	response.ContentLength = int64(len(jsonData))

	if response.Header == nil {
		response.Header = make(http.Header)
	}
	response.Header.Set("Content-Length", strconv.Itoa(len(jsonData)))

	return nil
}
