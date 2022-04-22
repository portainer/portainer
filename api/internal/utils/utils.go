package utils

// Contains returns true if the given int is contained in the given slice of int.
func Contains(s []int, e int) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}
