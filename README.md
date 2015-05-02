## DockerUI

![Containers](/containers.png)
DockerUI is a web interface for the Docker Remote API.  The goal is to provide a pure client side implementation so it is effortless to connect and manage docker.  This project is not complete and is still under heavy development.

![Container](/container.png)


### Goals
* Minimal dependencies - I really want to keep this project a pure html/js app.
* Consistency - The web UI should be consistent with the commands found on the docker CLI.

### Container Quickstart 
1. Run: `docker run -d -p 9000:9000 --privileged -v /var/run/docker.sock:/var/run/docker.sock dockerui/dockerui`

2. Open your browser to `http://<dockerd host ip>:9000`


Bind mounting the Unix socket into the DockerUI container is much more secure than exposing your docker daemon over TCP. The `--privileged` flag is required for hosts using SELinux. You should still secure your DockerUI instance behind some type of auth. Directions for using Nginx auth are [here](https://github.com/crosbymichael/dockerui/wiki/Dockerui-with-Nginx-HTTP-Auth).

### Specify socket to connect to Docker daemon

By default DockerUI connects to the Docker daemon with`/var/run/docker.sock`. For this to work you need to bind mount the unix socket into the container with `-v /var/run/docker.sock:/var/run/docker.sock`.

You can use the `-e` flag to change this socket:

    # Connect to a tcp socket:
    $ docker run -d -p 9000:9000 --privileged dockerui/dockerui -e http://127.0.0.1:2375

### Change address/port DockerUI is served on
DockerUI listens on port 9000 by default. If you run DockerUI inside a container then you can bind the container's internal port to any external address and port:

    # Expose DockerUI on 10.20.30.1:80
    $ docker run -d -p 10.20.30.1:80:9000 --privileged -v /var/run/docker.sock:/var/run/docker.sock dockerui/dockerui

### Check the [wiki](//github.com/crosbymichael/dockerui/wiki) for more info about using dockerui

### Stack
* [Angular.js](https://github.com/angular/angular.js)
* [Bootstrap](http://getbootstrap.com/)
* [Gritter](https://github.com/jboesch/Gritter)
* [Spin.js](https://github.com/fgnass/spin.js/)
* [Golang](https://golang.org/)
* [Vis.js](http://visjs.org/)


### Todo:
* Full repository support
* Search
* Push files to a container
* Unit tests


### License - MIT
The DockerUI code is licensed under the MIT license.


**DockerUI:**
Copyright (c) 2014 Michael Crosby. crosbymichael.com

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation 
files (the "Software"), to deal in the Software without 
restriction, including without limitation the rights to use, copy, 
modify, merge, publish, distribute, sublicense, and/or sell copies 
of the Software, and to permit persons to whom the Software is 
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, 
TORT OR OTHERWISE, 
ARISING FROM, OUT OF OR IN CONNECTION WITH 
THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
