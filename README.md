##DockerUI

![Containers](/containers.png)
DockerUI is a web interface to interact with the Remote API.  The goal is to provide a pure client side implementation so it is effortless to connect and manage docker.  This project is not complete and is still under heavy development.

![Container](/container.png)


###Goals
* Little to no dependencies - I really want to keep this project a pure html/js app.  I know this will have to change so that I can introduce authentication and authorization along with managing multiple docker endpoints. 
* Consistency - The web UI should be consistent with the commands found on the docker CLI.

###DockerUI Container 
[Container](https://index.docker.io/u/crosbymichael/dockerui/)


    docker pull crosbymichael/dockerui

This is the easiest way to run DockerUI.  To run the container make sure you have dockerd running with the -H option so that the remote api can be accessed via ip and not bound to localhost.  After you pull the container you need to run it with your dockerd ip as an argument to the dockerui command.


    docker run -d crosbymichael/dockerui -e="http://192.168.1.9:4243"

This tells dockerui to use http://192.168.1.9:4243 to communicate to dockerd's Remote API.

###Setup
1. Make sure that you are running dockerd ( docker -d ) with the -H and [-api-enable-cors](http://docs.docker.io/en/latest/api/docker_remote_api_v1.2/#cors-requests) so that the UI can make requests to the Remote API.


    docker -d -H="192.168.1.9:4243" -api-enable-cors


2. Open js/app.js.  This is where you need to configure DockerUI so that it knows what ip and port your dockerd Remote API is listening on.  There are two constants in the file that you will need to set, dockerd endpoint and dockerd port.  If you have the Remote API running on port 80 then there is no need to set the port, just leave it as an empty string.  The docker_endpoint needs to be set to the url that the Remote API can be accessed on.  Please include the scheme as part of the url.


    .constant('DOCKER_ENDPOINT', 'http://192.168.1.9')
    .constant('DOCKER_PORT', ':4243') 


3. Make sure you run git submodule update --init to pull down any dependencies ( ace editor ).
4. Use nginx or your favorite server to serve the DockerUI files.  There are not backend dependencies, DockerUI is a pure HTML JS app and can be hosted via any static file server.
5. Everything should be good to go, if you experience any issues please report them on this repository.


###Stack
* Angular.js
* Flatstrap ( Flat Twitter Bootstrap )
* Spin.js
* Ace editor


###Todo:
* Multiple endpoints
* Full repository support
* Search
* Push files to a container
* Unit tests
* Authentication and Authorization


###License - MIT
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
