## DockerUI

![Containers](/containers.png)
DockerUI is a web interface to interact with the Remote API.  The goal is to provide a pure client side implementation so it is effortless to connect and manage docker.  This project is not complete and is still under heavy development.

![Container](/container.png)


### Goals
* Little to no dependencies - I really want to keep this project a pure html/js app.  I know this will have to change so that I can introduce authentication and authorization along with managing multiple docker endpoints. 
* Consistency - The web UI should be consistent with the commands found on the docker CLI.

### Container Quickstart 

* Run `docker build -t crosbymichael/dockerui github.com/crosbymichael/dockerui`
* `docker run -d -p 9000:9000 -v /var/run/docker.sock:/docker.sock crosbymichael/dockerui -e /docker.sock`
* Open your browser to `http://<dockerd host ip>:9000`


Bind mounting the unix socket into the dockerui container is much more secure than exposing your docker 
daemon over tcp.  You should still secure your dockerui instance behind some type of auth.  Maybe running 
nginx infront of dockerui with basic auth.

### Connect via a unix socket
If you want to connect to docker via the unix socket you can pass the socket path to the `-e` variable.  If you are running dockerui in a container you can bind mount the unix socket into the container.

```bash
docker run -d -p 9000:9000 -v /var/run/docker.sock:/docker.sock crosbymichael/dockerui -e /docker.sock
```

### Stack
* Angular.js
* Flatstrap ( Flat Twitter Bootstrap )
* Spin.js
* Ace editor


### Todo:
* Full repository support
* Search
* Push files to a container
* Unit tests


### License - MIT
The DockerUI code is licensed under the MIT license. Flatstrap(bootstrap) is licensed under the Apache License v2.0 and Angular.js is licensed under MIT.


**DockerUI:**
Copyright (c) 2013 Michael Crosby. crosbymichael.com

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
