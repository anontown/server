import * as Im from "immutable";
import { ObjectID } from "mongodb";
import {
    History,
    IHistoryDB,
    ObjectIDGenerator,
    TopicNormal,
    User,
} from "../../";

describe("History", () => {
    describe("fromDB", () => {
        it("正常に作れるか", () => {
            const db: IHistoryDB = {
                id: ObjectIDGenerator(),
                body: {
                    topic: ObjectIDGenerator(),
                    title: "title",
                    tags: ["a", "b"],
                    body: "body",
                    date: new Date(0).toISOString(),
                    hash: "hogehogehogeaaa",
                    user: ObjectIDGenerator(),
                },
            };

            const h = History.fromDB(db);

            expect(h.id).toBe(db.id);
            expect(h.topic).toBe(db.body.topic);
            expect(h.title).toBe(db.body.title);
            expect(h.tags).toEqual(Im.List(db.body.tags));
            expect(h.body).toBe(db.body.body);
            expect(h.date).toEqual(new Date(db.body.date));
            expect(h.hash).toBe(db.body.hash);
            expect(h.user).toBe(db.body.user);
        });
    });

    describe("create", () => {
        it("正常に作れるか", () => {
            const t = TopicNormal.fromDB({
                id: ObjectIDGenerator(),
                type: "normal",
                body: {
                    title: "title",
                    tags: ["a"],
                    body: "body",
                    update: new Date(100).toISOString(),
                    date: new Date(0).toISOString(),
                    ageUpdate: new Date(50).toISOString(),
                    active: true,
                },
            }, 10);

            const u = User.fromDB({
                _id: new ObjectID(),
                sn: "sn",
                pass: "pass",
                lv: 1,
                resWait: {
                    last: new Date(200),
                    m10: 0,
                    m30: 0,
                    h1: 0,
                    h6: 0,
                    h12: 0,
                    d1: 0,
                },
                lastTopic: new Date(80),
                date: new Date(20),
                point: 0,
                lastOneTopic: new Date(90),
            });

            const date = new Date(300);
            const hash = "hash";
            const h = History.create(ObjectIDGenerator, t, date, hash, u);

            expect(h.topic).toBe(t.id);
            expect(h.title).toBe(t.title);
            expect(h.tags).toEqual(Im.List(t.tags));
            expect(h.body).toBe(t.body);
            expect(h.date).toEqual(date);
            expect(h.hash).toBe(hash);
            expect(h.user).toBe(u.id);
        });
    });

    {
        const h = History.fromDB({
            id: ObjectIDGenerator(),
            body: {
                topic: ObjectIDGenerator(),
                title: "title",
                tags: ["a", "b"],
                body: "body",
                date: new Date(0).toISOString(),
                hash: "hogehogehogeaaa",
                user: ObjectIDGenerator(),
            },
        });
        describe("#toDB", () => {
            it("正常に変換できるか", () => {
                const db = h.toDB();

                expect(db.id).toBe(h.id);
                expect(db.body.topic).toBe(h.topic);
                expect(db.body.title).toBe(h.title);
                expect(db.body.tags).toEqual(h.tags.toArray());
                expect(db.body.body).toBe(h.body);
                expect(db.body.date).toBe(h.date.toISOString());
                expect(db.body.hash).toBe(h.hash);
                expect(db.body.user).toBe(h.user);
            });
        });

        describe("#toAPI", () => {
            it("正常に変換できるか", () => {
                const api = h.toAPI();
                expect(api.id).toBe(h.id.toString());
                expect(api.topic).toBe(h.topic.toString());
                expect(api.title).toBe(h.title);
                expect(api.tags).toEqual(h.tags.toArray());
                expect(api.body).toBe(h.body);
                expect(api.date).toBe(h.date.toISOString());
                expect(api.hash).toBe(h.hash);
            });
        });
    }
});
