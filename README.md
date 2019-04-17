BigBlueButton For Coursedy
=============
- Create a VM instance in gce
- SSH to bbb instance
- git clone https://github.com/PhamDuyBaoTrung/bigbluebutton.git
- git checkout coursedy-v1.0.x
- chmod +x build_and_deploy_bbb.sh
- waiting for 20min
- if html5 build fails -> check mongod service -> run sudo service mongod status -> check config path must be pointed to /etc/mongod.conf
- run command `mongo` if it fails to connect then we need to reinstall mongod. Follow https://hevodata.com/blog/install-mongodb-on-ubuntu/
- Otherwise, everything good to go
