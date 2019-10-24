package misc

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	"github.com/portainer/portainer/api"
)

func ExtractJSONField(jsonObject map[string]interface{}, key string) map[string]interface{} {
	object := jsonObject[key]
	if object != nil {
		return object.(map[string]interface{})
	}
	return nil
}

func GetResponseAsJSONOBject(response *http.Response) (map[string]interface{}, error) {
	responseData, err := getResponseBodyAsGenericJSON(response)
	if err != nil {
		return nil, err
	}

	responseObject := responseData.(map[string]interface{})
	return responseObject, nil
}

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

func WriteAccessDeniedResponse() (*http.Response, error) {
	response := &http.Response{}
	err := RewriteResponse(response, portainer.ErrResourceAccessDenied, http.StatusForbidden)
	return response, err
}

func RewriteAccessDeniedResponse(response *http.Response) error {
	return RewriteResponse(response, portainer.ErrResourceAccessDenied, http.StatusForbidden)
}

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
