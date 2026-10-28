# AI 제외 기능 구현 현황 · pGit 0.4

범위 기준: [GitKraken 요금제](https://gitkraken.com/pricing), [Desktop 기능 문서](https://help.gitkraken.com/gitkraken-desktop/gitkraken-desktop-home/). 2026-10-27 확인. 기능적인 목표이며 GitKraken의 소스나 브랜드를 복제하지 않습니다. AI 생성·설명·도우미·에이전트·MCP는 제외합니다.

## 구현한 기능

| 영역 | 0.4 구현 |
|---|---|
| 브랜드 | A안 공통 곰 실루엣/남색 타일, pGit 분기 기호, SVG 원본·macOS 아이콘 빌드 |
| 그래프 | 커밋/브랜치/원격/태그, 부모 연결, WIP, 선택·필터·키보드, 컨텍스트 메뉴 |
| 프로젝트 | 상단 +/탭, 프로젝트별 독립 요청·선택·초안, 최근 프로젝트, 데스크톱 재실행 시 탭 복원 |
| 기본 Git | Clone/Init/Open, Stage/Unstage/Commit, Branch CRUD, Remote CRUD, Fetch/Prune/Pull(ff-only)/Push |
| 커밋 비교 | 파일별 Before/After, 줄 정렬·변경 색상·가상화·동기 스크롤·확대, 병합 부모 선택, 임의 두 참조/Shift+클릭 비교 |
| 고급 변경 | 블록·줄 Stage/Unstage, 오래된 Diff 거부, 파일 편집·외부 변경 감지·심볼릭 링크 차단, 좌우 Diff, Ignore |
| 충돌·통합 | Merge/Rebase/Cherry-pick/Revert, 진행 상태·Continue/Abort, Base/Ours/Theirs·결과 편집·저장/스테이징 |
| 이력 편집 | 선형 Interactive Rebase 순서/Pick/Drop/Squash/Fixup, Amend, HEAD 백업 참조, 마지막 커밋 soft undo |
| 조회·보관 | File History/Blame/Reflog/Compare, Stash/Tag, 전체 이력 메시지 검색 |
| 확장 | Worktree CRUD/Lock, Submodule status/init/update, LFS status/fetch, 작성자·서명 설정, 최근 저장소 |
| GitHub | gh 기반 PR/Issue/Actions 목록, PR Diff/Checks/Checkout, Draft PR/Review/Comment, Issue 생성/댓글 |

GitHub는 사용자 기기의 `gh` 설치/로그인이 필요하며 OAuth UI는 아직 없습니다. LFS는 Git LFS 설치가 필요합니다. 서명·SSH·hook·credential helper는 기존 Git 설정을 사용합니다.

## 남은 로컬 작업

- 그래프 가상화, 다중 커밋 선택/Cherry-pick, 브랜치 Hide/Solo.
- 복구 가능한 변경 폐기, 이미지/Markdown 미리보기, 확장된 Diff 설정.
- Merge-preserving rebase·Reword, 모든 작업의 undo/redo journal, 안전한 force-with-lease UI.
- Gitflow 전체 흐름, 내장 터미널, 다중 프로필, 고급 Submodule/LFS 관리.
- 즐겨찾기·프로젝트 그룹, 딥링크, 단축키 설정, 파일 감시 자동 갱신.
- Windows/Linux 패키지, macOS 공증 및 수동 실기기 QA.

## 남은 외부 서비스·팀 기능

- GitHub 내장 OAuth·자격 증명 UI, PR 병합/포크·고급 리뷰 기능.
- GitLab/GitLab Self-Managed, Bitbucket/Data Center, Azure DevOps/Server의 호스팅 연동.
- Jira Cloud/Data Center, Trello, 각 호스팅 서비스의 이슈 연동.
- 공유 워크스페이스, 개인·팀 Launchpad, 팀 활동, 사전 충돌 감지.
- 조직·권한 정책, SSO/SAML, 관리 기능, 온프레미스 배포.

공유/팀/SSO는 별도의 인증·협업 서버와 서비스별 등록 정보가 필요합니다. 아직 동작하는 서비스로 제공하지 않습니다. GitLens IDE 확장과 별도 CLI 제품 기능도 이 데스크톱 앱에 구현된 것으로 세지 않습니다.

## 검증 범위

- 0.4 로컬 테스트 39개: 임시 Git 저장소 기반 동작, CLI 인자 검증, HTTP Origin/토큰/CSP.
- 최종 변경 브랜치의 Linux UI CI 통과: 저장소/그래프/컨텍스트 메뉴/아이콘/CSS/브랜치/부분 스테이징/편집/실제 Fixup 리베이스.
- macOS 릴리스 워크플로는 테스트와 UI 검증 후 arm64/x64 ZIP·DMG를 만들고 ad-hoc 서명을 검사합니다. 개별 실행 결과는 Actions에서 확인합니다.
- GitHub 실제 계정으로 게시하는 기능, 사용자 기기 SSH/서명, 수동 macOS UI는 별도 검증이 남아 있습니다.

## 2026-10-29 유료 기능 대비 우선순위

공식 기준: [현재 플랜](https://gitkraken.com/pricing), [병합 및 유료 충돌 결과 편집기](https://help.gitkraken.com/gitkraken-desktop/branching-and-merging/). 요금제는 바뀔 수 있으므로 기능 가치와 구현 격차를 기준으로 정렬합니다. 아래 워크트리 개선은 유료 전용이라고 단정하지 않는 공통 워크플로 보완입니다. AI·에이전트 기능은 제외합니다.

| 순서 | 작업 | 근거와 범위 | 상태 |
| --- | --- | --- | --- |
| 1 | 충돌 결과 편집기 | 기존 전체 텍스트 편집에서 블록별 왼쪽/오른쪽/양쪽 선택, 선택 되돌리기, 수동 결과 검토로 확장 | 구현·검증 완료 |
| 2 | 병합 전 충돌 검사 | Pro의 Conflict Detection에 대응. 작업 폴더/인덱스를 건드리지 않는 로컬 검사부터 구현 | 구현·검증 완료 |
| 3 | 워크트리 관리 화면 | 이미 있는 생성·삭제·잠금 API를 목록과 프로젝트 탭 이동으로 연결 | 구현·검증 완료 |
| 4 | 이슈 및 PR 연동 확대 | GitHub CLI 기반 기능을 다듬고 Jira/Trello·GitLab 연동은 인증과 계정 환경을 확인하여 단계별 추가 | 예정 |
| 5 | Enterprise 호스팅·팀 기능 | 자체 호스팅 GitLab/Bitbucket/Azure, 공유 워크스페이스·Launchpad는 인증 서버와 서비스 계정이 필요 | 장기 |

비공개 로컬 저장소 접근, 다중 프로젝트 탭, 파일 편집, 기본 rebase, GitHub CLI 연동은 이미 존재하므로 새 기능으로 중복 계산하지 않습니다. 테마·언어 설정은 구현 완료입니다.

충돌 선택은 저장 전까지 메모리에만 적용합니다. 표준 및 diff3 마커, 여러 블록, CRLF를 지원하고 malformed 마커는 자동 선택을 거부합니다. 수동 결과 편집 시 이전 자동 선택의 되돌리기 기록은 지워서 후속 입력을 덮어쓰지 않습니다. 저장은 기존 revision 검사와 conflictSave를 통해 수행하며 파일을 스테이징하지만 merge/rebase 자체를 완료하지 않습니다. 바이너리·삭제 충돌 해결 전용 UI는 아직 구현하지 않았습니다. 병합 전 검사는 아래 범위로 구현했습니다.


### 병합 전 충돌 검사

로컬·원격 브랜치 우클릭, 작업 검색, 병합 입력창에서 실행합니다. HEAD와 대상 참조를 커밋 해시로 고정하고 `git merge-tree --write-tree --name-only --messages -z`로 계산합니다. 이미 포함됨/fast-forward/자동 병합/충돌/공통 이력 없음으로 나누고 충돌 파일과 Git 상세 결과를 표시합니다. 로컬 작업 변경은 검사에 포함하지 않습니다.

검사 자체는 작업 폴더·인덱스·브랜치 참조·MERGE_HEAD를 변경하지 않지만 Git 객체 저장소에 도달 불가능한 계산 결과 객체가 생길 수 있습니다. 일반 병합 계산에는 Git 2.38 이상이 필요합니다. 외부 명령을 실행할 수 있는 사용자 지정 merge driver가 설정되어 있으면 지원 불가로 처리합니다. 기본 병합 기준의 계산이며 fetch하지 않으므로 원격은 마지막으로 가져온 참조를 사용합니다. 검사 결과가 있는 병합 입력창에서 실행할 때 HEAD나 대상 브랜치가 달라졌으면 다시 검사를 요구합니다.

공식 구현 근거: [git-merge-tree](https://git-scm.com/docs/git-merge-tree). 테스트는 내용·삭제/수정·바이너리 충돌, 줄바꿈이 있는 경로, 더러운 작업 폴더/인덱스 보존, unrelated history, 외부 드라이버 거부, stale HEAD/대상 검사와 UI 경로를 포함합니다.


### 워크트리 관리 화면

왼쪽 워크트리 메뉴 또는 작업 검색의 워크트리 목록에서 관리 화면을 엽니다. 각 항목에 브랜치·경로·현재 프로젝트·기본 작업 폴더·잠금·변경 파일 수를 표시합니다. 새 브랜치와 절대 경로, 시작 참조를 지정하여 생성할 수 있습니다. 프로젝트 탭으로 열기는 현재 초안을 유지하고 이미 열린 경로는 기존 탭으로 전환합니다.

기본/현재 작업 폴더, 잠긴 워크트리, 변경이 있는 워크트리의 삭제를 제한합니다. 서버에서도 등록 여부와 잠금·기본 경로를 재검증하며 다른 프로젝트 탭에 열려 있으면 먼저 닫도록 합니다. 실제 제거는 force 없이 Git worktree remove를 사용하고 브랜치·커밋은 보존합니다. 단독 `/workspace` 화면에서는 프로젝트 탭이 없으므로 초안이 없을 때만 작업 폴더를 전환합니다. 누락된 폴더 복구/prune, 기존 브랜치 체크아웃 생성은 후속 범위입니다.
