// Shared by the browser and Node; this validates syntax, not filesystem access.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PgitPaths=factory()})(globalThis,()=>{
 function isAbsolute(value){return typeof value==='string'&&value.length>0&&value.length<=4096&&!/[\0\r\n]/.test(value)&&(value.startsWith('/')||/^[a-z]:[\\/]/i.test(value)||/^\\\\[^\\/]+[\\/][^\\/]+(?:[\\/]|$)/.test(value))}
 function basename(value){return typeof value==='string'?value.replace(/[\\/]+$/,'').split(/[\\/]/).pop()||value:''}
 return {isAbsolute,basename};
});
