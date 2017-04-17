FROM mhart/alpine-node:base-6

COPY . /depviz
WORKDIR /depviz

EXPOSE 80

CMD [ "/usr/bin/node", "/depviz/server/server.js" ]