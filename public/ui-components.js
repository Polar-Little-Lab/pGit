// Shared DOM controls. Workflow state and Git operations belong to the callers.
window.PgitUI=(()=>{
 function selectionGroup(element,{label,items,value,onChange}){
  element.setAttribute('role','group');element.setAttribute('aria-label',label);
  const buttons=new Map(items.map(({value,button})=>[String(value),button]));
  function setValue(next){value=String(next);for(const [key,button] of buttons){button.setAttribute('aria-pressed',String(key===value));button.classList.toggle('active',key===value)}}
  for(const [key,button] of buttons){button.type='button';button.onclick=()=>{setValue(key);onChange?.(key)};element.append(button)}
  setValue(value);return {element,buttons,setValue};
 }
 function segments({items,value,label,onChange,className='reference-modes',dataKey}){
  const element=document.createElement('div');element.className=className;
  return selectionGroup(element,{label,value,onChange,items:items.map(([value,label])=>{const button=document.createElement('button');button.textContent=label;if(dataKey)button.dataset[dataKey]=value;return {value,button}})});
 }
 function dismissDialog(dialog){if(!dialog?.open||dialog.pgitCanClose&&!dialog.pgitCanClose())return;const cancel=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(cancel))dialog.close()}
 function checkboxField(text,input=document.createElement('input')){input.type='checkbox';const element=document.createElement('label'),caption=document.createElement('span');element.className='ui-check-field';caption.textContent=text;element.append(input,caption);return {element,input}}
 function closeButton(dialog,label='닫기'){
  const button=PgitIcons.close(document.createElement('button'),label);button.onclick=()=>{if(!dialog.pgitCanClose||dialog.pgitCanClose())dialog.close()};return button;
 }
 function dialogHeader(dialog,text,{className='bar',titleTag='strong',titleId}={}){
  const element=document.createElement('div');element.className=className;
  const title=document.createElement(titleTag);title.textContent=text;title.id=titleId||'dialog-title-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',title.id);
  const close=closeButton(dialog);element.append(title,close);return {element,title,close};
 }
 function labeledField(text,control,className='reference-field'){
  const element=document.createElement('div');element.className=className;
  const label=document.createElement('label');label.textContent=text;control.id=control.id||'field-'+crypto.randomUUID();label.htmlFor=control.id;element.append(label,control);return element;
 }
 function dialogFrame(dialog,{title,body,container=dialog,actions,canClose,...headerOptions}){
  const header=dialogHeader(dialog,title,headerOptions);dialog.classList.add('ui-dialog');container.classList.add('ui-dialog-layout');body.classList.add('ui-dialog-content');
  dialog.pgitCanClose=canClose;
  if(!dialog.dataset.uiCloseGuard){dialog.dataset.uiCloseGuard='true';dialog.addEventListener('cancel',event=>{if(dialog.pgitCanClose&&!dialog.pgitCanClose())event.preventDefault()})}
  if(actions)actions.classList.add('ui-dialog-actions');container.replaceChildren(header.element,body,...(actions?[actions]:[]));if(container!==dialog)dialog.replaceChildren(container);
  return header;
 }
 function externalLink(element,href){
  try{const url=new URL(href);if(url.protocol!=='https:'||url.username||url.password)return false;element.href=url.href;element.target='_blank';element.rel='noopener noreferrer';return true}catch{return false}
 }
 function listItem({title,meta='',href,className=''}){
  const element=document.createElement('article');element.className='ui-list-item '+className;
  const anchor=document.createElement('a'),linked=externalLink(anchor,href);
  const main=linked?anchor:document.createElement('div');main.className='ui-list-main';
  const heading=document.createElement('strong');heading.className='ui-list-title literal-data';heading.textContent=title;main.append(heading);
  if(meta){const detail=document.createElement('p');detail.className='ui-list-meta literal-data';detail.textContent=meta;main.append(detail)}
  if(linked){const icon=document.createElement('span');icon.className='ui-list-external';icon.textContent='↗';icon.setAttribute('aria-hidden','true');main.append(icon)}
  const actions=document.createElement('div');actions.className='ui-list-actions';element.append(main,actions);return {element,main,actions};
 }
 function notification(host){
  let version=0,animation=null,timer;
  host.classList.add('ui-notification');host.hidden=true;host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('popover','manual');
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hide(){
   const current=++version;clearTimeout(timer);animation?.cancel();if(host.hidden)return;
   animation=host.animate([{transform:'translate(-50%, 0)'},{transform:'translate(-50%, calc(-100% - 80px))'}],{duration:reduced()?0:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
   animation.finished.then(()=>{if(current===version){host.hidden=true;host.hidePopover?.();animation.cancel();animation=null}}).catch(()=>{});
  }
  function show(){
   const current=++version;clearTimeout(timer);animation?.cancel();host.hidden=false;host.showPopover?.();
   animation=host.animate([{transform:'translate(-50%, calc(-100% - 80px))'},{transform:'translate(-50%, 0)'}],{duration:reduced()?0:240,easing:'cubic-bezier(.16,1,.3,1)'});
   animation.finished.then(()=>{if(current===version)timer=setTimeout(hide,3000)}).catch(()=>{});
  }
  return {show,hide};
 }
 function message(text,{error=false}={}){const element=document.createElement('div');element.className='ui-list-message';element.setAttribute('role',error?'alert':'status');element.textContent=text;return element}
 function commandFormLayout(form,{inline=false}={}){form.classList.add('ui-command-form');form.classList.toggle('ui-command-inline',inline)}
 return {commandFormLayout,dismissDialog,checkboxField,notification,message,selectionGroup,segments,closeButton,dialogHeader,dialogFrame,labeledField,externalLink,listItem};
})();

// One backdrop policy for native dialogs, including dynamically created views.
(()=>{let pressed=null;const outside=(event,dialog)=>{if(event.target!==dialog||!dialog.open)return false;const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom};
 document.addEventListener('pointerdown',event=>{const dialog=event.target.closest?.('dialog');pressed=event.button===0&&dialog&&outside(event,dialog)?dialog:null},true);
 document.addEventListener('pointercancel',()=>pressed=null,true);
 document.addEventListener('click',event=>{const dialog=pressed;pressed=null;if(!dialog||!outside(event,dialog))return;PgitUI.dismissDialog(dialog)},true);
})();
