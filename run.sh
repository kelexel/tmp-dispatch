#!/bin/sh
touch ./var/logs/debug.log
touch ./var/logs/exceptions.log
if [ ! -z $1 ] && [ $1 == '-cluster' ]; then
	sleep 3
	env NODE_ENV=dev node cluster.js
else
        env NODE_ENV=dev node worker.js
fi
