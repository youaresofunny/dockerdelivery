#!/usr/bin/env bash
sudo rm -rf active/$1
git clone -b $1 --single-branch https://github.com/bitshares/bitshares-community-ui.git active/$1
cd active/$1
sed -i 's/git@github.com:/https:\/\/github.com\//' .gitmodules
git submodule init
git submodule sync
git submodule update && docker build -t delivery-$1 . && mkdir dist && docker run --rm -v $PWD/dist:/usr/src/app/dist delivery-$1
