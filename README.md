##DockerUI

![Containers](/containers.png)
DockerUI is a web interface to interact with the Remote API.  The goal is to provide a pure client side implementation so it is effortless to connect to docker.  This project is not complete and is under heavy development.

![Container](/container.png)

###Installation
Open js/app.js and change the DOCKER_ENDPOINT constant to your docker ip and port.  Then host the site like any other html/js application.


    .constant('DOCKER_ENDPOINT', 'http://192.168.1.9:4243\:4243');


###Stack
* Angular.js
* Flatstrap ( Flat Twitter Bootstrap )


###License - MIT
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
