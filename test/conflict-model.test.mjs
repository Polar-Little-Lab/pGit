import test from 'node:test';import assert from 'node:assert/strict';import '../public/conflict-model.js';
const block='<<<<<<< HEAD\nleft\n=======\nright\n>>>>>>> topic\n';
test('conflict selections preserve context, multiple blocks and output order',()=>{
 const text='before\n'+block+'between\n'+block+'after';assert.equal(PgitConflict.parse(text).length,2);
 const one=PgitConflict.resolve(text,1,'theirs');assert.equal(one,'before\n'+block+'between\nright\nafter');
 assert.equal(PgitConflict.resolve(one,0,'both'),'before\nleft\nright\nbetween\nright\nafter');
});
test('diff3, CRLF, custom markers and empty sides remain exact',()=>{
 const text='<<<<<<<<<< HEAD\r\n|||||||||| base\r\nancestor\r\n==========\r\nright\r\n>>>>>>>>>> topic\r\nend';const b=PgitConflict.parse(text)[0];assert.equal(b.base,'ancestor\r\n');assert.equal(b.ours,'');assert.equal(PgitConflict.resolve(text,0,'ours'),'end');assert.equal(PgitConflict.resolve(text,0,'theirs'),'right\r\nend');
});
test('malformed and stale block selections never silently rewrite content',()=>{
 for(const text of ['<<<<<<< HEAD\nleft','=======\n','<<<<<<< HEAD\n<<<<<<< other\n','<<<<<<< HEAD\n=======\n========\n>>>>>>> topic\n'])assert.throws(()=>PgitConflict.parse(text));
 assert.throws(()=>PgitConflict.resolve(block,1,'ours'));assert.throws(()=>PgitConflict.resolve(block,0,'invalid'));assert.deepEqual(PgitConflict.parse('plain\n'),[]);
});
