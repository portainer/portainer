package dataservices

import (
	"errors"
	"fmt"

	perrors "github.com/portainer/portainer/api/dataservices/errors"

	"github.com/rs/zerolog/log"
)

// ErrStop signals the stop of computation when filtering results
var ErrStop = errors.New("stop")

func IsErrObjectNotFound(e error) bool {
	return errors.Is(e, perrors.ErrObjectNotFound)
}

// AppendFn appends elements to the given collection slice
func AppendFn[T any](collection *[]T) func(obj interface{}) (interface{}, error) {
	return func(obj interface{}) (interface{}, error) {
		element, ok := obj.(*T)
		if !ok {
			log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("type assertion failed")
			return nil, fmt.Errorf("failed to convert to %T object: %#v", new(T), obj)
		}

		*collection = append(*collection, *element)

		return new(T), nil
	}
}

// FilterFn appends elements to the given collection when the predicate is true
func FilterFn[T any](collection *[]T, predicate func(T) bool) func(obj interface{}) (interface{}, error) {
	return func(obj interface{}) (interface{}, error) {
		element, ok := obj.(*T)
		if !ok {
			log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("type assertion failed")
			return nil, fmt.Errorf("failed to convert to %T object: %#v", new(T), obj)
		}

		if predicate(*element) {
			*collection = append(*collection, *element)
		}

		return new(T), nil
	}
}

// FirstFn sets the element to the first one that satisfies the predicate and stops the computation, returns ErrStop on
// success
func FirstFn[T any](element *T, predicate func(T) bool) func(obj interface{}) (interface{}, error) {
	return func(obj interface{}) (interface{}, error) {
		e, ok := obj.(*T)
		if !ok {
			log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("type assertion failed")
			return nil, fmt.Errorf("failed to convert to %T object: %#v", new(T), obj)
		}

		if predicate(*e) {
			*element = *e
			return new(T), ErrStop
		}

		return new(T), nil
	}
}
