FROM mhart/alpine-node:6

COPY package.json /depviz/
WORKDIR /depviz
RUN npm install

COPY server /depviz/server
COPY site /depviz/site
COPY rollup-prod.config.js /depviz/
COPY .babelrc /depviz/
RUN npm run build-prod

EXPOSE 80

CMD [ "/usr/bin/node", "/depviz/server/server.js" ]