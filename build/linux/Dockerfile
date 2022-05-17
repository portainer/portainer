FROM portainer/base

LABEL org.opencontainers.image.title="Portainer" \
  org.opencontainers.image.description="Docker container management made simple, with the world’s most popular GUI-based container management platform." \
  org.opencontainers.image.vendor="Portainer.io" \
  com.docker.desktop.extension.api.version=">= 0.2.2" \
  com.docker.desktop.extension.icon="https://portainer-io-assets.sfo2.cdn.digitaloceanspaces.com/logos/portainer.png" \
  com.docker.extension.screenshots="[{\"alt\": \"screenshot one\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-1.png\"},{\"alt\": \"screenshot two\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-2.png\"},{\"alt\": \"screenshot three\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-3.png\"},{\"alt\": \"screenshot four\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-4.png\"},{\"alt\": \"screenshot five\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-5.png\"},{\"alt\": \"screenshot six\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-6.png\"},{\"alt\": \"screenshot seven\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-7.png\"},{\"alt\": \"screenshot eight\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-8.png\"},{\"alt\": \"screenshot nine\", \"url\": \"https://portainer-io-assets.sfo2.digitaloceanspaces.com/screenshots/docker-extension-9.png\"}]" \
  com.docker.extension.detailed-description="<p data-renderer-start-pos=\"226\">Portainer&rsquo;s Docker Desktop extension gives you access to all of Portainer&rsquo;s rich management functionality within your docker desktop experience.</p><h2 data-renderer-start-pos=\"374\">With Portainer you can:</h2><ul><li>See all your running containers</li><li>Easily view all of your container logs</li><li>Console into containers</li><li>Easily deploy your code into containers using a simple form</li><li>Turn your YAML into custom templates for easy reuse</li></ul><h2 data-renderer-start-pos=\"660\">About Portainer&nbsp;</h2><p data-renderer-start-pos=\"680\">Portainer is the worlds&rsquo; most popular universal container management platform with more than 650,000 active monthly users. Portainer can be used to manage Docker Standalone, Kubernetes, Docker Swarm and Nomad environments through a single common interface. It includes a simple GitOps automation engine and a Kube API.&nbsp;</p><p data-renderer-start-pos=\"1006\">Portainer Business Edition is our fully supported commercial grade product for business-wide use. It includes all the functionality that businesses need to manage containers at scale. Visit <a class=\"sc-jKJlTe dPfAtb\" href=\"http://portainer.io/\" title=\"http://Portainer.io\" data-renderer-mark=\"true\">Portainer.io</a> to learn more about Portainer Business and <a class=\"sc-jKJlTe dPfAtb\" href=\"http://portainer.io/take5?utm_campaign=DockerCon&amp;utm_source=Docker%20Desktop\" title=\"http://portainer.io/take5?utm_campaign=DockerCon&amp;utm_source=Docker%20Desktop\" data-renderer-mark=\"true\">get 5 free nodes.</a></p>" \
  com.docker.extension.publisher-url="https://www.portainer.io" \
  com.docker.extension.additional-urls="[{\"title\":\"Website\",\"url\":\"https://www.portainer.io?utm_campaign=DockerCon&utm_source=DockerDesktop\"},{\"title\":\"Documentation\",\"url\":\"https://docs.portainer.io\"},{\"title\":\"Support\",\"url\":\"https://join.slack.com/t/portainer/shared_invite/zt-txh3ljab-52QHTyjCqbe5RibC2lcjKA\"}]"

COPY dist /
COPY build/docker-extension /

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

ENTRYPOINT ["/portainer"]
