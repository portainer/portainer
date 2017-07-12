package proxy

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/portainer/portainer"
)

const (
	// ErrEmptyResponseBody defines an error raised when portainer excepts to parse the body of a HTTP response and there is nothing to parse
	ErrEmptyResponseBody = portainer.Error("Empty response body")
)

func extractJSONField(jsonObject map[string]interface{}, key string) map[string]interface{} {
	object := jsonObject[key]
	if object != nil {
		return object.(map[string]interface{})
	}
	return nil
}

func getResponseAsJSONOBject(response *http.Response) (map[string]interface{}, error) {
	responseData, err := getResponseBodyAsGenericJSON(response)
	if err != nil {
		return nil, err
	}

	responseObject := responseData.(map[string]interface{})
	return responseObject, nil
}

func getResponseAsJSONArray(response *http.Response) ([]interface{}, error) {
	responseData, err := getResponseBodyAsGenericJSON(response)
	if err != nil {
		return nil, err
	}

	responseObject := responseData.([]interface{})
	return responseObject, nil
}

func getResponseBodyAsGenericJSON(response *http.Response) (interface{}, error) {
	var data interface{}
	if response.Body != nil {
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
	return nil, ErrEmptyResponseBody
}

func writeAccessDeniedResponse() (*http.Response, error) {
	response := &http.Response{}
	err := rewriteResponse(response, portainer.ErrResourceAccessDenied, http.StatusForbidden)
	return response, err
}

func rewriteAccessDeniedResponse(response *http.Response) error {
	return rewriteResponse(response, portainer.ErrResourceAccessDenied, http.StatusForbidden)
}

func rewriteResponse(response *http.Response, newResponseData interface{}, statusCode int) error {
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
