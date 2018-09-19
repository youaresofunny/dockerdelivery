#!/usr/bin/env bash
rm -rf active/$1
git clone --recursive -b $1 --single-branch git@github.com:youaresofunny/CDtest.git active/$1
cd active/$1 && docker build -t delivery/$1 . && docker run --rm delivery/$1
