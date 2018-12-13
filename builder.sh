#!/bin/bash
branch=$1
truncated=$( echo $branch | tr -d \# )
sudo rm -rf active/branch-$truncated
git clone -b $branch --single-branch https://github.com/bitshares/bitshares-community-ui.git active/branch-$truncated
cd active/branch-$truncated
sed -i 's/git@github.com:/https:\/\/github.com\//' .gitmodules
git submodule init
git submodule sync
git submodule update && docker build -t delivery-builder . && mkdir dist && docker run --rm -v $PWD/dist:/usr/src/app/dist delivery-builder
