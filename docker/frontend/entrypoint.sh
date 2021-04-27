#!/bin/bash
cd /frontend

if [ "$MODE" = "dev" ]; then
  echo "/!\\ Mode is set to DEV /!\\"
else
  echo "/!\\ Mode is set to PRODUCTION /!\\"
fi
echo "(i) Npm version is $(npm -v)"
echo "(i) Node version is $(node -v)"

echo
echo " ~"
echo " ~ Install dependencies"
echo " ~"
echo
npm install

if [ "$MODE" = "dev" ]; then
  echo
  echo " ~"
  echo " ~ Start the web server"
  echo " ~"
  echo
  nginx -c /etc/nginx/nginx.conf

  echo
  echo " ~"
  echo " ~ Start react application"
  echo " ~"
  echo
  npm run start
else
  echo
  echo " ~"
  echo " ~ Building the application"
  echo " ~"
  echo
  npm run build

  echo
  echo " ~"
  echo " ~ Run the production server"
  echo " ~"
  echo
  nginx -g 'daemon off;'
fi
