// One 24px grid, rounded 1.75px strokes. All icons inherit the control's color.
(()=>{
 const paths={
  plus:'M12 5v14M5 12h14',close:'m6 6 12 12M18 6 6 18',back:'m10 5-7 7 7 7M3 12h18',
  up:'m6 10 6-6 6 6M12 4v16',down:'m6 14 6 6 6-6M12 4v16',
  refresh:'M20 7v5h-5M4 17v-5h5M5.1 7a8 8 0 0 1 13.2-1L20 9M4 15l1.7 3A8 8 0 0 0 19 17',
  undo:'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',
  branch:'M6 8v8M8 18h4a6 6 0 0 0 6-6V8M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4M18 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  // Cloud = remote fetch; tray = local pull/push. Direction stays clear at 18px.
  fetch:'M6 16a4 4 0 0 1-1-8 6 6 0 0 1 11-3 4 4 0 0 1 3 11M12 10v11m-4-4 4 4 4-4',
  pull:'M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6',
  push:'M12 15V3m-4 4 4-4 4 4M4 15v6h16v-6',
  stash:'M3 11h18v10H3zM2 8h6m8 0h6M12 2v12m-3-3 3 3 3-3',
  unstash:'M3 11h4m10 0h4v10H3V11M12 14V2m-3 3 3-3 3 3',
  history:'M4 5v5h5M4.5 9a8 8 0 1 1-.3 6M12 7v5l3 2',
  changes:'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5',
  worktree:'M12 7v5M5 12h14M5 12v5m14-5v5M9 2h6v5H9zM2 17h6v5H2zM16 17h6v5h-6z',
  settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  palette:'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4l-1-1a2 2 0 0 1 2-3h3a2 2 0 0 0 2-2 9 9 0 0 0-9-8M7 9h.01M10 6h.01M15 7h.01',
  language:'M3 5h12M9 2v3M6 5c0 6 5 10 9 11M13 5c0 6-5 10-10 11M14 21l4-10 4 10M16 17h4',
  check:'m5 12 4 4L19 6',folder:'M3 6h7l2 3h9v11H3zM3 6V4h6l2 2',
  search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',
  lock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4',unlock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0',
  trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
 };
 function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('pgit-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]||paths.changes);svg.append(path);return svg}
 function label(button,name,text){button.replaceChildren(icon(name));if(text!==undefined){const span=document.createElement('span');span.textContent=text;button.append(span)}button.classList.add('icon-control')}
 function close(button,name=button.getAttribute('aria-label')||'닫기'){label(button,'close');button.classList.add('close-control');button.type='button';button.setAttribute('aria-label',name);button.title=name;return button}
 window.PgitIcons={icon,label,close};
 for(const id of ['closePicker','closeOpen','closeDetails','closeProjectDialog']){const button=document.getElementById(id);if(button)close(button)}
})();
