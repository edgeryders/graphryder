FROM nginx:latest

ADD ./entrypoint.sh /entrypoint.sh
RUN ["chmod", "+x", "/entrypoint.sh"]

# Installing node & npm
RUN apt-get update && apt-get -y install npm curl
RUN npm install -g n
RUN n 14
RUN npm i npm@latest -g

EXPOSE 80
WORKDIR /frontend
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
