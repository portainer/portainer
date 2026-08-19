package cli

import (
	"testing"

	"github.com/stretchr/testify/require"
	"k8s.io/client-go/tools/remotecommand"
)

func Test_TerminalSizeQueue(t *testing.T) {
	t.Parallel()
	t.Run("Next returns pushed size", func(t *testing.T) {
		q := NewTerminalSizeQueue()
		defer q.Close()

		go q.Push(80, 24)
		size := q.Next()
		require.NotNil(t, size)
		require.Equal(t, uint16(80), size.Width)
		require.Equal(t, uint16(24), size.Height)
	})

	t.Run("Next returns sizes in push order", func(t *testing.T) {
		q := NewTerminalSizeQueue()
		defer q.Close()

		go q.Push(80, 24)
		size := q.Next()
		require.NotNil(t, size)
		require.Equal(t, uint16(80), size.Width)
		require.Equal(t, uint16(24), size.Height)

		go q.Push(120, 40)
		size = q.Next()
		require.NotNil(t, size)
		require.Equal(t, uint16(120), size.Width)
		require.Equal(t, uint16(40), size.Height)
	})

	t.Run("Close causes Next to return nil", func(t *testing.T) {
		q := NewTerminalSizeQueue()
		q.Close()

		size := q.Next()
		require.Nil(t, size)
	})

	t.Run("Next unblocks when queue is closed", func(t *testing.T) {
		q := NewTerminalSizeQueue()

		result := make(chan *remotecommand.TerminalSize, 1)
		go func() { result <- q.Next() }()

		q.Close()
		require.Nil(t, <-result)
	})

	t.Run("Close is idempotent", func(t *testing.T) {
		q := NewTerminalSizeQueue()
		q.Close()
		q.Close()
	})
}
