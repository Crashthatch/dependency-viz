#!/usr/bin/env bash

# Shortcut for easy deployment by Tom. If you're not Tom, you probably shouldn't run this script.

aws ecr get-login --region us-east-1 | bash
aws ecr get-login --region us-east-1 | sed s/docker/hyper/ | bash

docker build -t depviz .
docker tag depviz:latest 016279857314.dkr.ecr.us-east-1.amazonaws.com/depviz:latest
docker push 016279857314.dkr.ecr.us-east-1.amazonaws.com/depviz:latest

hyper pull 016279857314.dkr.ecr.us-east-1.amazonaws.com/depviz:latest
hyper stop depviz
hyper rm depviz
hyper run --size s1 -d --name depviz --env-file .env --env PORT=80 --env VIRTUAL_HOST=dependencyviz.crashthatch.com -p 80:80 016279857314.dkr.ecr.us-east-1.amazonaws.com/depviz:latest

# Restarts the load balancer in front of all my websites:
../hyper-load-balancer-lb.sh
