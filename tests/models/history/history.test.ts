import {
    History,
    ObjectIDGenerator,
    TopicNormal,
    User,
    IHistoryDB
} from '../../../scripts';
import * as assert from 'power-assert';
import { ObjectID } from 'mongodb';

describe("History", () => {
    describe("fromDB", () => {
        it('正常に作れるか', () => {
            let db: IHistoryDB = {
                id: ObjectIDGenerator.get(),
                body: {
                    topic: ObjectIDGenerator.get(),
                    title: 'title',
                    tags: ['a', 'b'],
                    body: 'body',
                    date: new Date().toISOString(),
                    hash: 'hogehogehogeaaa',
                    user: ObjectIDGenerator.get()
                }
            };

            let h = History.fromDB(db);

            assert(db.id === h.id);
            assert(db.body.topic === h.topic);
            assert(db.body.title === h.title);
            assert.deepEqual(db.body.tags, h.tags);
            assert(db.body.body === h.body);
            assert(new Date(db.body.date).getTime() === h.date.getTime());
            assert(db.body.hash === h.hash);
            assert(db.body.user === h.user);
        });
    });

    describe("create", () => {
        it('正常に作れるか', () => {
            let t = TopicNormal.fromDB({
                id: ObjectIDGenerator.get(),
                type: 'normal',
                body: {
                    title: 'title',
                    tags: ['a'],
                    body: 'body',
                    update: new Date().toISOString(),
                    date: new Date().toISOString(),
                    ageUpdate: new Date().toISOString(),
                    active: true
                }
            }, 10);

            let u = User.fromDB({
                _id: new ObjectID(),
                sn: 'sn',
                pass: 'pass',
                lv: 1,
                resWait: {
                    last: new Date(),
                    m10: 0,
                    m30: 0,
                    h1: 0,
                    h6: 0,
                    h12: 0,
                    d1: 0
                },
                lastTopic: new Date(),
                date: new Date(),
                point: 0,
                lastOneTopic: new Date()
            });

            let date = new Date();
            let hash = 'hash';
            let h = History.create(ObjectIDGenerator, t, date, hash, u);

            assert(h.topic == t.id);
            assert(h.title === t.title);
            assert.deepEqual(h.tags, t.tags);
            assert(h.body === t.body);
            assert(h.date.getTime() === date.getTime());
            assert(h.hash === hash);
            assert(h.user === u.id);
        });
    });

    {
        let h = History.fromDB({
            id: ObjectIDGenerator.get(),
            body: {
                topic: ObjectIDGenerator.get(),
                title: 'title',
                tags: ['a', 'b'],
                body: 'body',
                date: new Date().toISOString(),
                hash: 'hogehogehogeaaa',
                user: ObjectIDGenerator.get()
            }
        });
        describe("#toDB", () => {
            it('正常に変換できるか', () => {
                let db = h.toDB();

                assert(db.id === h.id);
                assert(db.body.topic === h.topic);
                assert(db.body.title === h.title);
                assert.deepEqual(db.body.tags, h.tags);
                assert(db.body.body === h.body);
                assert(new Date(db.body.date).getTime() === h.date.getTime());
                assert(db.body.hash === h.hash);
                assert(db.body.user === h.user);
            });
        });

        describe('#toAPI', () => {
            it('正常に変換できるか', () => {
                let api = h.toAPI();
                assert(api.id === h.id.toString());
                assert(api.topic === h.topic.toString());
                assert(api.title === h.title);
                assert.deepEqual(api.tags, h.tags);
                assert(api.body === h.body);
                assert(api.date === h.date.toISOString());
                assert(api.hash === h.hash);
            });
        });
    }
});