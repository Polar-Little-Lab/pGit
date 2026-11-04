import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {requireTrustedSender}=createRequire(import.meta.url)('../desktop/trust.cjs');
test('native bridge allows settings routes but rejects different origins, pages and frames',()=>{
 const base='http://127.0.0.1:43210/',frame={url:base},webContents={mainFrame:frame},event={sender:webContents,senderFrame:frame};
 for(const suffix of ['', '#settings/appearance','#settings/language']){frame.url=base+suffix;assert.doesNotThrow(()=>requireTrustedSender(event,webContents,base))}
 for(const url of ['https://example.com/','http://127.0.0.1:43211/','http://127.0.0.1:43210/workspace','http://127.0.0.1:43210/?redirect=1','about:blank']){frame.url=url;assert.throws(()=>requireTrustedSender(event,webContents,base),/Invalid sender/)}
 frame.url=base;assert.throws(()=>requireTrustedSender({...event,senderFrame:{url:base}},webContents,base));assert.throws(()=>requireTrustedSender({...event,sender:{}},webContents,base));
});
