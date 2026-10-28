// One accessible tooltip for mouse, touch/click and keyboard focus. Popover puts
// it above dialogs without clipping or changing the editor's layout.
(()=>{
 const tip=document.createElement('div');tip.id='pgitTooltip';tip.className='pgit-tooltip';tip.setAttribute('role','tooltip');tip.setAttribute('popover','manual');document.body.append(tip);
 let anchor=null,showTimer,hideTimer,title=null;
 function hide(){clearTimeout(showTimer);clearTimeout(hideTimer);if(anchor){const ids=(anchor.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==tip.id);if(ids.length)anchor.setAttribute('aria-describedby',ids.join(' '));else anchor.removeAttribute('aria-describedby');if(title&&!anchor.hasAttribute('title'))anchor.title=title}anchor=null;title=null;tip.hidePopover()}
 function position(){if(!anchor?.isConnected){hide();return}const box=anchor.getBoundingClientRect(),bounds=tip.getBoundingClientRect();const left=Math.max(8,Math.min(innerWidth-bounds.width-8,box.left+(box.width-bounds.width)/2));const below=box.bottom+8;tip.style.left=left+'px';tip.style.top=(below+bounds.height<=innerHeight-8?below:Math.max(8,box.top-bounds.height-8))+'px';tip.dataset.side=below+bounds.height<=innerHeight-8?'bottom':'top';tip.style.setProperty('--arrow-x',Math.max(12,Math.min(bounds.width-12,box.left+box.width/2-left))+'px')}
 function show(button){
  hide();if(!button?.isConnected)return;const dialog=document.querySelector('dialog[open]');if(dialog&&!dialog.contains(button))return;
  const text=button.dataset.tooltip||button.getAttribute('title');if(!text)return;
  anchor=button;title=button.getAttribute('title');button.removeAttribute('title');
  tip.textContent=window.PgitI18n?.t(text)||text;button.setAttribute('aria-describedby',[(button.getAttribute('aria-describedby')||''),tip.id].filter(Boolean).join(' '));
  tip.showPopover();position();
 }
 function target(event){if(anchor?.contains(event.target))return anchor;return event.target instanceof Element?event.target.closest('button[data-tooltip],button.icon-control[title],button.close-control[title]'):null}
 document.addEventListener('pointerover',event=>{const button=target(event);if(!button||button===anchor||button.contains(event.relatedTarget))return;clearTimeout(showTimer);showTimer=setTimeout(()=>show(button),250)});
 document.addEventListener('pointerout',event=>{const button=target(event);if(button?.contains(event.relatedTarget))return;if(button){clearTimeout(showTimer);hideTimer=setTimeout(hide,150)}});
 document.addEventListener('focusin',event=>{const button=target(event);if(button)show(button);else hide()});
 document.addEventListener('focusout',event=>{if(event.target===anchor)hide()});
 document.addEventListener('click',event=>{const button=target(event);if(button){show(button);hideTimer=setTimeout(hide,3500)}else hide()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&anchor){hide()}},true);
 tip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));tip.addEventListener('pointerleave',hide);
 window.addEventListener('pgit-language-change',hide);window.addEventListener('resize',hide);document.addEventListener('scroll',()=>{if(anchor)position()},true);document.addEventListener('close',hide,true);window.addEventListener('blur',hide);
 new MutationObserver(()=>{if(anchor&&!anchor.isConnected)hide()}).observe(document.body,{childList:true,subtree:true});
})();
