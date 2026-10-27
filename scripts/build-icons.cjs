const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');
fs.mkdirSync(path.join(root,'build'),{recursive:true});
fs.writeFileSync(path.join(root,'build/icon.png'),Buffer.from(fs.readFileSync(path.join(root,'desktop/icon.png.base64'),'utf8'),'base64'));
