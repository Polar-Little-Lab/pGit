import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const {normalizeWorkspace}=createRequire(import.meta.url)('../desktop/workspace-store.cjs');
const context={window:{}};vm.runInNewContext(await readFile(new URL('../public/theme-catalog.js',import.meta.url),'utf8'),context);const themes=context.window.PgitThemes;
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('all six palettes persist and meet normal-text contrast for core controls',()=>{
 assert.equal(themes.length,6);assert.equal(new Set(themes.map(t=>t.id)).size,6);
 for(const theme of themes){assert.equal(normalizeWorkspace({theme:theme.id}).theme,theme.id);for(const background of ['surface','canvas'])for(const foreground of ['text','muted'])assert.ok(contrast(theme.colors[foreground],theme.colors[background])>=4.5,`${theme.id}: ${foreground}/${background}`);assert.ok(contrast('#ffffff',theme.colors.primary)>=4.5,theme.id+' primary');assert.ok(contrast(theme.colors.accent,theme.colors.selected)>=4.5,theme.id+' selected')}
});

test('desktop workspace retains only valid typography preferences',()=>{
 const typography={uiSize:14,codeSize:20,font:'menlo',spacing:2.2};assert.deepEqual(normalizeWorkspace({typography}).typography,typography);assert.equal(normalizeWorkspace({typography:{uiSize:500,font:'arbitrary',zoom:0}}).typography,undefined);
});
