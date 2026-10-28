// Background reads use the same queue as user actions. A user request invalidates
// any outstanding refresh, so its older snapshot can never overwrite that action.
(()=>{
 const request=api;
 let generation=0,pending=0,revision=null,root=null,timer=null,running=false;
 api=function(action,data={}){
  generation++;pending++;
  return request(action,data).finally(()=>pending--);
 };
 function eligible(){
  return state&&!working&&!pending&&!document.hidden&&
   !window.frameElement?.hidden&&!document.querySelector('dialog[open]');
 }
 function schedule(delay=3000){clearTimeout(timer);timer=setTimeout(refresh,delay)}
 async function refresh(){
  if(running)return;
  if(!eligible()){schedule();return}
  running=true;
  const version=generation,currentRoot=state.root;
  if(root!==currentRoot){root=currentRoot;revision=null}
  try{
   const result=await request('refreshState',{revision,limit:historyLimit});
   if(version!==generation||state?.root!==currentRoot||!eligible())return;
   revision=result.revision;
   if(result.state){
    // Existing renderers retain draft inputs, file/area selection and history search.
    const focused=document.activeElement;
    const label=focused?.getAttribute('aria-label');
    const caret=focused instanceof HTMLInputElement?[focused.selectionStart,focused.selectionEnd]:null;
    state=result.state;
    syncHistoryScope();
    render();
    if(focused&&!focused.isConnected){
     const replacement=focused.id?document.getElementById(focused.id):label?document.querySelector(`[aria-label="${CSS.escape(label)}"]`):null;
     replacement?.focus({preventScroll:true});
     if(caret&&caret[0]!==null&&replacement instanceof HTMLInputElement)replacement.setSelectionRange(...caret);
    }
   }
  }catch{
   // External Git operations can hold locks briefly. Retry without toast spam.
  }finally{running=false;schedule()}
 }
 window.addEventListener('focus',()=>schedule(100));
 document.addEventListener('visibilitychange',()=>schedule(100));
 document.addEventListener('close',()=>schedule(100),true);
 // The shell hides inactive project frames; document.hidden does not reflect that.
 window.addEventListener('message',event=>{
  if(event.origin===location.origin&&event.source===parent&&event.data?.source==='pgit-shell'&&event.data.type==='active')schedule(100);
 });
 schedule(1000);
})();
