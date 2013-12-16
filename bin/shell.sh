#!/bin/sh
run(){
	echo "Running shell in $1 mode";
	env NODE_ENV=$1 node ../lib/cli.js
}


if [ ! -z $1 ]; then env=$1; else env='dev'; fi
run $env
