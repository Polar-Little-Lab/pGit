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
test('three-way result hides markers but stays unresolved until an explicit choice',()=>{
 const source='before\n'+block+'between\n'+block+'after';let s=PgitConflict.create(source);
 assert.equal(s.content,'before\nleft\nbetween\nleft\nafter');assert.equal(s.blocks.filter(b=>!b.resolved).length,2);
 s=PgitConflict.choose(s,0,'both');s=PgitConflict.choose(s,1,'theirs');assert.equal(s.content,'before\nleft\nright\nbetween\nright\nafter');assert.ok(s.blocks.every(b=>b.resolved));
 s=PgitConflict.edit(s,s.content.replace('between','manual context'));assert.ok(s.blocks.every(b=>b.resolved));s=PgitConflict.choose(s,1,'ours');assert.match(s.content,/manual context\nleft\nafter/);
 s=PgitConflict.edit(s,s.content.replace('left\nafter','edited\nafter'));assert.equal(s.blocks[1].resolved,false);
});
test('three-way result initializes diff3 from base and preserves CRLF and empty choices',()=>{
 let s=PgitConflict.create('start\r\n<<<<<<< HEAD\r\n||||||| base\r\nbase\r\n=======\r\nright\r\n>>>>>>> topic\r\nend');assert.equal(s.content,'start\r\nbase\r\nend');s=PgitConflict.choose(s,0,'ours');assert.equal(s.content,'start\r\nend');s=PgitConflict.choose(s,0,'theirs');assert.equal(s.content,'start\r\nright\r\nend');
});
test('manual edits spanning multiple conflicts cannot be overwritten by a single source choice',()=>{
 const s=PgitConflict.edit(PgitConflict.create(block+'context\n'+block),'manual replacement\n');assert.ok(s.blocks.every(b=>b.manualOnly&&!b.resolved));assert.throws(()=>PgitConflict.choose(s,0,'ours'),/여러 충돌/);assert.equal(s.content,'manual replacement\n');
});
