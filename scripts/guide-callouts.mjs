// Render annotations over the live UI before capture. Coordinates come from real controls.
// No screenshot pixels or product styles are edited; the overlay is removed after each shot.
const target=(selector,text)=>({selector,text});
export const targets={
 reset:[target('.frost-select','Reset 방식을 선택합니다. Soft·Mixed·Hard의 파일 영향을 확인합니다.'),target('.command-output','대상 커밋으로 이동할 때 바뀌는 내용을 확인합니다.')],
 merge:[target('.merge-branch-flow','가져올 브랜치를 선택하고 현재 브랜치로 향하는 방향을 확인합니다.'),target('.merge-preview','자동 사전 검사 결과를 읽습니다. 이 단계에서는 아직 병합되지 않습니다.')],
 conflict:[target('.merge-choices','왼쪽·오른쪽·양쪽 중 필요한 내용을 고르거나 결과를 직접 편집합니다.'),target('#conflictResult','최종 결과를 검토합니다. 직접 편집했다면 현재 충돌 해결을 눌러 해결 처리합니다. 모든 충돌을 해결하면 저장 버튼이 활성화됩니다.')],
 worktrees:[target('.worktree-list','작업 폴더를 선택해 사용 중인 브랜치와 경로를 확인합니다.'),target('.worktree-tools input','브랜치 또는 폴더 이름으로 찾을 수 있습니다.')],

 home:[target('#addProject','상단 +를 눌러 새 프로젝트 탭을 엽니다.'),target('#welcomeOpen','프로젝트 열기를 누르고 내 컴퓨터의 저장소 폴더를 선택합니다.'),target('#welcomeClone','원격 주소로 시작하려면 저장소 복제를 누릅니다.')],
 clone:[target('#cloneUrl','복제할 저장소의 URL을 입력합니다.'),target('#projectPath','내 컴퓨터에 만들 폴더 경로를 확인하거나 수정합니다.'),target('#submitProject','복제를 누릅니다. 완료되면 저장소 탭이 열립니다.')],
 'clone-progress':[target('#cloneProgress','현재 단계와 진행률을 확인하고 완료될 때까지 기다립니다.')],
 groups:[target('#groupName','프로젝트를 묶을 그룹 이름을 입력합니다.'),target('.group-icon-picker','아이콘을 선택합니다. 추천에는 하나금융그룹·GLN과 기본 아이콘이 있습니다.'),target('.group-tab-preview','탭에 표시될 이름과 아이콘을 확인합니다.')],
 graph:[target('[data-section=local]','로컬 브랜치를 한 번 눌러 조회할 이력을 선택합니다. 더블클릭은 실제 브랜치 전환입니다.'),target('.historyrow','커밋 행을 누르면 오른쪽에서 메시지와 변경 파일을 볼 수 있습니다.'),target('.selected-commit-panel','변경 파일을 눌러 해당 커밋의 Diff를 엽니다.')],
 'tag-history':[target('.tag-ref.active','태그를 눌러 그 릴리스까지의 이력을 조회합니다.'),target('.history-scope','현재 조회 기준을 확인합니다. 작업 파일은 바뀌지 않습니다.')],
 search:[target('#command-query','커밋 메시지에서 찾을 검색어를 입력합니다.'),target('form[data-command=searchHistory] button[type=submit]','검색을 눌러 저장소 전체 이력에서 찾습니다.'),target('.history-search-row','결과 행을 눌러 해당 커밋으로 이동합니다.')],
 'search-empty':[target('#command-query','검색어를 더 짧게 바꾸거나 다른 단어를 입력합니다.'),target('form[data-command=searchHistory] button[type=submit]','검색을 다시 누릅니다. 결과가 없으면 없는 상태가 그대로 안내됩니다.')],
 'file-history':[target('.file-history-open','메시지와 날짜를 확인한 뒤 커밋 행을 눌러 이 파일의 변경을 엽니다.')],
 'file-diff':[target('.diff-controls','파일 경로와 비교 기준을 먼저 확인합니다.'),target('.diff-code-row','추가·삭제된 줄과 줄 안의 강조를 비교합니다. 긴 코드는 이 영역을 스크롤합니다.')],
 blame:[target('.blame-viewport','각 줄 옆의 커밋·작성자를 확인합니다. 마지막으로 그 줄을 바꾼 기록입니다.')],
 changes:[target('#changesNav','변경 사항을 눌러 작업 중인 파일을 엽니다.'),target('[data-area=working]','파일 이름을 눌러 변경 내용을 검토합니다.'),target('[aria-label="lib/application.js 파일 전체 스테이징"]','Diff를 확인한 파일의 스테이징 버튼을 눌러 이번 커밋에 포함합니다.')],
 partial:[target('.inline-line-check','추가·삭제 줄의 체크박스로 이번 커밋에 넣을 줄을 선택합니다.'),target('.inline-stage-toolbar button.primary','선택한 변경 스테이징을 눌러 실제로 반영합니다. 체크만으로는 반영되지 않습니다.')],
 staging:[target('[data-area=staged]','이번 커밋에 들어갈 파일이 맞는지 스테이징 목록을 확인합니다.'),target('#message','변경 목적을 커밋 메시지로 작성합니다.'),target('#commit','커밋을 누릅니다. 스테이징한 내용만 로컬 이력에 기록됩니다.')],
 commit:[target('.historyrow','새 메시지의 커밋이 이력 맨 위에 생겼는지 확인합니다.'),target('#changesNav','남겨 둔 변경은 변경 사항에서 계속 작업합니다.')],
 'new-file':[target('.reference-field input','파일 경로를 입력합니다. 예: docs/local-guide.yml. 저장소 안의 상대 경로이며 없는 폴더도 함께 만듭니다.'),target('.syntax-editor','파일 내용을 입력합니다. 확장자에 맞는 문법 색상으로 표시됩니다.')],
 'new-file-result':[target('.new-file-button','다른 파일을 만들려면 변경 사항의 새 파일을 누릅니다.'),target('[aria-label="docs/local-guide.yml · 작업 중"]','생성한 파일이 작업 중 목록에 새 파일로 표시되는지 확인하고 이름을 눌러 내용을 검토합니다.'),target('[aria-label="docs/local-guide.yml 파일 전체 스테이징"]','이번 커밋에 넣으려면 스테이징을 누릅니다. 파일 생성만으로는 커밋되지 않습니다.')],
 'commands-alias':[target('input[type=search]','파일 추가처럼 익숙한 표현으로 검색합니다. 파일 생성·파일생성·add file도 사용할 수 있습니다.'),target('[data-command=createText]','검색 결과의 새 파일을 누릅니다. 표현이 달라도 같은 파일 생성 화면으로 이동합니다.')],
 editor:[target('.syntax-editor','문법 색상을 보며 파일을 편집합니다.')],
 ignore:[target('.ignore-tree input[type=checkbox]','기록하지 않을 파일이나 폴더를 체크합니다.')],
 'amend-files':[target('.amend-file-list','추가할 파일을 체크합니다. 파일 이름을 누르면 Diff를 볼 수 있습니다.'),target('.amend-file-preview','선택한 파일의 변경을 검토합니다.')],
 'organizer-range':[target('.organizer-commit','정리할 첫 커밋을 선택합니다. 해당 커밋부터 최신 커밋까지 포함됩니다.'),target('.organizer-footer .primary','선택한 범위를 확인하고 선택한 커밋 정리를 누릅니다.')],
 organizer:[target('.organizer-row-heading','정리할 커밋 행을 눌러 작업을 선택합니다.'),target('.organizer-result-pane','오른쪽 미리보기에서 적용 후 커밋 수와 메시지 순서를 확인합니다.'),target('.organizer-footer .primary','적용 후 이력을 확인한 뒤 변경 적용을 누릅니다.')],
 settings:[target('[data-settings-section=appearance]','설정에서 화면 항목을 엽니다.'),target('[data-theme-choice=dark]','사용할 테마를 누릅니다. 즉시 반영됩니다.')],
 typography:[target('[data-type-key=codeSize]','코드 글자 크기를 선택합니다.'),target('.typography-preview','미리보기에서 코드가 읽기 편한지 확인합니다.')],
 'auto-fetch':[target('[data-fetch-minutes="10"]','자동 Fetch 주기를 선택합니다. 원격 정보만 갱신하며 자동 Pull은 하지 않습니다.')],
 commands:[target('input[type=search]','실행할 작업의 이름을 입력합니다.'),target('.command-option','검색 결과에서 원하는 작업을 누르면 해당 화면이 열립니다.')]
};
export async function annotate(page,name,scope){
 const dialog=scope===page?null:scope;const context=dialog||page;
 let specs=targets[name];
 // Simple command forms: label the actual visible fields and final action, not guessed coordinates.
 if(!specs){specs=[];const controls=context.locator('input:not([type=hidden]),textarea,.frost-select,.commit-picker,.reference-picker');
  for(let i=0;i<await controls.count()&&specs.length<3;i++){const c=controls.nth(i);if(!await c.isVisible())continue;const text=await c.evaluate(e=>e.labels?.[0]?.textContent||e.getAttribute('aria-label')||e.closest('label')?.textContent||e.previousElementSibling?.textContent||'입력');specs.push({locator:c,text:`${text.trim().slice(0,55)} 항목을 확인하고 값을 지정합니다.`})}
 }
 const resolved=[];
 for(const spec of specs){let candidates=spec.locator?[spec.locator]:[context.locator(spec.selector),...(!dialog?page.frames().filter(f=>f!==page.mainFrame()).map(f=>f.locator(spec.selector)):[])];let found;
  for(const c of candidates){for(let i=0;i<await c.count();i++){const l=c.nth(i);if(await l.isVisible()){found=l;break}}if(found)break}
  if(!found)throw Error(`Missing guide target: ${name} ${spec.selector}`);
  resolved.push({box:await found.boundingBox(),text:spec.text});
 }
 if(dialog&&!['clone','clone-progress','search','search-empty','organizer','organizer-range','file-history','file-diff','blame'].includes(name)){
  const buttons=dialog.locator('button.primary,button[type=submit]');for(let i=await buttons.count()-1;i>=0;i--){const b=buttons.nth(i);if(await b.isVisible()){const label=(await b.innerText()).trim();if(label)resolved.push({box:await b.boundingBox(),text:`${label} 버튼을 눌러 진행합니다. 실행 전 대상과 입력값을 다시 확인합니다.`});break}}
 }
 if(!resolved.length){const content=dialog.locator('.command-output,.ui-message,.worktree-list,.command-body').first();if(!await content.isVisible())throw Error(`No guide content: ${name}`);resolved.push({box:await content.boundingBox(),text:'조회 결과를 확인합니다. 등록된 항목이 없으면 빈 상태 안내가 표시됩니다.'})}
 const host=dialog||page.locator('body');const outer=await host.boundingBox();
 await host.evaluate((el,{resolved,outer})=>{const r=el.getBoundingClientRect(),dx=outer.x-r.x,dy=outer.y-r.y;const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.dataset.guideOverlay='true';svg.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;overflow:hidden';
 const add=(tag,attrs)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n};
 resolved.forEach(({box},i)=>{const x=Math.max(r.left+3,box.x-dx),y=Math.max(r.top+3,box.y-dy),w=Math.min(box.width,r.right-x-3),h=Math.min(box.height,r.bottom-y-3);if(w<=0||h<=0)throw Error('Guide target outside screenshot');add('rect',{x:x+1,y:y+1,width:w-2,height:h-2,rx:4,fill:'none',stroke:'#ff4545','stroke-width':3});const cx=x+w-14,cy=y-r.top>28?y-12:y+13;add('path',{d:`M${cx-13} ${cy} L${cx-31} ${cy} L${Math.max(x+w/2,cx-31)} ${y+7} l-4 -5 m4 5 l4 -5`,fill:'none',stroke:'#ff4545','stroke-width':2});add('circle',{cx,cy,r:12,fill:'#d82020',stroke:'white','stroke-width':2});const t=add('text',{x:cx,y:cy+4,'text-anchor':'middle',fill:'white','font-size':13,'font-family':'Arial,sans-serif','font-weight':700});t.textContent=String(i+1)});el.append(svg)}, {resolved,outer});
 return {annotations:resolved.map((r,i)=>({number:i+1,text:r.text})),remove:()=>host.locator('[data-guide-overlay]').evaluateAll(nodes=>nodes.forEach(n=>n.remove()))};
}
