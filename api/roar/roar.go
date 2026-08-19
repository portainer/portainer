package roar

import (
	"fmt"

	"github.com/RoaringBitmap/roaring/v2"
)

type Roar[T ~int] struct {
	rb *roaring.Bitmap
}

// Iterate iterates over the bitmap, calling the given callback with each value in the bitmap.  If the callback returns
// false, the iteration is halted.
// The iteration results are undefined if the bitmap is modified (e.g., with Add or Remove).
// There is no guarantee as to what order the values will be iterated.
func (r *Roar[T]) Iterate(f func(T) bool) {
	if r.rb == nil {
		return
	}

	r.rb.Iterate(func(e uint32) bool {
		return f(T(e))
	})
}

// Len returns the number of elements contained in the bitmap
func (r *Roar[T]) Len() int {
	if r.rb == nil {
		return 0
	}

	return int(r.rb.GetCardinality())
}

// Remove removes the given element from the bitmap
func (r *Roar[T]) Remove(e T) {
	if r.rb == nil {
		return
	}

	r.rb.Remove(uint32(e))
}

// Add adds the given element to the bitmap
func (r *Roar[T]) Add(e T) {
	if r.rb == nil {
		r.rb = roaring.New()
	}

	r.rb.AddInt(int(e))
}

// Contains returns whether the bitmap contains the given element or not
func (r *Roar[T]) Contains(e T) bool {
	if r.rb == nil {
		return false
	}

	return r.rb.ContainsInt(int(e))
}

// Union combines the elements of the given bitmap with this bitmap
func (r *Roar[T]) Union(other Roar[T]) {
	if other.rb == nil {
		return
	} else if r.rb == nil {
		r.rb = roaring.New()
	}

	r.rb.Or(other.rb)
}

// Intersection modifies this bitmap to only contain elements that are also in the other bitmap
func (r *Roar[T]) Intersection(other Roar[T]) {
	if other.rb == nil {
		if r.rb != nil {
			r.rb.Clear()
		}

		return
	}

	if r.rb == nil {
		r.rb = roaring.New()
	}

	r.rb.And(other.rb)
}

// ToSlice converts the bitmap to a slice of elements
func (r *Roar[T]) ToSlice() []T {
	if r.rb == nil {
		return make([]T, 0)
	}

	slice := make([]T, 0, r.rb.GetCardinality())
	r.rb.Iterate(func(e uint32) bool {
		slice = append(slice, T(e))

		return true
	})

	return slice
}

func (r *Roar[T]) MarshalJSON() ([]byte, error) {
	if r.rb == nil {
		return []byte("null"), nil
	}

	r.rb.RunOptimize()

	buf, err := r.rb.ToBase64()
	if err != nil {
		return nil, fmt.Errorf("failed to encode roaring bitmap: %w", err)
	}

	return fmt.Appendf(nil, `"%s"`, buf), nil
}

func (r *Roar[T]) UnmarshalJSON(data []byte) error {
	if len(data) == 0 || string(data) == "null" {
		return nil
	}

	r.rb = roaring.New()

	_, err := r.rb.FromBase64(string(data[1 : len(data)-1]))

	return err
}

// FromSlice creates a Roar by adding all elements from the provided slices
func FromSlice[T ~int](ess ...[]T) Roar[T] {
	var r Roar[T]

	for _, es := range ess {
		for _, e := range es {
			r.Add(e)
		}
	}

	return r
}
