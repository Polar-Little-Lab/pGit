(()=>{
 if(parent!==window)return;
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e};
 const button=make('button',null,'guide-button icon-control');button.type='button';PgitIcons.label(button,'book');button.setAttribute('aria-label','사용 가이드');button.dataset.tooltip='사용 가이드';button.setAttribute('aria-haspopup','dialog');document.querySelector('.settings-button')?.before(button);
 const dialog=make('dialog',null,'user-guide');dialog.setAttribute('aria-labelledby','guideTitle');
 const header=make('div',null,'guide-header'),title=make('h2','사용 가이드');title.id='guideTitle';const close=make('button');close.type='button';PgitIcons.close(close);close.onclick=()=>dialog.close();header.append(title,close);
 const search=make('input');search.type='search';search.setAttribute('aria-label','가이드 검색');search.placeholder='가이드 검색';
 const layout=make('div',null,'guide-layout'),nav=make('nav',null,'guide-nav'),body=make('article',null,'guide-content literal-data');nav.setAttribute('aria-label','가이드 목차');nav.lang='ko';body.lang='ko';layout.append(nav,body);dialog.append(header,search,layout);document.body.append(dialog);
 const imageDialog=make('dialog',null,'guide-image-viewer'),imageHeader=make('div',null,'guide-header'),imageTitle=make('h2'),imageClose=make('button'),imageBody=make('div',null,'guide-image-scroll'),largeImage=make('img');imageTitle.id='guideImageTitle';imageDialog.setAttribute('aria-labelledby',imageTitle.id);PgitIcons.close(imageClose);imageClose.onclick=()=>imageDialog.close();imageHeader.append(imageTitle,imageClose);imageBody.append(largeImage);imageDialog.append(imageHeader,imageBody);document.body.append(imageDialog);let imageTrigger;
 imageDialog.addEventListener('close',()=>imageTrigger?.focus());
 // Only a click that starts and ends on the backdrop dismisses a read-only view.
 // Text selection or dragging an image out of the window must not close it.
 for(const view of [dialog,imageDialog]){
  let pressedOutside=false;
  const outside=event=>{const r=view.getBoundingClientRect();return event.target===view&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)};
  view.addEventListener('pointerdown',event=>{pressedOutside=event.button===0&&outside(event)});
  view.addEventListener('pointercancel',()=>{pressedOutside=false});
  view.addEventListener('click',event=>{const dismiss=pressedOutside&&outside(event);pressedOutside=false;if(dismiss)view.close()});
  view.addEventListener('close',()=>{pressedOutside=false});
 }

 function figure(alt,src){const figure=make('figure'),open=make('button'),img=make('img'),caption=make('figcaption',alt);open.type='button';open.className='guide-image-button';open.setAttribute('aria-label',alt+' · 크게 보기');img.src='/guide/'+src;img.alt=alt;img.loading='lazy';open.append(img);open.onclick=()=>{imageTrigger=open;imageTitle.textContent=alt;largeImage.src=img.src;largeImage.alt=alt;imageDialog.showModal();imageBody.scrollTop=imageBody.scrollLeft=0};figure.append(open,caption);return figure}
 let loaded=false,sections=[],previousFocus;
 function inline(node,text){for(const [i,part] of text.split('`').entries())node.append(i%2?make('code',part):document.createTextNode(part))}
 function render(markdown){nav.replaceChildren();body.replaceChildren();sections=[];for(const [index,part] of markdown.split(/^## /m).entries()){
  const lines=part.trim().split('\n'),heading=index?lines.shift():'가이드 소개',section=make('section');section.id='guide-section-'+index;
  const h=make('h3',heading);h.tabIndex=-1;section.append(h);let list=null;
  for(const line of lines){if(!line.trim()||line.startsWith('# ')){list=null;continue}const picture=line.match(/^!\[([^\]]+)\]\((images\/[a-z0-9-]+\.png)\)$/);if(picture){list=null;section.append(figure(picture[1],picture[2]));continue}const match=line.match(/^(- |\d+\. )(.*)/);if(match){const kind=match[1]==='- '?'ul':'ol';if(!list||list.tagName.toLowerCase()!==kind){list=make(kind);section.append(list)}const li=make('li');inline(li,match[2]);list.append(li)}else{list=null;const p=make('p');inline(p,line);section.append(p)}}
  const link=make('button',heading,'literal-data');link.type='button';link.onclick=()=>{section.scrollIntoView({block:'start'});h.focus({preventScroll:true});nav.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));link.setAttribute('aria-current','location')};nav.append(link);body.append(section);sections.push({section,link,text:section.textContent.toLowerCase()});
 }filter()}
 const empty=make('p','검색 결과가 없습니다.','guide-empty');empty.hidden=true;layout.append(empty);
 function filter(){const query=search.value.trim().toLowerCase();for(const item of sections){const visible=!query||item.text.includes(query);item.section.hidden=item.link.hidden=!visible}empty.hidden=sections.some(item=>!item.section.hidden);body.scrollTop=0;nav.scrollTop=0}
 search.oninput=filter;
 button.onclick=async()=>{previousFocus=document.activeElement;if(!dialog.open)dialog.showModal();search.focus();if(loaded)return;body.textContent='불러오는 중…';try{const result=await fetch('/guide.md');if(!result.ok)throw Error();render(await result.text());loaded=true}catch{body.textContent='가이드를 불러오지 못했습니다. 창을 닫고 다시 열어 주세요.'}};
 dialog.addEventListener('close',()=>previousFocus?.focus());
})();
