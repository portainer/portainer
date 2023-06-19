package unique

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

/**

type someType struct {
	id int
	fn func()
}

func Test() {
	ids := []int{1, 2, 3, 3}
	_ = UniqueBy(ids, func(id int) int { return id })
	_ = Unique(ids)                                   // shorthand for UniqueBy Identity/self

	as := []someType{{id: 1}, {id: 2}, {id: 3}, {id: 3}}
	_ = UniqueBy(as, func(item someType) int { return item.id })   // no error
	_ = UniqueBy(as, func(item someType) someType { return item }) // compile error - someType is not comparable
	_ = Unique(as)                                                 // compile error - shorthand fails for the same reason
}

*/
