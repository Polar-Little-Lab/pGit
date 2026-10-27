# AI 제외 기능 구현 현황 · pGit 0.2

범위 기준: [GitKraken 요금제](https://gitkraken.com/pricing), [Desktop 기능 문서](https://help.gitkraken.com/gitkraken-desktop/gitkraken-desktop-home/). 2026-10-27 확인. 기능적인 목표이며 GitKraken의 소스나 브랜드를 복제하지 않습니다. AI 생성·설명·도우미·에이전트·MCP는 제외합니다.

## 구현한 기능

| 영역 | 0.2 구현 |
|---|---|
| 브랜드 | A안 공통 곰 실루엣/남색 타일, pGit 분기 기호, SVG 원본·macOS 아이콘 빌드 |
| 그래프 | 커밋/브랜치/원격/태그, 부모 연결, WIP, 선택·필터·키보드, 컨텍스트 메뉴 |
| 기본 Git | Clone/Init/Open, Stage/Unstage/Commit, Branch CRUD, Remote CRUD, Fetch/Prune/Pull(ff-only)/Push |
| 고급 변경 | 블록·줄 Stage/Unstage, 오래된 Diff 거부, 파일 편집·외부 변경 감지·심볼릭 링크 차단, 좌우 Diff, Ignore |
| 충돌·통합 | Merge/Rebase/Cherry-pick/Revert, 진행 상태·Continue/Abort, Base/Ours/Theirs·결과 편집·저장/스테이징 |
| 이력 편집 | 선형 Interactive Rebase 순서/Pick/Drop/Squash/Fixup, Amend, HEAD 백업 참조, 마지막 커밋 soft undo |
| 조회·보관 | File History/Blame/Reflog/Compare, Stash/Tag, 전체 이력 메시지 검색 |
| 확장 | Worktree CRUD/Lock, Submodule status/init/update, LFS status/fetch, 작성자·서명 설정, 최근 저장소 |
| GitHub | gh 기반 PR/Issue/Actions 목록, PR Diff/Checks/Checkout, Draft PR/Review/Comment, Issue 생성/댓글 |

GitHub는 사용자 기기의 `gh` 설치/로그인이 필요하며 OAuth UI는 아직 없습니다. LFS는 Git LFS 설치가 필요합니다. 서명·SSH·hook·credential helper는 기존 Git 설정을 사용합니다.

## 남은 로컬 작업

- 그래프 가상화, 드래그앤드롭, 다중 커밋 선택/Cherry-pick, 브랜치 Hide/Solo.
- 복구 가능한 변경 폐기, 이미지/Markdown 미리보기, 확장된 Diff 설정.
- Merge-preserving rebase·Reword, 모든 작업의 undo/redo journal, 안전한 force-with-lease UI.
- Gitflow 전체 흐름, 내장 터미널, 다중 프로필, 고급 Submodule/LFS 관리.
- 즐겨찾기·여러 저장소 탭·로컬 워크스페이스, 딥링크, 테마·단축키 설정, 자동 갱신.
- Windows/Linux 패키지, macOS 공증 및 수동 실기기 QA.

## 남은 외부 서비스·팀 기능

- GitHub 내장 OAuth·자격 증명 UI, PR 병합/포크·고급 리뷰 기능.
- GitLab/GitLab Self-Managed, Bitbucket/Data Center, Azure DevOps/Server의 호스팅 연동.
- Jira Cloud/Data Center, Trello, 각 호스팅 서비스의 이슈 연동.
- 공유 워크스페이스, 개인·팀 Launchpad, 팀 활동, 사전 충돌 감지.
- 조직·권한 정책, SSO/SAML, 관리 기능, 온프레미스 배포.

공유/팀/SSO는 별도의 인증·협업 서버와 서비스별 등록 정보가 필요합니다. 아직 동작하는 서비스로 제공하지 않습니다. GitLens IDE 확장과 별도 CLI 제품 기능도 이 데스크톱 앱에 구현된 것으로 세지 않습니다.

## 검증 범위

- 로컬 테스트 14개 통과: 임시 Git 저장소 기반 동작, CLI 인자 검증, HTTP Origin/토큰/CSP.
- 최종 변경 브랜치의 Linux UI CI 통과: 저장소/그래프/컨텍스트 메뉴/아이콘/CSS/브랜치/부분 스테이징/편집/실제 Fixup 리베이스.
- macOS 릴리스 워크플로는 테스트와 UI 검증 후 arm64/x64 ZIP·DMG를 만들고 ad-hoc 서명을 검사합니다. 개별 실행 결과는 Actions에서 확인합니다.
- GitHub 실제 계정으로 게시하는 기능, 사용자 기기 SSH/서명, 수동 macOS UI는 별도 검증이 남아 있습니다.
