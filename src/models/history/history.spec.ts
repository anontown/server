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
                id: ObjectIDGenerator.get(),
                body: {
                    topic: ObjectIDGenerator.get(),
                    title: "title",
                    tags: ["a", "b"],
                    body: "body",
                    date: new Date().toISOString(),
                    hash: "hogehogehogeaaa",
                    user: ObjectIDGenerator.get(),
                },
            };

            const h = History.fromDB(db);

            expect(db.id).toBe(h.id);
            expect(db.body.topic).toBe(h.topic);
            expect(db.body.title).toBe(h.title);
            expect(db.body.tags).toEqual(h.tags);
            expect(db.body.body).toBe(h.body);
            expect(new Date(db.body.date).getTime()).toBe(h.date.getTime());
            expect(db.body.hash).toBe(h.hash);
            expect(db.body.user).toBe(h.user);
        });
    });

    describe("create", () => {
        it("正常に作れるか", () => {
            const t = TopicNormal.fromDB({
                id: ObjectIDGenerator.get(),
                type: "normal",
                body: {
                    title: "title",
                    tags: ["a"],
                    body: "body",
                    update: new Date().toISOString(),
                    date: new Date().toISOString(),
                    ageUpdate: new Date().toISOString(),
                    active: true,
                },
            }, 10);

            const u = User.fromDB({
                _id: new ObjectID(),
                sn: "sn",
                pass: "pass",
                lv: 1,
                resWait: {
                    last: new Date(),
                    m10: 0,
                    m30: 0,
                    h1: 0,
                    h6: 0,
                    h12: 0,
                    d1: 0,
                },
                lastTopic: new Date(),
                date: new Date(),
                point: 0,
                lastOneTopic: new Date(),
            });

            const date = new Date();
            const hash = "hash";
            const h = History.create(ObjectIDGenerator, t, date, hash, u);

            expect(h.topic).toBe(t.id);
            expect(h.title).toBe(t.title);
            expect(h.tags).toEqual(t.tags);
            expect(h.body).toBe(t.body);
            expect(h.date.getTime()).toBe(date.getTime());
            expect(h.hash).toBe(hash);
            expect(h.user).toBe(u.id);
        });
    });

    {
        const h = History.fromDB({
            id: ObjectIDGenerator.get(),
            body: {
                topic: ObjectIDGenerator.get(),
                title: "title",
                tags: ["a", "b"],
                body: "body",
                date: new Date().toISOString(),
                hash: "hogehogehogeaaa",
                user: ObjectIDGenerator.get(),
            },
        });
        describe("#toDB", () => {
            it("正常に変換できるか", () => {
                const db = h.toDB();

                expect(db.id).toBe(h.id);
                expect(db.body.topic).toBe(h.topic);
                expect(db.body.title).toBe(h.title);
                expect(db.body.tags).toEqual(h.tags);
                expect(db.body.body).toBe(h.body);
                expect(new Date(db.body.date).getTime()).toBe(h.date.getTime());
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
                expect(api.tags).toEqual(h.tags);
                expect(api.body).toBe(h.body);
                expect(api.date).toBe(h.date.toISOString());
                expect(api.hash).toBe(h.hash);
            });
        });
    }
});
