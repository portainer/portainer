package crypto

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestService_Hash(t *testing.T) {
	t.Parallel()
	var s = Service{}

	type args struct {
		hash string
		data string
	}
	tests := []struct {
		name   string
		args   args
		expect bool
	}{
		{
			name: "Empty",
			args: args{
				hash: "",
				data: "",
			},
			expect: false,
		},
		{
			name: "Matching",
			args: args{
				hash: "$2a$10$6BFGd94oYx8k0bFNO6f33uPUpcpAJyg8UVX.akLe9EthF/ZBTXqcy",
				data: "Passw0rd!",
			},
			expect: true,
		},
		{
			name: "Not matching",
			args: args{
				hash: "$2a$10$ltKrUZ7492xyutHOb0/XweevU4jyw7QO66rP32jTVOMb3EX3JxA/a",
				data: "Passw0rd!",
			},
			expect: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			err := s.CompareHashAndData(tt.args.hash, tt.args.data)
			if (err != nil) == tt.expect {
				t.Errorf("Service.CompareHashAndData() = %v", err)
			}
		})
	}
}

func TestHash(t *testing.T) {
	t.Parallel()
	s := Service{}

	hash, err := s.Hash("Passw0rd!")
	require.NoError(t, err)
	require.NotEmpty(t, hash)
}
