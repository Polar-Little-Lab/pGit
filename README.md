# pGit · 0.2.0

Polar Frost 디자인과 커밋 그래프를 중심으로 만든 macOS Git 클라이언트입니다. AI 기능은 포함하지 않습니다. 로고는 Polar 제품군 A안: 공통 북극곰 얼굴과 pGit 분기 심볼입니다.

[macOS 미리보기 다운로드](https://github.com/Polar-Little-Lab/pGit/releases)

Apple Silicon은 `macos-arm64`, Intel은 `macos-x64` 파일을 받으세요. Node.js는 앱에 포함되어 있으며 Git은 별도 설치가 필요합니다(`xcode-select --install`). Ad-hoc 서명된 미리보기이며 Apple 공증은 받지 않았습니다. 수동 macOS 실기기 QA는 아직 남아 있습니다.

## 작업 흐름

1. **저장소 열기**로 로컬 작업 폴더를 선택합니다. **최근 저장소**에서 다시 열 수 있습니다.
2. 이력에서 커밋을 선택하면 하단에 Diff가 표시됩니다. 방향키 탐색, 브랜치 필터, 메시지·작성자·SHA 검색을 지원합니다.
3. 커밋·브랜치를 **우클릭**하면 관련 작업을 고를 수 있습니다. 브랜치 클릭은 이력 필터이고, 더블클릭은 전환 확인 폼을 엽니다.
4. **WIP** 또는 **변경 사항**에서 파일·블록·줄 단위로 스테이징합니다. 체크박스는 파일의 인덱스 상태이며 일부 스테이징 파일도 체크됩니다.
5. **⌘K / Ctrl+K**로 전체 작업을 검색합니다. 외부에 게시하거나 저장소를 수정하는 작업은 실행 폼에서 실행합니다.

## 구현 범위

| 영역 | 기능 |
|---|---|
| 이력 | 분기·합류 그래프, HEAD/브랜치/원격/태그, 인라인 Diff, 방향키·검색, WIP |
| 저장소 | 열기·초기화·복제, 최근 저장소 |
| 브랜치·원격 | 생성·전환·이름 변경·안전한 삭제, 원격 추가·조회·제거, Fetch/Prune·fast-forward Pull·Push |
| 변경·커밋 | 파일/블록/줄 Stage·Unstage, 커밋·Amend, HEAD와 작업 폴더 좌우 비교, 텍스트 편집, ignore 추가 |
| 통합 | Merge·Rebase·Cherry-pick·Revert, 충돌 상태·계속·중단, Base/Ours/Theirs와 결과 편집 |
| 이력 편집 | 선형 이력의 Interactive Rebase: 순서 변경·Pick·Drop·Squash·Fixup, 마지막 커밋 soft undo |
| 탐색·보관 | 파일 History·Blame, Reflog·참조 비교, 태그, Stash 생성·Diff·Apply·Pop·Drop |
| 확장 | Worktree 생성·조회·제거·Lock/Unlock, Submodule 상태·초기화/갱신, LFS 상태/Fetch |
| 설정 | 저장소별 작성자·이메일·기존 Git 키를 사용하는 서명 설정 |
| GitHub | PR/Issues/Actions 목록, PR Diff·검사·Checkout, Draft PR·리뷰·댓글·이슈 게시 |

GitHub 기능은 사용자 PC의 `gh` 설치와 `gh auth login`이 필요합니다. `origin`의 GitHub 또는 Enterprise 저장소를 대상으로 기존 로그인 정보를 사용합니다. 이 앱이 토큰을 수집하지 않습니다. LFS 기능은 Git LFS 설치가 필요합니다. Git hook과 SSH/credential helper·서명 설정은 기존 Git 설정을 사용합니다.

## 동작 한계

- **전체 GitKraken 유료 기능과 동등한 완성판은 아닙니다.** [기능 현황 및 남은 작업](docs/NON_AI_ROADMAP.md)을 확인하세요.
- 그래프는 처음 200개, 더 불러오기로 최대 2,000개를 표시합니다. 그래프 검색은 로드한 커밋에 적용됩니다. 작업 검색의 전체 이력 메시지 검색은 별도로 최대 200건을 반환합니다.
- 부분 스테이징은 충돌·생성·삭제·이름 변경·모드 변경이 없는 추적 텍스트 파일에 지원합니다. 편집은 1MB 이하 일반 텍스트 파일에 지원합니다.
- 커밋은 인덱스 전체를 기록합니다. 외부 도구가 이미 스테이징한 내용도 포함됩니다.
- 리베이스·Amend 전 HEAD는 `refs/pgit/backups/<timestamp>`에 보관합니다. 복구는 Reflog/참조 비교로 확인한 뒤 Git에서 수행하세요. 자동 undo/redo 전체 기능은 아직 없습니다.
- 일반 Git 명령은 30초, 고급 리베이스와 GitHub CLI 등 일부 명령은 120초 제한입니다. 시간 초과가 발생하면 새로고침하고 실제 Git 상태를 확인하세요.
- 한 서버는 한 작업 폴더를 사용합니다. 브라우저로 사용할 때는 탭 하나에서 실행하세요. 자동 새로고침과 여러 저장소 탭은 미구현입니다.

## 개발 및 검증

Node.js 22 이상과 Git이 필요합니다. 웹 실행에는 npm 패키지 설치가 필요하지 않습니다.

```sh
git clone https://github.com/Polar-Little-Lab/pGit.git
cd pGit
npm start
```

터미널의 `http://127.0.0.1:포트`를 엽니다. 데스크톱 개발·검증·빌드는 다음과 같습니다.

```sh
npm install
npm run desktop
npm test
npx playwright install chromium
npm run test:ui
npm run dist:mac
```

14개 테스트가 임시 저장소에서 스테이징 분리, 충돌 복구, 리베이스와 백업, 원격/worktree, 파일 편집 가드와 HTTP 요청 검증을 확인합니다. CI의 브라우저 테스트는 저장소 열기·그래프/컨텍스트 메뉴·로고/CSS·브랜치 생성·블록 스테이징·파일 편집·인터랙티브 리베이스를 실행합니다. 실제 사용자 계정으로 GitHub 게시를 검증한 것은 아닙니다.

## 구조와 디자인

- `git.mjs`, `operations.mjs`, `advanced.mjs`: 실제 Git 실행과 검증
- `providers.mjs`: 선택적 GitHub CLI 어댑터
- `server.mjs`: 127.0.0.1의 임의 포트, Host·Origin·세션 토큰 검증
- `public/`: 실행 화면과 로고; `prototype.html`은 과거 초안 보관본
- `desktop/`: Electron 셸과 서명; `scripts/`: 아이콘 빌드와 리베이스 editor

[Polar 디자인 시스템](https://github.com/Polar-Little-Lab/design-system)의 Frost 색상·간격·컨트롤을 사용합니다. Git 명령은 셸 문자열 대신 인자 배열로 실행하며 Diff의 외부 도구와 textconv는 끕니다. 신뢰하는 로컬 저장소에서 사용하세요.
