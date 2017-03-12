import {
    History,
    ObjectIDGenerator,
    Topic,
    User
} from '../../../scripts';
import * as assert from 'power-assert';
import { ObjectID } from 'mongodb';

describe("History", () => {
    describe("fromDB", () => {
        it('正常に作れるか', () => {
            let db = {
                _id: new ObjectID(),
                topic: new ObjectID(),
                title: 'title',
                tags: ['a', 'b'],
                text: 'text',
                mdtext: '<p>text</p>',
                date: new Date(),
                hash: 'hogehogehogeaaa',
                user: new ObjectID()
            };

            let h = History.fromDB(db);

            assert(db._id.equals(h.id));
            assert(db.topic.equals(h.topic));
            assert(db.title === h.title);
            assert.deepEqual(db.tags, h.tags);
            assert(db.text === h.text);
            assert(db.mdtext === h.mdtext);
            assert(db.date.getTime() === h.date.getTime());
            assert(db.hash === h.hash);
            assert(db.user.equals(h.user));
        });
    });

    describe("create", () => {
        it('正常に作れるか', () => {
            let t = Topic.fromDB({
                _id: new ObjectID(),
                title: 'title',
                tags: ['a'],
                text: 'text',
                mdtext: '<p>text</p>',
                update: new Date(),
                date: new Date(),
                type: 'normal',
                ageUpdate: new Date(),
                active: true
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

            assert(h.topic.equals(t.id));
            assert(h.title === t.title);
            assert.deepEqual(h.tags, t.tags);
            assert(h.text === t.text);
            assert(h.mdtext === t.mdtext);
            assert(h.date.getTime() === date.getTime());
            assert(h.hash === hash);
            assert(h.user.equals(u.id));
        });
    });

    {
        let h = History.fromDB({
            _id: new ObjectID(),
            topic: new ObjectID(),
            title: 'title',
            tags: ['a', 'b'],
            text: 'text',
            mdtext: '<p>text</p>',
            date: new Date(),
            hash: 'hogehogehogeaaa',
            user: new ObjectID()
        });
        describe("#toDB", () => {
            it('正常に変換できるか', () => {
                let db = h.toDB();

                assert(db._id.equals(h.id));
                assert(db.topic.equals(h.topic));
                assert(db.title === h.title);
                assert.deepEqual(db.tags, h.tags);
                assert(db.text === h.text);
                assert(db.mdtext === h.mdtext);
                assert(db.date.getTime() === h.date.getTime());
                assert(db.hash === h.hash);
                assert(db.user.equals(h.user));
            });
        });

        describe('#toAPI', () => {
            it('正常に変換できるか', () => {
                let api = h.toAPI();
                assert(api.id === h.id.toString());
                assert(api.topic === h.topic.toString());
                assert(api.title === h.title);
                assert.deepEqual(api.tags, h.tags);
                assert(api.text === h.text);
                assert(api.mdtext === h.mdtext);
                assert(api.date === h.date.toISOString());
                assert(api.hash === h.hash);
            });
        });
    }
});