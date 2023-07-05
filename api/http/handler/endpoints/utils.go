package endpoints

func ptr[T any](i T) *T { return &i }

func BoolAddr(b bool) *bool {
	return ptr(b)
}
