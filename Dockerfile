FROM node:8.1.2

ENV HOME=/home/app
ENV APP_HOME=$HOME/.anontown

COPY scripts/ $APP_HOME/scripts/
COPY tests/ $APP_HOME/tests/
COPY package.json package-lock.json tsconfig.json $APP_HOME/

WORKDIR $APP_HOME

RUN npm i

CMD npm start