export function parseGitHubRemote(url){let match=url.match(/^git@([\w.-]+):([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)||url.match(/^https:\/\/([\w.-]+)\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/)||url.match(/^ssh:\/\/git@([\w.-]+)\/([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);if(!match)throw Error('origin에 GitHub HTTPS 또는 SSH 원격을 설정하세요.');return match[1]+'/'+match[2]+'/'+match[3]}
export function parseGitLabRemote(remote){
 let url;try{url=new URL(remote.replace(/^([^/@:]+)@([^/:]+):(.+)$/, 'ssh://$1@$2/$3'))}catch{throw Error('GitLab HTTPS 또는 SSH 원격을 선택하세요.')}
 if(!['https:','ssh:'].includes(url.protocol)||url.password||(url.protocol==='https:'&&url.username)||url.search||url.hash)throw Error('인증 정보 없는 GitLab HTTPS 또는 SSH 주소를 사용하세요.');
 const project=url.pathname.replace(/^\/|\/$/g,'').replace(/\.git$/,'');
 if(!/^[\w.-]+(?:\/[\w.-]+)+$/.test(project)||project.split('/').some(p=>p==='.'||p==='..'))throw Error('잘못된 GitLab 프로젝트 경로');
 const host=url.protocol==='ssh:'?url.hostname:url.host;
 return {host,project,repo:`https://${host}/${project}`};
}
