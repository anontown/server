FROM node:8.1.2

ENV HOME=/home/app
ENV APP_HOME=$HOME/.anontown

WORKDIR $APP_HOME

COPY package.json package-lock.json $APP_HOME/
RUN npm i --no-progress
COPY scripts/ $APP_HOME/scripts/
COPY tests/ $APP_HOME/tests/
COPY tsconfig.json $APP_HOME/

CMD npm start