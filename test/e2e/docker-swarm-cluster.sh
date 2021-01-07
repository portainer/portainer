#!/bin/sh

exec_in() { docker-compose exec -T $@; }

# Up all dinds nodes
docker-compose up -d

# Manager1 init
exec_in manager1 docker swarm init
TOKEN_WORKER="$(exec_in manager1 docker swarm join-token -q worker)"
TOKEN_MANAGER="$(exec_in manager1 docker swarm join-token -q manager)"

# Manager2 join
exec_in manager2 docker swarm join --token $TOKEN_MANAGER manager1:2377

# Worker1 join
exec_in worker1 docker swarm join --token $TOKEN_WORKER manager1:2377

# Worker2 join
exec_in worker2 docker swarm join --token $TOKEN_WORKER manager1:2377

# Deploy agent within dind swarm
exec_in manager1 docker stack deploy -c agent-stack.yml portainer-agent
