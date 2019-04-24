#!/bin/sh
export $(cat .env | xargs)
export $(cat dev-env | xargs)

node ./dist/app.js