#!/usr/bin/env bash
docker run --rm -d --name delivery-runer -p 8080:8080 \
    -v $PWD/active:/usr/share/nginx/html:ro \
    -v $PWD/error.log:/usr/share/nginx/nginx_error.log \
    -v $PWD/runer.nginx.conf:/etc/nginx/nginx.conf:ro -d nginx

