# pGit · 0.1.0

Polar Frost 디자인 기반의 가벼운 로컬 Git 클라이언트 개발 버전입니다.
AI 기능은 포함하지 않습니다. macOS 데스크톱 패키징(Electron)과 ZIP/DMG 자동 빌드를 추가했습니다. 릴리스 파일 생성 여부는 아래 다운로드 페이지에서 확인하세요.

[macOS 앱 다운로드](https://github.com/Polar-Little-Lab/pGit/releases)

- Apple Silicon: `macos-arm64` 파일
- Intel: `macos-x64` 파일
- Node.js는 앱에 포함됩니다. Git은 별도 설치가 필요합니다(`xcode-select --install`).
- Apple 공증 전 미리보기 빌드입니다. 첫 실행은 시스템 설정 → 개인정보 보호 및 보안 → 그래도 열기가 필요할 수 있습니다.
- 설치 앱의 화면·실기기 검증은 아직 완료되지 않았습니다.

## 실행

Node.js 22 이상과 Git이 필요합니다. 외부 npm 의존성 설치는 필요하지 않습니다.

```sh
git clone https://github.com/Polar-Little-Lab/pGit.git
cd pGit
npm start
```

터미널에 표시된 `http://127.0.0.1:포트`를 브라우저로 열고, **저장소 열기**에서 `/Users/사용자/Projects/프로젝트`처럼 Git 작업 폴더의 절대 경로를 입력하세요. 종료는 터미널에서 Ctrl+C입니다. 한 서버 프로세스는 한 작업 폴더를 사용하므로 브라우저 탭 하나에서 사용하세요.

## 구현한 기능

- 로컬 저장소 열기 및 수동 새로고침
- 로컬 브랜치 목록, 현재 브랜치 표시, 브랜치별 이력 필터
- 커밋 이력을 기본 화면으로 표시: 40px 행, 독립 스크롤, 고정 열 헤더
- 분기·합류 그래프, 작성자·시간·SHA·부모 커밋·브랜치/HEAD 참조
- 메시지·작성자·SHA 검색, 방향키 커밋 탐색, 하단 인라인 Diff
- 처음 200개에서 더 불러오기로 최대 2,000개 표시. 검색은 불러온 이력 대상이며 검색 중에는 생략된 커밋으로 인한 오해를 막기 위해 연결선을 숨깁니다.
- 커밋 Diff 확인
- 변경 파일 목록, 파일 단위 Stage / Unstage
- 작업 폴더와 인덱스 Diff 구분
- 새 텍스트 파일 미리보기(최대 1MB), 바이너리 구분
- 실제 커밋 생성 및 오류 안내
- 커밋 없는 저장소 및 detached HEAD 표시

커밋은 **인덱스 전체**를 기록합니다. 외부 도구에서 이미 스테이징한 변경도 포함됩니다. 체크박스는 파일의 인덱스 상태를 나타내며 일부만 스테이징된 파일도 체크됩니다. 추가 수정까지 올리려면 해제 후 다시 선택하세요. 충돌 파일 처리와 자동 새로고침은 아직 지원하지 않습니다. Git hook과 서명 설정은 Git이 평소대로 실행합니다. 명령은 30초 제한이 있으며 실패 시 오류를 표시하므로, 시간이 오래 걸리는 hook/서명 사용 시 Git에서 결과를 재확인하세요.

## 디자인

원본: https://github.com/Polar-Little-Lab/design-system (`tokens/frost.json`). Frost 색상, 4/8/12/16/24/32px 간격, 40px 컨트롤, 8px 모서리를 사용합니다.
`public/prototype.html`은 승인된 샘플 초안 보관본이고, 실제 실행 화면은 `public/index.html`입니다. 설치 앱 전환 시 UI와 Git 실행 계층을 재사용할 수 있도록 분리했습니다.

## 검증

```sh
npm test
```

격리된 실제 Git 저장소를 생성하여 첫 커밋, 한글·공백 파일명, Stage/Unstage, 인덱스와 작업 폴더 차이, 이름 변경, 삭제, 브랜치 및 커밋 조회를 검증합니다. 개발 환경에서 브라우저 바이너리가 없어 화면 자동화와 macOS 실기기 검증은 미완료입니다.

## 다음 단계

1. macOS 패키지 실기기 검증 및 배포 안정화 (현재 Electron 셸·폴더 선택 연결)
2. 브랜치 생성·안전한 전환, 대규모 이력 가상 스크롤 개선
3. Fetch / Pull / Push와 기존 SSH 인증 연결
4. Stash, 파일 이력, 태그
5. 병합·충돌 해결·Worktree 등은 별도 단계

현재 Branch 목록 클릭은 **이력 필터링**이며 checkout이 아닙니다. Push/Pull, 원격 계정 연동, AI, 팀 협업, 대규모 그래프 최적화는 포함하지 않습니다.

## 로컬 연결

127.0.0.1의 임의 포트에만 바인딩하며, API는 Host·Origin·세션 토큰 검증을 거칩니다. 셸 문자열 대신 인자 배열로 Git을 실행하고 diff의 외부 도구 및 textconv 실행을 끕니다. 신뢰하는 로컬 저장소에서 사용하세요. 파일 변경 폐기, reset --hard, force push 등 파괴적 작업은 제공하지 않습니다.


## 0.2 기능 확장

A안 Polar 제품군 로고를 사용합니다. 브랜치/원격/태그/stash, merge/rebase/cherry-pick/revert 및 continue/abort, worktree, 파일 history/blame/reflog/참조 비교를 UI에서 실행할 수 있습니다.

- 변경 사항 화면: 파일별·블록별·줄별 스테이징, 좌우 비교, 텍스트 편집, base/ours/theirs 충돌 편집.
- 작업 검색(⌘K / Ctrl+K): 인터랙티브 리베이스의 순서 변경·pick/drop/squash/fixup, amend, ignore, 전체 메시지 검색, 작성자/서명 설정.
- Git LFS status/fetch는 Git LFS 설치가 필요합니다. Submodule 초기화/갱신과 worktree lock/unlock을 제공합니다.
- GitHub 화면은 `gh` 설치 및 `gh auth login`이 필요합니다. origin의 GitHub 또는 Enterprise 저장소에서 PR/issue/Actions 조회, draft PR/리뷰/댓글/이슈 게시와 PR checkout을 지원합니다. 외부 게시 작업은 실행 폼에서 명시적으로 실행합니다.
- 리베이스와 amend 전 HEAD는 `refs/pgit/backups/<timestamp>`에 보관합니다. 복구가 필요하면 Reflog/참조 비교로 확인 후 Git으로 복원하세요. 자동 undo/redo 전체 기능은 아직 없습니다.
- 충돌 편집과 부분 스테이징은 일반 텍스트를 대상으로 합니다. 부분 스테이징은 생성/삭제/이름변경/모드변경 파일을 제외합니다. 편집은 1MB 이하 파일을 지원합니다.

`npm test`는 임시 Git 저장소로 동작을 검증합니다. `npx playwright install chromium && npm run test:ui`는 브라우저 UI를 검증합니다. CI에서 두 검증을 통과해야 배포합니다. 실제 사용자 계정으로 GitHub 게시나 수동 macOS 조작을 테스트한 것은 아닙니다.

전체 유료 기능과 동등한 완성판은 아닙니다. 구현/미구현 범위는 [NON_AI_ROADMAP.md](docs/NON_AI_ROADMAP.md)에 기록합니다. GitLab/Bitbucket/Azure, Jira/Trello, OAuth, 공유 워크스페이스·팀/SSO·온프레미스는 아직 미구현입니다.
