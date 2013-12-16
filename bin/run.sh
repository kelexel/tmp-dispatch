#!/bin/sh
touch ../var/logs/debug.log
touch ../var/logs/exceptions.log

run(){
	echo "Running $2 in $1 mode";
	env NODE_ENV=$1 node $2
}


if [ ! -z $2 ]; then env=$2; else env='utopia'; fi

if [ ! -z $1 ] && [ $1 == '-cluster' ]; then
	run $env ../lib/cluster.js
else if [ ! -z $1 ] && [ $1 == '-shell' ]; then
	run $env ../lib/cli.js
else
	run $env ../lib/worker.js
fi
fi
