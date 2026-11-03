(() => {
// UI copy only. Repository names, commit messages, code, paths and command output stay verbatim.
const pairs=`
폴더 이름|Folder name
폴더 이름을 확인하세요.|Check the folder name.
함께 반영할 파일|Files included in this amendment
스테이징된 변경 없음 · 메시지만 수정|No staged changes · Message only
위치 선택|Choose location
워크트리 위치 선택|Choose worktree location
선택한 위치 안에 새 작업 폴더를 만듭니다.|A new working folder will be created inside this location.
해당 참조의 커밋을 찾을 수 없습니다. 브랜치·태그 이름이나 HEAD~2 같은 참조를 확인하세요.|No commit was found for this reference. Check the branch or tag name, or a reference such as HEAD~2.
시작점 선택|Choose starting point
기준 브랜치|Starting branch
참조 직접 입력|Enter a reference
직접 입력|Enter manually
참조 확인|Check reference
적용할 브랜치|Apply to branch
가져올 브랜치|Source branch
브랜치를 선택하세요|Choose a branch
브랜치를 선택하면 가져올 커밋이 표시됩니다.|Choose a source branch to see its commits.
현재 브랜치에 없는 커밋|Commits not in the current branch history
최근 500개 · 현재 브랜치에 없는 커밋|Latest 500 commits outside the current branch history
가져올 커밋이 없습니다.|No commits to bring over.
선택한 커밋|Selected commit
메시지·작성자·해시 검색|Search message, author or hash
작업 대상 브랜치가 변경되었습니다. 다시 열어주세요.|The target branch changed. Reopen this action.
변경 내용 확인|Review changes
여러 충돌을 직접 편집했습니다. 결과를 확인하거나 되돌리세요.|Multiple conflicts were edited together. Review the result or undo.
충돌 편집기 열기|Open conflict editor
현재 변경|Current changes
병합 결과|Merge result
병합할 변경|Incoming changes
현재 변경 코드|Current changes code
병합할 변경 코드|Incoming changes code
병합 결과 편집|Edit merge result
이전 충돌|Previous conflict
다음 충돌|Next conflict
현재 충돌 해결|Mark current conflict resolved
결과 저장·스테이징|Save result and stage
저장 대기 · 아직 스테이징되지 않았습니다.|Ready to save · Not staged yet.
충돌 마커가 남아 있습니다.|Conflict markers remain.
충돌 해결 결과를 저장하고 스테이징했습니다.|Saved and staged the merge result.

사용 가이드|User guide
가이드 검색|Search guide
가이드 목차|Guide contents
검색 결과가 없습니다.|No search results.
크게|Large
시스템 고정폭|System monospace
글꼴 및 크기|Fonts and sizing
UI 글자 크기|UI font size
코드 글자 크기|Code font size
코드 글꼴|Code font
코드 줄 간격|Code line spacing
화면 배율|Display scale
촘촘하게|Compact
기본|Default
넓게|Spacious
글꼴 및 크기 초기화|Reset fonts and sizing
전체 이력 보기|Show all history

이력 필터 해제|Clear history filter
WORKSPACE|Workspace
LOCAL|Local branches
REMOTE|Remote branches
COMMIT|Commit
NEWPROJECT|New project
NEW PROJECT|New project
작업 공간|Workspace

연동|Integrations
태그 없음|No tags
스태시 없음|No stashes
TAGS|Tags
STASHES|Stashes
로컬 브랜치 없음|No local branches

설정 · ⌘/Ctrl+,|Settings · ⌘/Ctrl+,
이전 변경으로 이동 · Alt+↑|Go to previous change · Alt+↑
다음 변경으로 이동 · Alt+↓|Go to next change · Alt+↓
변경 전후를 좌우로 나란히 비교합니다.|Compare before and after side by side.
삭제된 줄과 추가된 줄을 한 화면에서 비교합니다.|Compare removed and added lines in one view.
좌우 코드의 스크롤 위치를 함께 이동합니다.|Keep both code panes at the same scroll position.

여는 중…|Opening…
복제 중…|Cloning…
만드는 중…|Creating…
폴더를 찾을 수 없습니다. 경로를 확인하세요.|Folder not found. Check the path.
Git 저장소가 아닌 폴더입니다.|This folder is not a Git repository.
폴더에 접근할 권한이 없습니다.|You do not have permission to access this folder.
복제 대상은 아직 존재하지 않는 폴더여야 합니다.|The clone destination must be a folder that does not yet exist.

표시할 커밋이 없습니다.|No commits to display.

로컬 브랜치|Local branches
원격 브랜치|Remote branches

작업 공간으로 돌아가기|Back to workspace
설정 항목|Settings sections
테마|Theme
시스템 설정 사용|Use system appearance

그래프에 표시|Show in graph
그래프에서 숨기기|Hide in graph
이 브랜치만 보기|Solo this branch
단독 보기 종료|Stop soloing
선택 해제|Clear selection
선택한 커밋 Cherry-pick|Cherry-pick selected commits
여러 커밋 선택|Multiple commits selected
여러 커밋 Cherry-pick|Cherry-pick multiple commits
적용 순서를 확인하는 중…|Checking application order…
적용 대상|Target branch
현재 브랜치에 적용|Apply to current branch
서로 다른 커밋을 2개에서 100개까지 선택하세요.|Select 2 to 100 distinct commits.
병합 커밋은 여러 커밋 Cherry-pick에서 제외하세요.|Exclude merge commits from multi-commit cherry-pick.
현재 브랜치가 변경되었습니다. 적용 대상을 다시 확인하세요.|The current branch changed. Review the target again.

워크트리 만들기|Create worktree
등록된 worktree가 아닙니다.|This worktree is not registered.
워크트리|Worktrees
워크트리 관리|Manage worktrees
자동 Fetch|Automatic fetch
끄기|Off
5분|5 minutes
10분|10 minutes
30분|30 minutes
활성 프로젝트의 원격 브랜치와 이력을 갱신합니다. Pull이나 병합은 실행하지 않습니다.|Refresh remote branches and history for the active project. Does not pull or merge.
원격 태그를 갱신하지 못했습니다.|Could not refresh remote tags.
원격 저장소|Remote repositories
선택한 원격 저장소에 이슈를 게시합니다.|Post an issue to the selected remote repository.
리뷰 · 이슈 · CI|Reviews · Issues · CI
웹 주소 없음|No web address
브랜치 또는 폴더 검색|Search branches or folders
상태 확인 불가|Status unavailable
검색 결과가 없습니다.|No matching results.
현재 프로젝트|Current project
기본 작업 폴더|Main worktree
잠김|Locked
변경 없음|No changes
프로젝트 탭으로 열기|Open in project tab
작업 폴더 열기|Open working directory
잠금|Lock
잠금 해제|Unlock
삭제|Delete
작업 폴더 삭제|Delete working directory
만들기|Create
시작 참조|Starting reference
새 브랜치|New branch
새 작업 폴더 절대 경로|Absolute path for new worktree
이 작업 폴더를 삭제합니다. 브랜치와 커밋은 유지됩니다.|Delete this working directory. The branch and commits are kept.
변경이 없고 잠금이 해제된 작업 폴더만 삭제할 수 있습니다.|Only clean, unlocked working directories can be deleted.
열려 있는 프로젝트 탭을 먼저 닫으세요.|Close the open project tab first.
기본 또는 현재 작업 폴더는 삭제할 수 없습니다.|The main or current worktree cannot be deleted.
잠금을 해제한 뒤 삭제하세요.|Unlock the worktree before deleting it.
작업 폴더 상태를 읽을 수 없습니다.|Cannot read the working directory status.
커밋 초안을 정리한 뒤 작업 폴더를 전환하세요.|Finish the commit draft before switching working directories.

병합 전 충돌 검사|Check merge conflicts
검사할 참조|Reference to inspect
검사|Inspect
병합 가능 여부를 검사하는 중…|Checking merge compatibility…
이미 현재 브랜치에 포함되어 있습니다.|Already included in the current branch.
충돌 없이 빠른 앞으로 이동할 수 있습니다.|Can fast-forward without conflicts.
자동 병합할 수 있습니다.|Can merge automatically.
병합 충돌이 예상됩니다.|Merge conflicts detected.
공통 이력이 없어 병합할 수 없습니다.|Cannot merge unrelated histories.
작업 중인 변경은 검사에 포함되지 않습니다. 병합 전 커밋하거나 스태시에 보관하세요.|Uncommitted changes are excluded. Commit or stash them before merging.
상세 결과|Details
검사 이후 브랜치가 변경되었습니다. 다시 검사하세요.|Branches changed since inspection. Inspect again.
사용자 지정 병합 드라이버가 있어 자동 검사를 지원하지 않습니다.|Preview is unavailable with custom merge drivers.
병합 전 검사는 Git 2.38 이상이 필요합니다.|Merge inspection requires Git 2.38 or newer.
검사할 참조가 올바르지 않습니다.|Invalid reference to inspect.
Git 병합 검사 결과를 읽을 수 없습니다.|Could not read the merge inspection result.

선택 되돌리기|Undo selection
최종 결과|Final result
왼쪽 사용|Use left
오른쪽 사용|Use right
양쪽 사용|Use both
분기 전 원본|Base version before divergence
모든 충돌을 선택했습니다.|All conflicts resolved.
충돌 마커 구조를 확인하세요.|Check the conflict marker structure.

설정|Settings
모양|Appearance
언어|Language
밝게|Light
어둡게|Dark
시스템|System
앱 전체에 바로 적용됩니다.|Changes apply to all projects immediately.
불러온 이력 안에서 검색합니다.|Search is limited to loaded history.

비교 보기 방식|Comparison layout
원격의 최신 커밋과 브랜치 정보를 가져옵니다. 현재 브랜치에는 적용하지 않습니다.|Fetch remote commits and branch information without updating the current branch.
원격 변경을 가져와 현재 브랜치에 적용합니다. 빠른 앞으로 이동만 허용합니다.|Fetch upstream changes and integrate them into the current branch. Fast-forward only.
현재 브랜치의 커밋을 원격 저장소로 올립니다.|Push the current branch's commits to the remote repository.

공백과 탭의 차이도 변경으로 표시합니다.|Include spaces and tabs when highlighting changes.
공백·탭만 달라진 줄은 강조하지 않습니다. 파일 내용은 바뀌지 않습니다.|Hide highlights on lines differing only in spaces or tabs. File contents are unchanged.
파일의 변경 중 원하는 블록이나 줄만 골라 스테이징합니다.|Stage only the hunks or lines you select from this file.
실제 작업 폴더 파일을 수정·저장합니다. 자동으로 스테이징하거나 커밋하지 않습니다.|Edit and save the actual working directory file. Saving does not stage or commit it.

선택된 커밋 없음|No commit selected

변경 없는 줄|Unchanged line

바뀐 부분 강조|Highlight changed text
변경 없는 줄 접기|Collapse unchanged lines
수정된 줄에서 달라진 글자·단어만 더 진하게 표시합니다.|Emphasize only the characters and words that changed within modified lines.
변경 없는 긴 구간을 접고 변경 앞뒤 3줄을 남깁니다. 접힌 줄 수를 누르면 다시 펼칩니다.|Collapse long unchanged sections, keeping three context lines. Click the folded line count to expand.
− 삭제된 줄|− Removed lines
+ 추가된 줄|+ Added lines
번호: 변경 전 / 변경 후|Line numbers: before / after
통합 코드 비교|Unified code comparison

이전 변경 · Alt+↑|Previous change · Alt+↑
다음 변경 · Alt+↓|Next change · Alt+↓

공백 비교 방식|Whitespace comparison
공백 포함|Include whitespace
줄 내 공백 무시|Ignore inline whitespace
단어 강조|Highlight words
변경 주변만|Changes only
스크롤 동기화|Sync scrolling
변경 위치|Change locations
인덱스|Index
충돌 편집기에서 파일을 먼저 해결하세요.|Resolve the file in the conflict editor first.

· 작업 폴더|· Working directory
· 커밋할 변경|· Staged

프로젝트 홈|Project home
새 프로젝트 탭|New project tab
열린 프로젝트|Open projects
프로젝트 탭 닫기|Close project tab
프로젝트 열기|Open project
＋ 프로젝트 열기|＋ Open project
저장소 복제|Clone repository
최근 프로젝트|Recent projects
차분하게 살펴보고,|Explore with clarity,
명확하게 기록하세요.|commit with confidence.
흩어진 프로젝트를 하나의 작업 공간에.|Bring your projects into one workspace.
브랜치를 따라가고, 변경을 검토하고, 다음 커밋을 준비하세요.|Follow branches, review changes and prepare your next commit.
내 컴퓨터에서 시작합니다. 계정 연결 없이도 사용할 수 있습니다.|Start locally. No account connection required.
로컬 우선. 당신의 흐름대로.|Local first. Work your way.
⌘T 새 프로젝트　·　⌘K 작업 검색|⌘T New project · ⌘K Command palette
프로젝트 창 닫기|Close project dialog
프로젝트 추가 방식|Add project method
로컬 열기|Open local
복제|Clone
새로 만들기|Initialize
저장소 URL|Repository URL
프로젝트 폴더|Project folder
찾아보기|Browse
기존 Git 저장소를 새 탭으로 엽니다.|Open an existing Git repository in a new tab.
커밋 초안을 보관할까요?|Keep your commit draft?
탭을 닫으면 이 탭의 커밋 메시지 초안이 사라집니다. 파일 변경과 스테이징 상태는 저장소에 남습니다.|Closing this tab discards its commit draft. File changes and staging remain in the repository.
계속 작성|Keep editing
초안 버리고 탭 닫기|Discard draft and close tab
취소|Cancel
닫기|Close
실행|Run
저장|Save
선택하세요|Select an option
항목 선택|Select an option
항목 없음|No options
검색…|Search…
일치하는 항목이 없습니다.|No matching options.
작업 검색 ⌘K|Commands ⌘K
작업 검색|Search commands
Git 작업|Git commands
Git 작업 검색|Search Git commands
저장소 열기|Open repository
최근 저장소|Recent repositories
저장소 새로고침|Refresh repository
새로고침|Refresh
변경 사항|Changes
커밋 이력|Commit history
전체 이력|All history
전체 이력 · Local + Remote|All history · Local + Remote
브랜치 찾기|Find branches
브랜치 선택|Select branch
브랜치 / 태그|Branch / Tag
그래프|Graph
커밋 메시지|Commit message
커밋 검색|Search commits
작성자|Author
커밋|Commit
날짜|Date
불러온 이력에서 메시지, 작성자, SHA 검색|Search loaded history by message, author or SHA
그래프 보기|Show graph
그래프로 돌아가기|Back to graph
작업 중인 변경 보기|Show working changes
작업 중|Unstaged
커밋할 변경|Staged
작업 폴더|Working directory
스테이징|Stage
스테이징 해제|Unstage
해제|Unstage
전체 스테이징|Stage all
전체 해제|Unstage all
파일 전체 스테이징|Stage file
스테이징한 변경 커밋|Commit staged changes
변경 내용을 한 줄로 요약하세요|Summarize your changes
상세 설명 (선택)|Description (optional)
커밋 상세 설명|Commit description
작업 중 영역에서 커밋할 변경을 스테이징하세요.|Stage changes from the working directory to commit.
스테이징한 변경이 없습니다.|No staged changes.
남은 작업 폴더 변경이 없습니다.|No remaining working directory changes.
제목과 상세 설명은 합쳐서 4,000자 이내로 입력하세요.|Keep the summary and description within 4,000 characters.
커밋을 생성했습니다.|Commit created.
변경을 적용했습니다.|Changes applied.
파일을 선택하세요|Select a file
파일을 선택하세요.|Select a file.
파일을 선택하면 해당 영역의 변경을 보여줍니다.|Select a file to review changes in this area.
새 파일|New file
추가|Added
수정|Modified
삭제|Deleted
이름 변경|Renamed
복사|Copied
형식 변경|Type changed
일부 스테이징|Partially staged
충돌|Conflict
HEAD → 인덱스 · 이 변경이 커밋됩니다.|HEAD → Index · These changes will be committed.
인덱스 → 작업 폴더 · 이 변경은 아직 커밋되지 않습니다.|Index → Working directory · These changes are not staged.
충돌 파일 · 해결 후 스테이징하세요.|Conflicted file · Resolve before staging.
Diff 영역|Diff area
블록 스테이징|Stage hunks
편집|Edit
좌우 비교|Split diff
충돌 해결|Resolve conflicts
부모 커밋|Parents
커밋 상세 비교 부모|Commit comparison parent
비교 기준 부모|Comparison parent
변경 파일 검색|Search changed files
변경 파일을 불러오는 중…|Loading changed files…
파일 내용을 불러오는 중…|Loading file contents…
이 부모와 비교한 파일 변경이 없습니다.|No file changes compared with this parent.
커밋 변경 파일|Changed files
크게 보기|Expand
좌우 보기|Split
통합 보기|Unified
이전 변경|Previous change
다음 변경|Next change
세로 스크롤 동기화|Sync vertical scrolling
Before · 커밋 이전|Before · Previous commit
After · 커밋 이후|After · Selected commit
빈 트리|Empty tree
없음|None
빈 파일입니다.|Empty file.
텍스트 파일|Text file
바이너리 또는 UTF-8이 아닌 파일입니다.|Binary or non-UTF-8 file.
1MB 또는 20,000줄을 초과하여 미리보기를 생략합니다.|Preview unavailable for files over 1 MB or 20,000 lines.
내용 변경 없음 · 이름 또는 파일 속성만 변경되었습니다.|No content changes · Only the name or file properties changed.
이쪽에는 파일이 없습니다.|No file on this side.
새 파일 · 이전 내용 없음|New file · No previous content
파일 삭제 · 이후 내용 없음|Deleted file · No new content
파일 끝에 줄바꿈 없음|No newline at end of file
심볼릭 링크 대상 경로|Symbolic link target
수정된 줄|Modified line
추가된 줄|Added line
삭제된 줄|Deleted line
브랜치 패널 너비|Branch panel width
상세 패널 너비|Details panel width
커밋 전후 비교|Commit comparison
커밋 취소|Undo commit
마지막 커밋 되돌리기|Undo last commit
마지막 커밋을 취소하고 변경을 스테이징에 남깁니다.|Undo the last commit and keep its changes staged.
브랜치 만들기|Create branch
브랜치 전환|Switch branch
브랜치 이름 변경|Rename branch
브랜치 삭제|Delete branch
브랜치 이름|Branch name
전환할 브랜치|Branch to check out
기존 브랜치|Current branch name
새 이름|New name
삭제할 브랜치|Branch to delete
시작 커밋|Starting commit
시작 참조|Starting reference
새 브랜치|New branch
원격 추가|Add remote
원격 제거|Remove remote
원격 주소 보기|Remote URLs
원격 이름|Remote name
원격|Remote
추적 브랜치 없음|No upstream branch
먼저 원격 저장소를 연결하세요.|Add a remote first.
추적 브랜치를 먼저 설정하세요.|Set an upstream branch first.
추적 브랜치의 변경 가져오기|Pull changes from upstream
원격 브랜치 없음|No remote branches
Stash 만들기|Stash
Stash 적용|Apply Stash
Stash 적용 후 제거|Pop Stash
Stash Pop|Pop Stash
Stash 삭제|Drop Stash
Stash Diff|Stash Diff
설명|Description
추적하지 않는 새 파일도 보관합니다.|Includes untracked files.
선택한 Stash를 삭제합니다. 이 작업은 취소할 수 없습니다.|Delete the selected stash. This cannot be undone.
태그 만들기|Create tag
로컬 태그 삭제|Delete local tag
태그|Tag
태그 이름|Tag name
대상 커밋|Target commit
설명 (비우면 lightweight)|Message (empty for a lightweight tag)
병합|Merge
리베이스|Rebase
현재 브랜치에 합칠 참조|Reference to merge into the current branch
기준 브랜치|Base branch
기준 참조|Base reference
비교 참조|Compare reference
커밋 SHA|Commit SHA
작업 계속|Continue operation
진행 중인 작업 중단|Abort operation
충돌 해결됨으로 표시|Mark conflict resolved
외부 편집기로 수정한 파일|File resolved in an external editor
파일 이력|File history
참조 비교|Compare references
두 커밋 비교|Compare commits
이전 참조|Before reference
이후 참조|After reference
추적 파일|Tracked file
Worktree 목록|List worktrees
Worktree 만들기|Create worktree
Worktree 제거|Remove worktree
Worktree 잠금|Lock worktree
Worktree 잠금 해제|Unlock worktree
새 작업 폴더 절대 경로|Absolute path for new worktree
제거할 작업 폴더|Worktree to remove
저장소 초기화|Initialize repository
폴더 절대 경로|Absolute folder path
새 폴더 절대 경로|Absolute path for new folder
저장소|Repository
브랜치|Branches
동기화|Sync
보관|Stashes and tags
파일 · Worktree|Files and worktrees
고급 편집|Advanced editing
확장 · 설정|Extensions and settings
부분 스테이징|Partial staging
파일|File
파일 편집|Edit file
충돌 편집기|Conflict editor
충돌 파일|Conflicted file
좌우 파일 비교|Compare file sides
파일 무시|Ignore file
추적하지 않는 파일 경로|Untracked file path
인터랙티브 리베이스|Interactive rebase
편집할 커밋 바로 이전 참조|Reference before commits to edit
마지막 커밋 수정|Amend last commit
새 커밋 메시지|New commit message
전체 이력 메시지 검색|Search all commit messages
검색어|Search query
Submodule 상태|Submodule status
Submodule 초기화·갱신|Initialize / update submodules
Git LFS 상태|Git LFS status
저장소 작성자 설정|Repository author settings
고급 Git 편집|Advanced Git editor
작업 폴더 보기|Show working directory
스테이징된 변경 보기|Show staged changes
이 영역에는 변경 블록이 없습니다.|No changed hunks in this area.
이 블록 스테이징|Stage this hunk
이 블록 스테이징 해제|Unstage this hunk
선택한 줄 스테이징|Stage selected lines
선택한 줄 스테이징 해제|Unstage selected lines
파일 편집 내용|File contents
파일 저장|Save file
저장하고 해결됨으로 표시|Save and mark resolved
위로|Move up
아래로|Move down
계획대로 리베이스|Apply rebase plan
이 저장소의 작성자|Repository author
이름|Name
이메일|Email
아직 연 저장소가 없습니다.|No recent repositories.
브랜치 작업 선택|Choose branch operation
브랜치 연결|Connect branches
현재 브랜치에 적용할 작업을 선택하세요. 다음 화면에서 내용을 검토하고 실행합니다.|Choose an operation for the current branch. Review the details before running it.
대상 브랜치를 먼저 체크아웃해야 합니다. 작업 폴더가 깨끗한지 확인한 뒤 전환하세요.|Check out the target branch first. Your working directory must be clean.
폴더의 절대 경로를 입력하세요.|Enter an absolute folder path.
새 저장소 만들기|Create repository
새 프로젝트의 절대 경로|Absolute path for new project
아직 존재하지 않는 새 폴더 경로를 입력하세요.|Enter a new folder path that does not exist yet.
선택한 폴더에 main 브랜치의 Git 저장소를 만듭니다.|Initialize a Git repository with a main branch in this folder.
첫 프로젝트를 열어 보세요. 최근 작업한 저장소가 여기에 모입니다.|Open your first project. Recent repositories will appear here.
프로젝트 목록을 저장하지 못했습니다.|Could not save the project list.
프로젝트 경로를 확인하세요.|Check the project path.
프로젝트는 최대 50개까지 열 수 있습니다.|You can open up to 50 projects.
진행 중인 Git 작업이 끝난 뒤 탭을 닫아 주세요.|Wait for the Git operation to finish before closing this tab.
다시 시도|Retry
다른 프로젝트 열기|Open another project
프로젝트를 열지 못했습니다. 폴더 경로와 Git 저장소인지 확인하세요.|Could not open the project. Check that the path is a Git repository.
프로젝트를 열지 못했습니다. 경로를 확인하세요.|Could not open the project. Check the path.
먼저 저장소를 여세요.|Open a repository first.
저장소를 여세요|Open a repository
Git 작업 폴더의 절대 경로|Absolute path to Git working directory
로컬 저장소 열기|Open local repository
열기|Open
저장소 선택|Choose repository
선택 창 닫기|Close repository picker
목록 검색|Search list
이름으로 검색|Search by name
저장소를 열어 주세요|Open a repository
저장소를 열어 브랜치와 커밋 흐름을 확인하세요.|Open a repository to explore its branches and history.
아직 커밋이 없습니다.|No commits yet.
일치하는 커밋이 없습니다.|No matching commits.
일치하는 파일 없음|No matching files
불러오는 중…|Loading…
GitHub 이슈 만들기|Create GitHub issue
Draft PR 만들기|Create draft PR
PR 검사 결과|PR checks
PR 댓글 게시|Post PR comment
PR 변경 요청|Request PR changes
PR 승인 리뷰|Approve PR
PR 체크아웃|Check out PR
PR 번호|PR number
이슈 번호|Issue number
이슈 댓글 게시|Post issue comment
제목|Title
본문|Body
댓글|Comment
리뷰|Review
이미 Push한 브랜치|Published branch
검사|Checks
체크아웃|Check out
표시할 항목이 없습니다.|No items to display.
작업 폴더가 깨끗한 경우에만 전환합니다.|Switch only when the working directory is clean.
병합된 로컬 브랜치만 삭제합니다.|Only merged local branches can be deleted.
원격 설정과 해당 원격 추적 참조를 제거합니다.|Remove the remote configuration and its tracking references.
추적 브랜치에서 fast-forward만 허용합니다. 분기되었다면 먼저 병합하거나 리베이스하세요.|Only fast-forward pulls are allowed. Merge or rebase diverged branches first.
현재 브랜치를 원격의 같은 이름 브랜치로 전송합니다. 강제 Push는 하지 않습니다.|Push the current branch to the same branch name on the remote. No force push.
현재 브랜치의 커밋 해시가 변경됩니다. 공유한 브랜치에서는 신중하게 실행하세요.|Rebase changes commit hashes. Use care on shared branches.
변경을 반대로 적용하는 새 커밋을 만듭니다.|Create a new commit that reverses these changes.
충돌 파일을 수정하고 해결됨으로 표시한 뒤 계속하세요.|Resolve and stage conflicting files before continuing.
현재 병합·리베이스 등의 변경을 취소합니다. 충돌 해결 중 수정한 내용을 잃을 수 있습니다.|Abort the current operation. Edits made while resolving conflicts may be lost.
파일을 스테이징합니다. 충돌 내용을 직접 해결했는지 확인하세요.|Stage the file. Make sure all conflicts have been resolved.
HEAD를 부모 커밋으로 이동하고 변경은 스테이징에 남깁니다. 이미 공유한 커밋에는 Revert를 사용하세요.|Move HEAD to its parent and keep changes staged. Use Revert for published commits.
선택한 작업 폴더를 삭제합니다. 수정 내용이 있거나 잠긴 worktree는 Git이 거부합니다.|Remove the selected worktree. Git rejects dirty or locked worktrees.
스테이징된 변경도 마지막 커밋에 포함됩니다. 이전 커밋 해시는 복구용 참조에 보관합니다.|Include staged changes in the last commit. Its previous hash is kept in a backup reference.
저장소에 설정된 하위 저장소를 다운로드합니다.|Download the repository's configured submodules.
아래 결과를 편집하세요. 충돌 마커를 제거한 뒤 저장하면 해결됨으로 표시합니다.|Edit the result below. Remove conflict markers, then save to mark it resolved.
위에서 아래 순서로 적용합니다. 공유한 커밋의 해시가 바뀝니다. 실행 전 상태는 refs/pgit/backups에 보관합니다.|Apply from top to bottom. Shared commit hashes will change. The previous state is saved in refs/pgit/backups.
Git에 설정된 키로 커밋 서명|Sign commits with your configured Git key
서명 키와 에이전트는 기존 Git 설정을 사용합니다.|Uses the signing key and agent from your Git configuration.
이 기기의 GitHub CLI 로그인과 origin 원격을 사용합니다.|Uses this device's GitHub CLI login and origin remote.
GitHub에 Draft PR을 게시합니다. gh에 로그인된 계정을 사용합니다.|Publish a draft PR using the account signed into gh.
GitHub에 승인 리뷰를 게시합니다.|Post an approval review to GitHub.
GitHub에 변경 요청 리뷰를 게시합니다.|Post a change-request review to GitHub.
입력한 댓글을 GitHub에 게시합니다.|Post this comment to GitHub.
origin 저장소에 이슈를 게시합니다.|Create an issue in the origin repository.
이 파일의 남은 변경을 모두 스테이징합니다.|Stage all remaining changes in this file.
이 파일의 스테이징된 변경을 모두 해제합니다.|Unstage all staged changes in this file.
현재 체크아웃된 브랜치|Currently checked-out branch
리뷰 스레드|Review threads
병합 실행|Merge changes
줄 댓글|Line comment
댓글 내용|Comment content
답글|Reply
다시 열기|Reopen
해결됨으로 표시|Mark resolved
병합 준비가 완료되었습니다.|Ready to merge.
병합 방식|Merge method
대상 브랜치와 커밋을 확인했습니다.|I have checked the target branch and commit.
지금 병합|Merge now
병합이 완료되었습니다.|Merge completed.
열려 있는 정식 PR/MR만 병합할 수 있습니다.|Only open, non-draft PRs or MRs can be merged.
완료되지 않았거나 실패한 검사가 있습니다.|Some checks are pending or failed.
병합 권한을 확인할 수 없습니다.|Merge permission could not be confirmed.
사용할 수 있는 병합 방식이 없습니다.|No merge method is available.
현재 커밋의 파이프라인이 통과하지 않았습니다.|The current commit pipeline has not passed.
필수 파이프라인이 통과하지 않았습니다.|The required pipeline has not passed.
상세 보기|View details
목록으로|Back to list
개요|Overview
변경 파일|Changed files
검사 결과|Check results
리뷰 작성|Write a review
더 불러오기|Load more
설명이 없습니다.|No description.
서버가 이 파일의 Diff를 제공하지 않습니다.|The server did not provide a diff for this file.
서버가 일부 변경 파일을 생략했습니다.|The server omitted some changed files.
Diff 표시 한도를 초과했습니다.|Diff display limit reached.
리뷰 종류|Review type
리뷰 내용|Review content
댓글 게시|Post comment
승인|Approve
변경 요청|Request changes
게시|Publish
입력한 리뷰를 GitHub에 게시합니다.|Publish this review to GitHub.
입력한 리뷰를 GitLab에 게시합니다.|Publish this review to GitLab.
리뷰를 게시했습니다.|Review published.
커밋으로 Reset|Reset to commit
대상 커밋|Target commit
Reset 실행 취소·다시 실행|Undo or redo Reset
Reset 방식|Reset mode
Soft · 변경을 스테이징에 유지|Soft · Keep changes staged
Mixed · 변경을 작업 폴더에 유지|Mixed · Keep changes in working folder
Hard · 대상 커밋의 파일로 변경|Hard · Replace files with target commit
Hard Reset의 파일 변경을 확인했습니다.|I have reviewed the file changes for Hard Reset.
Reset 실행|Run Reset
실행 취소할 Reset이 없습니다.|No Reset to undo.
Reset 실행 취소|Undo Reset
Reset 다시 실행|Redo Reset
Reset 이후 저장소가 변경되었습니다. 자동 실행 취소를 할 수 없습니다.|The repository changed after Reset. Automatic undo is unavailable.
다시 버리기|Discard again
이 블록 버리기|Discard this hunk
선택한 줄 버리기|Discard selected lines
Pull 방식|Pull strategy
파일 변경 버리기|Discard file changes
변경 버리기|Discard changes
버린 변경 복구|Recover discarded changes
복구|Restore
복구할 변경이 없습니다.|No changes to recover.
스테이징되지 않은 파일 변경을 버립니다. 버린 내용은 복구 목록에 보관합니다.|Discard unstaged file changes and keep a recovery copy.
MR 번호|MR number
MR 파이프라인|MR pipelines
MR 체크아웃|Check out MR
Draft MR 만들기|Create draft MR
MR 댓글 게시|Post MR comment
GitLab 이슈 만들기|Create GitLab issue
선택한 GitLab 원격에 Draft MR을 게시합니다.|Publish a draft MR to the selected GitLab remote.
입력한 댓글을 GitLab에 게시합니다.|Post this comment to GitLab.
선택한 GitLab 원격에 이슈를 게시합니다.|Create an issue in the selected GitLab remote.
`;
const en=Object.fromEntries(pairs.trim().split('\n').filter(line=>line.includes('|')).map(line=>line.split('|')));
const reverse=Object.fromEntries(Object.entries(en).map(([key,value])=>[value,key]));
const ko={'Stash 만들기':'스태시 저장','Stash 적용':'스태시 적용','Stash 적용 후 제거':'스태시 적용 후 삭제','Stash Pop':'스태시 적용 후 삭제','Stash 삭제':'스태시 삭제','Stash Diff':'스태시 변경 보기',Stash:'스태시','Cherry-pick':'체리픽',Revert:'되돌림 커밋',Blame:'줄별 작성 이력',Reflog:'참조 이동 기록',WORKSPACE:'작업 공간',LOCAL:'로컬 브랜치',REMOTE:'원격 브랜치',TAGS:'태그',STASHES:'스태시',COMMIT:'커밋',NEWPROJECT:'새 프로젝트','NEW PROJECT':'새 프로젝트','GitHub Pull Requests':'GitHub 풀 리퀘스트','GitHub Issues':'GitHub 이슈','Worktree 목록':'워크트리 목록','Worktree 만들기':'워크트리 만들기','Worktree 제거':'워크트리 제거','Worktree 잠금':'워크트리 잠금','Worktree 잠금 해제':'워크트리 잠금 해제','Submodule 상태':'서브모듈 상태','Submodule 초기화·갱신':'서브모듈 초기화·갱신','Git LFS 상태':'Git LFS 상태'};
const templates=[
 [/^브랜치: (.+)$/,name=>`Branch: ${name}`],[/^태그: (.+)$/,name=>`Tag: ${name}`],[/^커밋: (.+)$/,name=>`Commit: ${name}`],
 [/^선택한 커밋 · (\d+)$/,n=>`Selected commits · ${n}`],
 [/^숨긴 브랜치 표시 · (\d+)$/,n=>`Show hidden branches · ${n}`],
 [/^변경 (\d+)개$/,n=>`${n} changes`],
 [/^남은 충돌 (\d+)개$/,n=>`${n} conflicts remaining`],
 [/^충돌 (\d+)$/,n=>`Conflict ${n}`],
 [/^검색 결과 (\d+)개 \/ (\d+)개$/,(n,total)=>`${n} results / ${total} commits`],
 [/^(\d+)개 커밋$/,n=>`${n} commits`],
 [/^미커밋 변경 (\d+)개 → 변경사항으로 이동$/,n=>`${n} uncommitted changes → Open Changes`],
 [/^변경 없는 (\d+)줄 펼치기$/,n=>`Expand ${n} unchanged lines`],
 [/^변경 (\d+)로 이동$/,n=>`Go to change ${n}`],
 [/^작업 중 · (\d+)$/,n=>`Unstaged · ${n}`],[/^커밋할 변경 · (\d+)$/,n=>`Staged · ${n}`],
 [/^변경 파일 · (\d+)$/,n=>`Changed files · ${n}`],[/^◌\s+작업 중인 변경(?: · (\d+)개 파일)?$/,n=>`◌ Working changes${n?' · '+n+' files':''}`],
 [/^스테이징한 변경 커밋 · (\d+)개 파일$/,n=>`Commit staged changes · ${n} files`],
 [/^(\d+)개 저장소$/,n=>`${n} repositories`],[/^(\d+)개 불러옴( · 이 범위에서 검색)?$/,(n,scope)=>`${n} loaded${scope?' · Search this range':''}`],
 [/^부모 (\d+) · (.+)$/,(n,hash)=>`Parent ${n} · ${hash}`],[/^(\d+)개 변경$/,n=>`${n} changes`],[/^(\d+) \/ (\d+) 변경$/,(n,total)=>`${n} / ${total} changes`],
 [/^스테이징한 (\d+)개 파일의 변경만 커밋합니다\.( 작업 중 영역의 변경은 남습니다\.)?( 커밋 메시지를 입력하세요\.)?$/,(n,unstaged,message)=>`Commit only the ${n} staged files.${unstaged?' Unstaged changes remain.':''}${message?' Enter a commit message.':''}`],
 [/^충돌 (\d+)개를 먼저 해결하세요\.$/,n=>`Resolve ${n} conflicts first.`],
 [/^(.+) · (작업 중|커밋할 변경|작업 폴더)$/,(name,area)=>`${name} · ${en[area]}`],
 [/^(.+) (파일 전체 스테이징|스테이징 해제)$/,(name,action)=>`${name} ${en[action]}`],
 [/^(.+) · 이력$/,name=>`${name} · History`],[/^(.+) 탭 닫기$/,name=>`Close ${name} tab`],
 [/^(.+) 작업 공간$/,name=>`${name} workspace`],[/^(.+) 검색$/,name=>`${en[name]||name} search`],
 [/^병합 · (.+)$/,route=>`Merge · ${route}`],[/^리베이스 · (.+)$/,route=>`Rebase · ${route}`],
 [/^(.+) 체크아웃$/,name=>`Check out ${name}`],[/^(.+) 완료$/,name=>`${en[name]||name} completed`],
 [/^(.+) → (.+) · (\d+)개 파일$/,(from,to,n)=>`${from} → ${to} · ${n} files`],
 [/^변경 줄 (\d+)$/,n=>`Changed line ${n}`],
 [/^STASHES · (\d+)$/,n=>`STASHES · ${n}`]
];
const languages=window.PgitLocales.languages;
const supported=value=>languages.some(item=>item.id===value)?value:'ko';
let language=supported(localStorage.getItem('pgit.language'));
function t(source){if(typeof source!=='string')return source;const leading=source.match(/^\s*/)[0],trailing=source.match(/\s*$/)[0],key=source.trim();if(!key)return source;let value=language==='ko'?(ko[key]||ko[reverse[key]]||reverse[key]||key):(en[key]||key);if(language!=='ko'&&value===key){for(const [pattern,format] of templates){const match=key.match(pattern);if(match){value=format(...match.slice(1));break}}}else if(language==='ko'&&/^STASHES · /.test(key))value=key.replace('STASHES','스태시');if(language!=='ko'&&language!=='en')value=PgitLocales.translate(language,value);if(/win/i.test(window.pgitDesktop?.platform||navigator.platform))value=value.replace(/⌘\/Ctrl/g,'Ctrl').replace(/⌘/g,'Ctrl+');return leading+value+trailing}
const originals=new WeakMap(),attributes=new WeakMap();
// Data-bearing DOM is excluded even when a user names a branch/file "닫기" or "Stash 만들기".
const dataSelector='script,style,pre,code,textarea,option,.subject-text,.historyrow .cell-muted,.historyrow time,.remote-group summary,#extraRefs>.nav,.graph-refs,.branchitem,.remote-branch,[data-ref],.repo-heading,.current-branch,.tab-text,.recent-project strong,.recent-project small,.change-path,.file-path,.commit-author,.commit-parents button,.selected-commit-panel h2,.commit-body,.commit-file>span:last-child,.compare-file small,.diff-controls strong,.commit-meta,.provider-row strong,.provider-row p,.branch-route,.literal-data,#status,#footBranch,#pathInput,#projectPath,#cloneUrl';
function translateText(node){if(node.parentElement?.closest(dataSelector))return;if(node.parentElement?.closest('.frost-select-trigger,.frost-select-option')&&!node.parentElement.closest('.frost-select[data-ui-options]'))return;let record=originals.get(node);if(!record||node.data!==record.output)record={source:node.data};const output=t(record.source);record.output=output;originals.set(node,record);if(node.data!==output)node.data=output}
function translateElement(element){if(element.matches('script,style'))return;for(const name of ['aria-label','placeholder','title']){if(!element.hasAttribute(name))continue;if(name==='title'&&element.matches('[data-ref],.historyrow,.branchmarker,.commit-file,.compare-file,.file-select,.project-tab>button,.current-branch,.repo-heading,.frost-select-trigger'))continue;let records=attributes.get(element);if(!records){records={};attributes.set(element,records)}const value=element.getAttribute(name);let record=records[name];if(!record||record.output!==value)record={source:value};const output=t(record.source);record.output=output;records[name]=record;if(value!==output)element.setAttribute(name,output)}}
function translateTree(root){if(root.nodeType===3){translateText(root);return}if(root.nodeType!==1)return;translateElement(root);for(const element of root.querySelectorAll('[aria-label],[placeholder],[title]'))translateElement(element);for(const time of root.querySelectorAll('time[datetime]')){const date=new Date(time.dateTime);const value=time.closest('.historyrow')?date.toLocaleDateString(languages.find(item=>item.id===language).locale):date.toLocaleString(languages.find(item=>item.id===language).locale);if(time.textContent!==value)time.textContent=value}const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())translateText(walker.currentNode)}
const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')translateText(r.target);else if(r.type==='attributes')translateElement(r.target);else for(const node of r.addedNodes)translateTree(node)}});
function setLanguage(value,{persist=true}={}){language=supported(value);document.documentElement.lang=language;window.dispatchEvent(new CustomEvent('pgit-language-change',{detail:language}));localStorage.setItem('pgit.language',language);translateTree(document.body);document.querySelectorAll('.language-switch').forEach(button=>{button.textContent=language==='ko'?'한국어 ▾':'English ▾';button.setAttribute('aria-label',language==='ko'?'언어 변경: English':'Change language: 한국어')});if(window.parent===window){document.querySelectorAll('iframe.project-frame').forEach(frame=>frame.contentWindow.postMessage({source:'pgit-language',language},location.origin));if(persist&&typeof save==='function')save()}}
window.PgitI18n={t,setLanguage,languages,get language(){return language}};
window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.source==='pgit-language')setLanguage(event.data.language,{persist:false})});
setLanguage(language,{persist:false});observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
})();
