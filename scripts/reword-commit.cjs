// Called by a generated rebase exec line. User messages are file data, never shell commands.
const {execFileSync}=require('node:child_process');
if(!process.argv[2])throw Error('Missing commit message');
execFileSync('git',['commit','--amend','--allow-empty','--only','-F',process.argv[2]],{stdio:'inherit',windowsHide:true});
