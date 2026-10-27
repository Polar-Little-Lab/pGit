const fs=require('node:fs');
if(!process.env.PGIT_TODO||!process.argv[2])throw Error('Missing rebase plan');
fs.copyFileSync(process.env.PGIT_TODO,process.argv[2]);
