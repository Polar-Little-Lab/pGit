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
 function closeButton(dialog,label='닫기'){
  const button=PgitIcons.close(document.createElement('button'),label);button.onclick=()=>dialog.close();return button;
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
 return {selectionGroup,segments,closeButton,dialogHeader,labeledField,externalLink,listItem};
})();
