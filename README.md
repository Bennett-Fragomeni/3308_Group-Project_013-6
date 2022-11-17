# Group_Project_3308

1. Application Description
  - Database of Recipes with Ingredients and how much it costs
  - Select a recipe and say how many meals you want out of it
  - Calculates the cost of the recipe
  - Spit out a grocery list (email possibly?)
  
2. Contributors
  - Maxwell Prue, Maxwell-Prue, mapr4688@colorado.edu
  - Aieshah Safi, aisa9142, aisa9142@colorado.edu
  - Nathan Keyt, nathankeyt, nake8894@colorado.edu
  - Bennett Fragomeni, Bennett-Fragomeni, Bennett.Fragomeni@colorado.edu
  - Nicholas Hellmers, Nicholas-Hellmers, nihe1661@colorado.edu
  
3. Stack
  - HTML
  - CSS
  - PostgreSQL
  - Node.js
  - EJS

4. Prerequisites
- npm
- Docker
- (Optional) Cloud Service

5. Instructions

The following are instructions to run this application independently.

On local machine
- Navigate to ./src
- Install and open Docker daemon
- Ensure port 3000:3000 is exposed on docker-compose.yaml
- Run "docker-compose up" on terminal

On csci3308.int.colorado.edu
- SSH into csci3308.int.colorado.edu using "ssh <identikey>@csci3308.int.colorado.edu" in terminal
- Install copy of rootless docker using "dockerd-rootless-setuptool.sh install" in terminal
- Clone local repository using "cd" in terminal
- Ensure permissions are allowed using "chmod 777 ." and "chmod 766 package-lock.json"
- Run "docker-compose up -d" in root
- Run "docker-compose ps" to find the exposed port. This will provide the port used to navigate to the public website given by http://csci3308.int.colorado.edu:<port>
- Here you can access the hosted application.

6. How to run tests

7. Link to application
