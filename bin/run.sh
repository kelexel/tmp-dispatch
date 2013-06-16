#!/bin/sh
touch ../var/logs/debug.log
touch ../var/logs/exceptions.log
if [ ! -z $1 ] && [ $1 == '-cluster' ]; then
	env NODE_ENV=dev node ../lib/cluster.js
else if [ ! -z $1 ] && [ $1 == '-shell' ]; then
	env NODE_ENV=dev node ../lib/shell.js
else
        env NODE_ENV=dev node ../lib/worker.js
fi
fi
