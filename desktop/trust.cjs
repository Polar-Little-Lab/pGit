// Settings routes are same-document hashes; only the application's main frame
// may use native dialogs and workspace persistence, never its project frames.
function requireTrustedSender(event,webContents,expectedUrl){
 if(event.sender!==webContents||event.senderFrame!==webContents.mainFrame)throw Error('Invalid sender');
 let actual;try{actual=new URL(event.senderFrame.url);actual.hash=''}catch{throw Error('Invalid sender')}
 if(actual.href!==expectedUrl)throw Error('Invalid sender');
}
module.exports={requireTrustedSender};
