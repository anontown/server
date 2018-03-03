# Anontown Server

[![Join the chat at https://gitter.im/anontown/server](https://badges.gitter.im/anontown/server.svg)](https://gitter.im/anontown/server?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/anontown/server.svg?branch=master)](https://travis-ci.org/anontown/server)

Anontownのサーバープログラムです。  
Dockerを使って動かすことが出来ます。

## 使い方

```
$ git clone https://github.com/anontown/server.git
$ cp es/.env.sample es/.env
$ cp .env.sample .env
$ vi .env #詳細は下記
$ docker-compose up -d
```

## .envの編集

DB_USERとDB_PASSは消して大丈夫です(セキュリティが心配な場合はmongodbコンテナに入りユーザーを作成して設定して下さい)  
SALT_PASS、SALT_HASH、SALT_TOKEN、SALT_TOKEN_REQを設定します。これはどのような文字列でも構いませんが、推測されないように出来るだけ長くし、記号や数字、アルファベット等を組み合わせて下さい。特にSALT_HASHはとても重要です。これが漏れると匿名掲示板ではなくなってしまいます。  
RECAPTCHA_SITE_KET、RECAPTCHA_SECRET_KETはGoogleのサイトでキーを取得し設定しましょう。  

## 公式サーバー

https://anontown.com/  
実際にこのプログラムが動いているAPIのエンドポイントは↓です。   
https://api.anontown.com/

## 寄付

サーバーの運営費などの為に寄付して下さると助かります。

|種類|アドレス|
|:--|:--|
|bitcoin|1BzX1EtapU8kFubJnBwxbR1t3icpVneMZo|
|monacoin|MSp6GRJNfrkewkqezL3NuTUuYysuZ1eZ3u|
