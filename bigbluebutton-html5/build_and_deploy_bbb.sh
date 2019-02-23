#!/bin/bash
set -o errexit

# IP or URL of the server you want to deploy to
APP_HOST=$1

# Uncomment this if your host is an EC2 instance
# EC2_PEM_FILE=path/to/your/file.pem

# You usually don't need to change anything below this line

APP_NAME=html5client
ROOT_URL=https://$APP_HOST/$APP_NAME
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/$APP_NAME

cd ~/app/bundle

echo Deploying...
echo MONGO_URL: ${MONGO_URL} - ROOT_URL: ${ROOT_URL}
export PORT=$PORT
export MONGO_URL=$MONGO_URL
export ROOT_URL=$ROOT_URL
export METEOR_SETTINGS_MODIFIER=.
export METEOR_SETTINGS=` jq "${METEOR_SETTINGS_MODIFIER}" ~/app/bundle/programs/server/assets/app/config/settings-production.json `

# stop node server
forever start main.js
# Finish deploy
echo Your app is deployed and serving on: $ROOT_URL
