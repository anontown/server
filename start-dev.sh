#!/bin/sh
export $(cat .env | xargs)
export SERVER_PORT=8080
export DB_URL=mongodb://localhost:27017/anontown
export ES_HOST=localhost:9200
export SAVE_DIR=./data/app/

node ./dist/app.js