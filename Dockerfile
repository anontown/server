FROM node:8.1.2

ENV HOME=/home/app
ENV APP_HOME=$HOME/.anontown

WORKDIR $APP_HOME

COPY package.json package-lock.json $APP_HOME/
RUN npm i --no-progress
COPY scripts/ $APP_HOME/scripts/
COPY tests/ $APP_HOME/tests/
COPY tsconfig.json $APP_HOME/

ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh $APP_HOME/wait-for-it.sh
RUN chmod +x ./wait-for-it.sh

CMD ./wait-for-it.sh -t 0 $ES_HOST -- npm start