FROM node:8.1.2

ENV HOME=/home/app
ENV APP_HOME=$HOME/.anontown

WORKDIR $APP_HOME

RUN npm i --no-progress

RUN npm run build

ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh $APP_HOME/wait-for-it.sh
RUN chmod +x ./wait-for-it.sh

EXPOSE 5858

CMD ./wait-for-it.sh -t 0 $ES_HOST -- npm run start:dev