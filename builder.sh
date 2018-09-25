#!/usr/bin/env bash
rm -rf active/$1
git clone --recursive -b $1 --single-branch git@github.com:youaresofunny/bitshares-community-ui.git active/$1
cd active/$1 && docker build -t delivery-$1 . && mkdir dist && docker run --rm -v $PWD/dist:/usr/src/app/dist delivery-$1
