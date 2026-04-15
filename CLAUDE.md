# Portainer Community Edition

Open-source container management platform with full Docker and Kubernetes support.

see also:

- docs/guidelines/server-architecture.md
- docs/guidelines/go-conventions.md
- docs/guidelines/typescript-conventions.md

## Package Manager

- **PNPM** 10+ (for frontend)
- **Go** 1.25.8 (for backend)

## Build Commands

```bash
# Full build
make build              # Build both client and server
make build-client       # Build React/AngularJS frontend
make build-server       # Build Go binary
make build-image        # Build Docker image

# Development
make dev                # Run both in dev mode
make dev-client         # Start webpack-dev-server (port 8999)
make dev-server         # Run containerized Go server

# Frontend
pnpm dev            # Webpack dev server
pnpm build          # Build frontend with webpack
pnpm typecheck      # Run typecheck for frontend (with tsc)
pnpm lint           # lint frontend (with eslint)
pnpm test           # test frontend (with vitest)
pnpm format         # format frontend (with prettier)

# Testing
make test               # All tests (backend + frontend)
make test-server        # Backend tests only
make lint               # Lint all code
make format             # Format code
```

## Development Servers

- Frontend: http://localhost:8999
- Backend: http://localhost:9000 (HTTP) / https://localhost:9443 (HTTPS)
