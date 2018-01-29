import { ObjectOmit } from "typelevel-ts";

export type ID = { id: string };

export type IDEntity<T extends object, E extends keyof T> = Pick<T, E> & ObjectOmit<ToID<T>, E>;
type ToID<T extends object> = {
  [P in keyof T]: ID;
}


/*
//example

type User = { id: string, sn: string, pass: string };
type Topic = { id: string, subject: string };

type ResEntity = {
  user: User,
  topic: Topic
};

type Res<E extends keyof ResEntity> = IDEntity<ResEntity, E>;

function f1(res: Res<never>) {
  res.topic//ID
  res.user//ID
}

function f2(res: Res<"topic">) {
  res.topic//Topic
  res.user//ID

  f1(res);
}

function f3(res: Res<"topic" | "user">) {
  res.topic//Topic
  res.user//User

  f1(res);
  f2(res);
}

 */