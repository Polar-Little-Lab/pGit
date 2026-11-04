// Selection includes the Git area: one partially staged file can appear in both lists.
function hasStagedChange(file) {
  return !file.conflict && file.index !== ' ' && file.index !== '?';
}
function hasWorkingChange(file) {
  return file.conflict || file.untracked || file.worktree !== ' ';
}

function selectChange(name, stagedArea) {
  selected = name;
  staged = stagedArea;
  renderChangesFiles();
  loadDiff();
}

function renderChangesFiles() {
  const files = state?.files || [];
  const current = files.find(file => file.name === selected);
  if (!current) {
    const first = files.find(hasWorkingChange) || files.find(hasStagedChange);
    selected = first?.name || null;
    staged = !!first && !hasWorkingChange(first);
  } else if (staged ? !hasStagedChange(current) : !hasWorkingChange(current)) {
    staged = hasStagedChange(current);
  }

  $('files').replaceChildren();
  for (const [isStaged, title, matches] of [
    [false, '작업 중', hasWorkingChange],
    [true, '커밋할 변경', hasStagedChange],
  ]) {
    const group = el('section', undefined, 'change-group');
    group.dataset.area = isStaged ? 'staged' : 'working';
    group.setAttribute('aria-label', title);
    const members = files.filter(matches);
    const heading = el('h2', `${title} · ${members.length}`, 'change-group-title');
    group.append(heading);
    for (const file of members) {
      const active = selected === file.name && staged === isStaged;
      const row = el('div', undefined, 'file' + (active ? ' active' : ''));
      const name = el('button', undefined, 'file-select');
      name.type = 'button';name.dataset.fileName=file.name;
      name.title = file.original ? `${file.original} → ${file.name}` : file.name;
      name.setAttribute('aria-label', `${file.name} · ${title}`);
      name.setAttribute('aria-pressed', String(active));
      name.append(el('span', file.name, 'change-path'));
      const partial = hasStagedChange(file) && hasWorkingChange(file);
      const status = file.conflict ? '충돌' : partial ? '일부 스테이징' : file.untracked ? '새 파일' :
        ({ A: '추가', D: '삭제', R: '이름 변경', C: '복사', T: '형식 변경' }[isStaged ? file.index : file.worktree] || '수정');
      name.append(el('small', status, 'change-state'));
      name.onclick = () => selectChange(file.name, isStaged);
      row.append(name);
      if (!file.conflict) {
        const action = el('button', isStaged ? '해제' : '스테이징', 'file-stage');
        action.type = 'button';
        action.setAttribute('aria-label', `${file.name} ${isStaged ? '스테이징 해제' : '파일 전체 스테이징'}`);
        action.title = isStaged ? '이 파일의 스테이징된 변경을 모두 해제합니다.' : '이 파일의 남은 변경을 모두 스테이징합니다.';
        action.disabled = working;
        action.onclick = async () => {
          await mutate('stage', { name: file.name, value: !isStaged });
          // Keep keyboard users at the moved file instead of dropping focus to the page.
          const area = selected === file.name && staged ? 'staged' : 'working';
          const buttons = $('files').querySelectorAll(`[data-area="${area}"] .file-select`);
          [...buttons].find(button => button.dataset.fileName === file.name)?.focus();
        };
        row.append(action);
      }
      group.append(row);
    }
    if (!members.length) group.append(el('p', isStaged ? '스테이징한 변경이 없습니다.' : '남은 작업 폴더 변경이 없습니다.', 'change-empty'));
    $('files').append(group);
  }
  syncDiffControls();
}

function updateCommitControls() {
  const files = state?.files || [];
  const count = files.filter(hasStagedChange).length;
  const conflicts = files.filter(file => file.conflict).length;
  const message = $('message').value.trim();
  $('commit').disabled = working || !count || !!conflicts || !message;
  $('commit').textContent = `스테이징한 변경 커밋${count ? ` · ${count}개 파일` : ''}`;
  const reason = conflicts ? `충돌 ${conflicts}개를 먼저 해결하세요.` : !count ? '작업 중 영역에서 커밋할 변경을 스테이징하세요.' :
    `스테이징한 ${count}개 파일의 변경만 커밋합니다.${files.some(hasWorkingChange) ? ' 작업 중 영역의 변경은 남습니다.' : ''}${message ? '' : ' 커밋 메시지를 입력하세요.'}`;
  $('commitSummary').textContent = reason;
  $('commit').title = reason;
  $('commit').setAttribute('aria-describedby', 'commitSummary');
}

function syncDiffControls() {
  const file = state?.files.find(file => file.name === selected);
  for (const button of document.querySelectorAll('[data-diff-area]')) {
    const isStaged = button.dataset.diffArea === 'staged';
    button.classList.toggle('active', staged === isStaged);
    button.setAttribute('aria-pressed', String(staged === isStaged));
    button.disabled = working || !file || (isStaged ? !hasStagedChange(file) : !hasWorkingChange(file));
  }
  const hint = $('diffAreaHint');
  if (hint) hint.textContent = !file ? '파일을 선택하면 해당 영역의 변경을 보여줍니다.' : file.conflict ? '충돌 파일 · 해결 후 스테이징하세요.' :
    staged ? 'HEAD → 인덱스 · 이 변경이 커밋됩니다.' : '인덱스 → 작업 폴더 · 이 변경은 아직 커밋되지 않습니다.';
  for (const button of document.querySelectorAll('[data-file-action]')) {
    button.disabled = working || !file || (button.dataset.fileAction === 'conflictRead' && !file.conflict) || (button.dataset.fileAction === 'discardPreview' && (staged || file?.untracked || file?.conflict || file?.original || file?.worktree !== 'M'));
  }
}

const diffAreas = el('div', undefined, 'diff-areas ui-segmented');
diffAreas.setAttribute('role', 'group');
diffAreas.setAttribute('aria-label', 'Diff 영역');
for (const [area, label] of [['working', '작업 폴더'], ['staged', '스테이징']]) {
  const button = el('button', label);
  button.type = 'button';
  button.dataset.diffArea = area;
  button.onclick = () => selectChange(selected, area === 'staged');
  diffAreas.append(button);
}
$('filename').parentElement.lastElementChild.replaceWith(diffAreas);
const diffAreaHint = el('p', undefined, 'diff-area-hint');
diffAreaHint.id = 'diffAreaHint';
$('diff').before(diffAreaHint);
const changesControls = controls;
controls = function () { changesControls(); syncDiffControls(); };
controls();
