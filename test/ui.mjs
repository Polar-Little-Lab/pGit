import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir,realpath,readFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'pgit-ui-')));let browser;
try{
 await git(root,['init','-b','main']);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','polar@example.com']);
 await writeFile(root+'/example.txt',Array.from({length:30},(_,i)=>'line '+i).join('\n')+'\n');await git(root,['add','.']);await git(root,['commit','-m','Initial UI fixture']);
 await writeFile(root+'/example.txt',(await readFile(root+'/example.txt','utf8')).replace('line 1\n','modified line 1\n').replace('line 25\n','modified line 25\n'));
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage({viewport:{width:1440,height:940}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const responseChecks=[];
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon')&&!m.text().startsWith('Failed to load resource:'))errors.push(m.text())});
 // Background diff reads can observe an unsupported or externally reset fixture.
 // Mutation failures remain errors; final Git assertions verify every write.
 // Check HTTP failures explicitly instead of treating handled 400s as JS errors.
 page.on('response',response=>{if(response.status()<400||response.url().endsWith('/favicon.ico'))return;responseChecks.push((async()=>{
  const request=response.request(),data=request.postDataJSON(),body=await response.json().catch(()=>null);
  const expected=response.status()===400&&response.url().endsWith('/api')&&['example.txt','new.txt'].includes(data?.name)&&((data.action==='hunks'&&[
   '부분 스테이징은 충돌·이름 변경이 없는 추적 파일에 지원합니다.',
   '파일 생성·삭제·모드 변경·바이너리는 파일 단위로 스테이징하세요.'
  ].includes(body?.error))||(data.action==='workingComparison'&&body?.error==='파일 상태가 변경되었습니다. 새로고침하세요.'));
  if(!expected)errors.push(`HTTP ${response.status()} ${response.url()} ${data?.action}: ${JSON.stringify(body)}`);
 })().catch(error=>errors.push(error.message)))});

 await page.goto((await ready)+'workspace');await page.getByRole('button',{name:'저장소 열기',exact:true}).click();await page.locator('#pathInput').fill(root);await page.locator('#openForm').getByRole('button',{name:'열기',exact:true}).click();await page.locator('.historyrow').first().waitFor();await page.locator('.historyrow').first().click({button:'right'});await page.locator('.advanced-dialog').getByRole('button',{name:'체리픽',exact:true}).waitFor();await page.locator('.advanced-dialog').getByRole('button',{name:'닫기',exact:true}).click();assert.equal(await page.locator('.brand').count(),0);
 assert.equal(await page.locator('.git-toolbar').first().evaluate(el=>getComputedStyle(el).display),'flex');
 await page.getByRole('button',{name:'브랜치 만들기',exact:true}).click();await page.locator('#command-name').fill('ui-feature');await page.locator('#commandDialog').getByRole('button',{name:'브랜치 만들기',exact:true}).click();await page.locator('#commandDialog').waitFor({state:'hidden'});assert.match(await git(root,['branch','--list']),/ui-feature/);
 await page.locator('#changesNav').click();await page.getByRole('button',{name:'example.txt · 작업 중',exact:true}).click();await page.locator('#diff .diff-count').getByText('2개 변경',{exact:true}).waitFor();await page.locator('.inline-block-check').first().check();await page.getByRole('button',{name:'선택한 변경 스테이징',exact:true}).click();await page.waitForFunction(()=>!working&&state.files.find(f=>f.name==='example.txt')?.index==='M');assert.match(await git(root,['diff','--cached']),/modified line 1/);assert.doesNotMatch(await git(root,['diff','--cached']),/modified line 25/);
 // A partially staged file must show exactly which lines will be committed.
 await page.getByRole('button',{name:'example.txt · 커밋할 변경',exact:true}).click();
 await page.locator('#diff .diff-added code').getByText('modified line 1', {exact:true}).waitFor();
 assert.doesNotMatch(await page.locator('#diff').textContent(),/modified line 25/);
 assert.equal(await page.getByRole('button',{name:'스테이징',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await page.getByRole('button',{name:'example.txt · 작업 중',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'example.txt · 커밋할 변경',exact:true}).count(),1);
 assert.match(await page.locator('#commitSummary').textContent(),/작업 중 영역의 변경은 남습니다/);
 assert.equal(await page.getByRole('button',{name:'충돌 해결',exact:true}).isEnabled(),false);
 // Refresh must retain an index selection; another file must update the mode label and content together.
 await writeFile(root+'/new.txt','untracked preview\n');
 await page.locator('#reset').click();
 await page.getByRole('button',{name:'new.txt · 작업 중',exact:true}).waitFor();
 await page.locator('#diff .diff-added code').getByText('modified line 1', {exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'스테이징',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'new.txt · 작업 중',exact:true}).click();
 await page.locator('#diff .diff-added code').getByText('untracked preview',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'작업 폴더',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await page.getByRole('button',{name:'스테이징',exact:true}).isEnabled(),false);
 // File-level actions move the selected file between areas without altering its content.
 await page.getByRole('button',{name:'new.txt 파일 전체 스테이징',exact:true}).click();
 await page.getByRole('button',{name:'new.txt · 커밋할 변경',exact:true}).waitFor();
 await page.locator('#diff .diff-added code').getByText('untracked preview',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'스테이징',exact:true}).getAttribute('aria-pressed'),'true');
 assert.match(await git(root,['diff','--cached','--','new.txt']),/untracked preview/);
 await page.getByRole('button',{name:'new.txt 스테이징 해제',exact:true}).click();
 await page.getByRole('button',{name:'new.txt · 작업 중',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'작업 폴더',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await git(root,['diff','--cached','--','new.txt']),'');
 assert.equal(await readFile(root+'/new.txt','utf8'),'untracked preview\n');
 await page.getByRole('button',{name:'example.txt · 커밋할 변경',exact:true}).click();
 await page.getByRole('button',{name:'선택한 변경 스테이징 해제',exact:true}).waitFor();
 await page.locator('#diff .diff-added code').getByText('modified line 1',{exact:true}).waitFor();
 assert.doesNotMatch(await page.locator('#diff').textContent(),/modified line 25/);
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/partial-staging.png',fullPage:true});
 // Commit via the UI and inspect Git itself, not just the rendered state.
 const stagingHead=(await git(root,['rev-parse','HEAD'])).trim();
 await page.getByRole('textbox',{name:'커밋 메시지',exact:true}).fill('Commit only the reviewed staged change');
 await page.getByRole('button',{name:'스테이징한 변경 커밋 · 1개 파일',exact:true}).click();
 await page.locator('#commitSummary').getByText('작업 중 영역에서 커밋할 변경을 스테이징하세요.',{exact:true}).waitFor();
 assert.match(await git(root,['show','HEAD:example.txt']),/modified line 1/);
 assert.doesNotMatch(await git(root,['show','HEAD:example.txt']),/modified line 25/);
 assert.match(await git(root,['diff']),/modified line 25/);
 assert.equal(await git(root,['diff','--cached']),'');
 assert.match(await git(root,['status','--porcelain']),/\?\? new.txt/);
 await page.locator('#diff .diff-added code').getByText('modified line 25',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'작업 폴더',exact:true}).getAttribute('aria-pressed'),'true');
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/staging-areas.png',fullPage:true});
 // Restore only this disposable fixture for the remaining existing workflows.
 await git(root,['reset','--soft',stagingHead]);await rm(root+'/new.txt');
 await page.locator('#reset').click();
 await page.getByRole('button',{name:'example.txt · 커밋할 변경',exact:true}).waitFor();
 await page.getByRole('button',{name:'편집',exact:true}).click();await page.locator('.code-editor').waitFor();await page.locator('.code-editor').fill('edited in pGit\n');await page.getByRole('button',{name:'파일 저장',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});assert.equal(await readFile(root+'/example.txt','utf8'),'edited in pGit\n');
 await page.getByRole('button',{name:/작업 검색 (?:⌘|Ctrl\+)K/,exact:true}).click();await page.getByRole('searchbox',{name:'Git 작업 검색'}).fill('커밋 이력 정리');await page.getByRole('button',{name:'커밋 이력 정리',exact:true}).click();await page.locator('.organizer-history').waitFor();await page.locator('.advanced-dialog').getByRole('button',{name:'닫기',exact:true}).click();
 // Exercise the actual interactive rebase editor on independent fixture commits.
 await git(root,['reset','--hard','HEAD']);for(const n of ['one','two','three']){await writeFile(root+'/'+n,n);await git(root,['add',n]);await git(root,['commit','-m',n])}
 await page.locator('#reset').click();await page.waitForFunction(()=>document.querySelectorAll('.historyrow').length===4);
 await page.getByRole('button',{name:/작업 검색 (?:⌘|Ctrl\+)K/,exact:true}).click();await page.getByRole('searchbox',{name:'Git 작업 검색'}).fill('커밋 이력 정리');await page.getByRole('button',{name:'커밋 이력 정리',exact:true}).click();await page.locator('.organizer-history').waitFor();await page.locator('.organizer-commit').filter({hasText:'one'}).click();await page.getByRole('button',{name:'선택한 3개 정리',exact:true}).click();await page.locator('.organizer-row').nth(1).locator('.organizer-row-heading').click();await page.getByRole('button',{name:'변경만 합치기',exact:true}).click();await page.getByRole('button',{name:'변경 적용',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});assert.equal((await git(root,['rev-list','--count','HEAD'])).trim(),'3');
 await page.locator('#branches .branchitem.checked-out').click();
 // Before/after is read from the commit, not the dirty working tree.
 const previous=(await git(root,['rev-parse','HEAD'])).trim();const original=await readFile(root+'/example.txt','utf8');await writeFile(root+'/example.txt',original.replace('line 1\n','line 1 committed replacement\n').replace('line 25\n','second change\n'));await git(root,['add','example.txt']);await git(root,['commit','-m','Compare before and after']);await writeFile(root+'/example.txt','DO NOT DISPLAY UNCOMMITTED CONTENT');await page.locator('#reset').click();await page.waitForFunction(()=>document.querySelectorAll('.historyrow').length===4);await page.locator('.historyrow').first().click();
 await page.locator('.commit-file[data-name="example.txt"]').click();await page.locator('.diff-added code').filter({hasText:'committed replacement'}).waitFor();assert.equal(await page.locator('.diff-removed code').filter({hasText:'line 1'}).count(),1);assert.equal(await page.locator('.diff-display').getByText('DO NOT DISPLAY UNCOMMITTED CONTENT').count(),0);assert.equal(await page.locator('.diff-column-header').count(),2);
 assert.equal(await page.locator('.diff-added mark').filter({hasText:'committed replacement'}).count(),1);assert.equal(await page.locator('.diff-added mark').filter({hasText:'line 1'}).count(),0);const initialWidth=await page.locator('#selectedCommitPanel').evaluate(e=>e.getBoundingClientRect().width);await page.getByRole('separator',{name:'상세 패널 너비'}).press('ArrowLeft');assert.ok((await page.locator('#selectedCommitPanel').evaluate(e=>e.getBoundingClientRect().width))>initialWidth);await page.getByRole('separator',{name:'상세 패널 너비'}).press('ArrowRight');await page.locator('.diff-scroll').first().evaluate(e=>e.scrollTop=180);await page.waitForFunction(()=>{const p=document.querySelectorAll('.diff-scroll');return p.length===2&&p[0].scrollTop>0&&Math.abs(p[0].scrollTop-p[1].scrollTop)<2});await page.getByRole('button',{name:'크게 보기',exact:true}).click();await page.locator('.comparison-dialog').waitFor();assert.equal(await page.getByRole('button',{name:'스크롤 동기화',exact:true}).getAttribute('aria-pressed'),'true');await page.locator('.comparison-dialog').getByRole('button',{name:'다음 변경',exact:true}).click();assert.match(await page.locator('.comparison-dialog .diff-count').textContent(),/1 \/ 2/);
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/commit-before-after.png',fullPage:true});if(process.env.PGIT_SCREENSHOT_LOG==='1')console.log('PGIT_SCREENSHOT_BASE64:'+(await page.screenshot({type:'jpeg',quality:50})).toString('base64'));
 await page.locator('.comparison-dialog').getByRole('button',{name:'통합 보기',exact:true}).click();await page.locator('.unified-comparison .diff-added code').filter({hasText:'committed replacement'}).waitFor();assert.equal(await page.locator('.unified-comparison .diff-removed code').filter({hasText:'line 1'}).count(),1);await page.locator('.comparison-dialog').getByRole('button',{name:'좌우 보기',exact:true}).click();await page.locator('.comparison-dialog').getByRole('button',{name:'닫기',exact:true}).click();await page.locator('#inlineCommitDiff .diff-column').first().waitFor();
 // Compare any two refs with the same viewer.
 await page.getByRole('button',{name:/작업 검색 (?:⌘|Ctrl\+)K/,exact:true}).click();await page.getByRole('searchbox',{name:'Git 작업 검색'}).fill('두 커밋');await page.getByRole('button',{name:'두 커밋 비교',exact:true}).click();await page.locator('#command-from').selectOption(previous,{force:true});await page.locator('#command-to').selectOption((await git(root,['rev-parse','HEAD'])).trim(),{force:true});await page.locator('#commandDialog').getByRole('button',{name:'실행',exact:true}).click();await page.locator('.comparison-dialog .diff-column').first().waitFor();await page.locator('.comparison-dialog').getByRole('button',{name:'닫기',exact:true}).click();
 // Local and remote refs sharing a hash must still select independently; browsing never checks out.
 await git(root,['update-ref','refs/remotes/origin/main','HEAD']);await page.locator('#reset').click();await page.locator('[data-ref="refs/remotes/origin/main"]').waitFor();assert.equal(await page.getByRole('button',{name:'전체 브랜치',exact:true}).count(),0);await page.locator('[data-ref="refs/remotes/origin/main"]').click();assert.equal(await page.locator('.history-scope').textContent(),'브랜치: origin/main');assert.equal(await page.locator('[data-ref="refs/heads/main"]').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('[data-ref="refs/remotes/origin/main"]').getAttribute('aria-pressed'),'true');await page.locator('[data-ref="refs/heads/ui-feature"]').click();assert.equal(await page.locator('.history-scope').textContent(),'브랜치: ui-feature');assert.equal((await git(root,['branch','--show-current'])).trim(),'main');await page.locator('[data-ref="refs/heads/main"]').click();assert.equal(await page.locator('#allHistory').count(),0);assert.equal(await page.locator('.history-scope').textContent(),'브랜치: main');assert.equal(await page.locator('.historyrow').count(),4);await page.locator('.historyrow').first().click();await page.locator('.commit-file[data-name="example.txt"]').click();await page.locator('.diff-added mark').first().waitFor();
 await page.screenshot({path:'test-results/workspace.png',fullPage:true});if(process.env.PGIT_SCREENSHOT_LOG==='1')console.log('PGIT_WORKSPACE_BASE64:'+(await page.screenshot({type:'jpeg',quality:50})).toString('base64'));await Promise.all(responseChecks);assert.deepEqual(errors,[]);console.log('UI passed: staged/working areas, partial commit, file stage/unstage, diff mode persistence, open, graph, styles, branch, hunk staging, editor, comparison and interactive rebase.');
}finally{await browser?.close();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:200})}
