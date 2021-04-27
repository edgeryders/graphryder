FROM debian:buster-slim

ADD ./entrypoint.sh /entrypoint.sh

RUN ["chmod", "+x", "/entrypoint.sh"]
RUN apt-get update && apt-get -y install npm curl
RUN npm install -g n
RUN n 14
RUN npm i npm@latest -g

EXPOSE 3000
WORKDIR /backend
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
