#!/bin/bash
set -o errexit

# IP or URL of the server you want to deploy to
APP_HOST=$1

# Uncomment this if your host is an EC2 instance
# EC2_PEM_FILE=path/to/your/file.pem

# You usually don't need to change anything below this line

APP_NAME=html5client
ROOT_URL=https://$APP_HOST
PORT=3000
APP_DIR=/var/www/$APP_NAME
MONGO_URL=mongodb://127.0.0.1:27017/$APP_NAME

echo Installing Bigbluebutton server
echo It will take a while
# Run as sudo
# wget -qO- https://ubuntu.bigbluebutton.org/bbb-install.sh | bash -s -- -v xenial-200 -s $APP_HOST -e pdbaotrung@gmail.com -t -g -c turn.blindsidenetworks.com:fkBnCMI6Uje/oogoi1EwiZpPq5s=
exit

echo Exiting root enviroment

# Update kurento server url
sed -i "s|\"wsUrl.*|\"wsUrl\": \"wss://$APP_HOST/bbb-webrtc-sfu\"|g" /private/config/settings-production.json
sed -i "s|\"wsUrl.*|\"wsUrl\": \"wss://$APP_HOST/bbb-webrtc-sfu\"|g" /private/config/settings-development.json
sed -i "s/defaultWelcomeMessageFooter.*/defaultWelcomeMessageFooter=Copyright © 2018 Coursedy./g" /var/lib/tomcat7/webapps/bigbluebutton/WEB-INF/classes/bigbluebutton.properties
sed -i "s/defaultWelcomeMessage.*/defaultWelcomeMessage=<br>Welcome to \"%%CONFNAME%%\". For help on using Coursedy Classroom see these (short) tutorial videos.<br><br>To join the audio bridge click the phone button. Use a headset to avoid causing background noise for others.<br>/g" /var/lib/tomcat7/webapps/bigbluebutton/WEB-INF/classes/bigbluebutton.properties
wget -qO- https://res.cloudinary.com/coursedy/image/upload/v1550895438/favicon.png > /var/www/bigbluebutton-default/favicon.ico
sudo bbb-conf --clean
sudo bbb-conf --restart
# Stop bbb-html5 service
sudo service bbb-html5 stop

echo Preparing the server...
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
# Install node 8
sudo apt-get install -y nodejs && sudo apt-get update && sudo apt-get -y install jq
# Install meteor
curl https://install.meteor.com/ | sh
# Install forever
npm install -g forever

echo Building...
# install dependencies
meteor npm install
# building 
meteor build --directory ~/app --architecture os.linux.x86_64
cd ~/app/bundle
pushd /programs/server
npm install
popd

echo Deploying...
export PORT=$PORT
export MONGO_URL=$MONGO_URL
export ROOT_URL=$ROOT_URL
export METEOR_SETTINGS_MODIFIER=.
export METEOR_SETTINGS=` jq "${METEOR_SETTINGS_MODIFIER}" ~/app/bundle/programs/server/assets/app/config/settings-production.json `

# stop node server
forever stop main.js
forever start bundle/main.js
# Finish deploy
echo Your app is deployed and serving on: $ROOT_URL
