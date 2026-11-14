import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const context={window:{}};vm.runInNewContext(await readFile(new URL('../public/locales.js',import.meta.url),'utf8'),context);const {languages,columns,messages,translate}=context.window.PgitLocales;
const source=await readFile(new URL('../public/i18n.js',import.meta.url),'utf8');const english=source.split('const pairs=`')[1].split('`;')[0].split('\n').filter(line=>line.includes('|')).map(line=>line.split('|')[1]);
test('all six languages have complete app-copy coverage and consistent placeholders',()=>{
 assert.equal(languages.length,6);for(const text of english)assert.ok(messages[text],`Missing translation: ${text}`);
 for(const [key,values] of Object.entries(messages)){assert.equal(values.length,columns.length);for(const value of values){assert.ok(value.trim(),key);assert.deepEqual(value.match(/\{\d+\}/g)?.sort()||[],key.match(/\{\d+\}/g)?.sort()||[],key)}}
});
test('localized counts and compound messages preserve repository identifiers',()=>{
 assert.equal(translate('ja','12 results / 100 commits'),'12 件 / 100 コミット');assert.equal(translate('zh-CN','3 / 12 changes'),'3 / 12 处更改');
 assert.equal(translate('fr','Settings · History'),'Settings · Historique');assert.equal(translate('es','Close 日本語/feature tab'),'Cerrar pestaña 日本語/feature');
 assert.equal(translate('ja','Commit only the 2 staged files. Unstaged changes remain. Enter a commit message.'),'ステージ済みの 2 ファイルのみコミットします。 未ステージの変更は残ります。 コミットメッセージを入力してください。');
 assert.equal(translate('fr','1 results / 12 commits'),'1 résultat / 12 commits');assert.equal(translate('es','1 commits'),'1 commit');
 assert.equal(translate('ja','literal Settings file'),'literal Settings file');
});

test('history counts translate loaded, total and search counts in all locales',()=>{
 for(const language of columns){for(const text of ['0 results · 50 / 1,200 total commits','50 / Counting total…','0 results · 50 / Total count failed'])assert.notEqual(translate(language,text),text,`${language}: ${text}`)}
 assert.equal(translate('ja','0 results · 50 / 1,200 total commits'),'0 件 · 50 / 全 1,200 コミット');
});
