#!/bin/sh
export $(cat .env | xargs)
export SERVER_PORT=8080
export DB_URL=mongodb://mongo:27017/anontown
export ES_HOST=es:9200

cd ./data/app/

node ../../dist/app.js