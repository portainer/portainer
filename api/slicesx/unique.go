package slicesx

func Unique[T comparable](items []T) []T {
	return UniqueBy(items, func(item T) T {
		return item
	})
}

func UniqueBy[ItemType any, ComparableType comparable](items []ItemType, accessorFunc func(ItemType) ComparableType) []ItemType {
	includedItems := make(map[ComparableType]bool)
	result := []ItemType{}

	for _, item := range items {
		if _, isIncluded := includedItems[accessorFunc(item)]; !isIncluded {
			includedItems[accessorFunc(item)] = true
			result = append(result, item)
		}
	}

	return result
}
