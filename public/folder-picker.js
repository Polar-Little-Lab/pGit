// Native folder selection shared by project and worktree forms.
window.PgitFolderPicker=(()=>{
 function desktop(){if(window.pgitDesktop)return window.pgitDesktop;try{if(parent!==window&&parent.location.origin===location.origin)return parent.pgitDesktop}catch{}return null}
 async function choose({title,defaultPath}={}){const bridge=desktop();if(!bridge)return null;return bridge.chooseFolder({title:window.PgitI18n?.t(title)||title,defaultPath})}
 function mount({input,submit,error}){
  if(!desktop())return;
  const row=document.createElement('div');row.className='folder-picker-field';
  const browse=document.createElement('button');browse.type='button';browse.textContent='찾아보기';
  input.before(row);row.append(input,browse);input.readOnly=true;submit.disabled=!input.value;
  browse.onclick=async()=>{
   browse.disabled=true;
   try{
    const selected=await choose({title:'프로젝트 폴더',defaultPath:input.value||undefined});
    if(selected&&row.isConnected){input.value=selected;input.title=selected;error.textContent='';submit.disabled=false;input.dispatchEvent(new Event('change',{bubbles:true}))}
   }catch(e){error.textContent=e.message}finally{browse.disabled=false}
  };
 }
 return {available:()=>!!desktop(),choose,mount};
})();
