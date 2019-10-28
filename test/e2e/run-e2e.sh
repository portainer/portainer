#!/bin/sh

exec_in() { docker-compose exec -T $@; }

# Up all dinds nodes
docker-compose up -d manager1 manager2 worker1 worker2

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

# Run portainer + cypress
# Use export CI=1 to run in CI mode
if [ -z "${CI}" ];
then
  docker-compose up --exit-code-from cypress
else
  docker-compose -f docker-compose.yml -f docker-compose.ci.yml up --exit-code-from cypress
fi
