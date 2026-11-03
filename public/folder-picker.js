// Native folder selection shared by project and worktree forms.
window.PgitFolderPicker=(()=>{
 function desktop(){if(window.pgitDesktop)return window.pgitDesktop;try{if(parent!==window&&parent.location.origin===location.origin)return parent.pgitDesktop}catch{}return null}
 async function choose({title,defaultPath}={}){const bridge=desktop();if(!bridge)return null;return bridge.chooseFolder({title:window.PgitI18n?.t(title)||title,defaultPath})}
 return {available:()=>!!desktop(),choose};
})();
