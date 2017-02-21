import {assert} from 'chai';
import {Hoge} from '../scripts/hoge';

describe("Hoge", () => {
    it("name", () => {
        let hoge = new Hoge("test");
        assert.equal(hoge.name, "test");
    });
});