const path=require('node:path');
function runtimeEnvironment(env=process.env,platform=process.platform){
 const result={...env},windows=platform==='win32',p=windows?path.win32:path.posix;
 const keys=Object.keys(result).filter(key=>key.toLowerCase()==='path');const current=keys.map(key=>result[key]).filter(Boolean).join(windows?';':':');for(const key of keys)delete result[key];
 const extras=windows?[
  env.ProgramFiles&&p.join(env.ProgramFiles,'Git','cmd'),
  env.LOCALAPPDATA&&p.join(env.LOCALAPPDATA,'Programs','Git','cmd'),
  env.ProgramFiles&&p.join(env.ProgramFiles,'GitHub CLI'),
 ]:['/opt/homebrew/bin','/usr/local/bin','/usr/bin','/bin'];
 result.PATH=[current,...extras].filter(Boolean).join(windows?';':':');return result;
}
function windowChrome(platform=process.platform){return platform==='darwin'?{titleBarStyle:'hiddenInset',trafficLightPosition:{x:14,y:18}}:{frame:true}}
module.exports={runtimeEnvironment,windowChrome};
