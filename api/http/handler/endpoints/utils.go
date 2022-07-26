package endpoints

func BoolAddr(b bool) *bool {
	boolVar := b
	return &boolVar
}
