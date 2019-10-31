package responseutils

// GetJSONObject will extract an object from a specific property of another JSON object.
// Returns nil if nothing is associated to the specified key.
func GetJSONObject(jsonObject map[string]interface{}, property string) map[string]interface{} {
	object := jsonObject[property]
	if object != nil {
		return object.(map[string]interface{})
	}
	return nil
}
