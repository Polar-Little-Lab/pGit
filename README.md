# pGit · 0.4.0 — Arctic workspace

프로젝트 탭, 커밋 그래프, 오른쪽 스테이징·커밋 패널을 갖춘 macOS Git 클라이언트입니다. Polar Frost 디자인 시스템의 얼음색 표면과 차분한 북극 테마를 사용합니다. AI 기능은 포함하지 않습니다. 로고는 Polar 제품군 A안: 공통 북극곰 얼굴과 pGit 분기 심볼입니다.

[macOS 미리보기 다운로드](https://github.com/Polar-Little-Lab/pGit/releases)

Apple Silicon은 `macos-arm64`, Intel은 `macos-x64` 파일을 받으세요. Node.js는 앱에 포함되어 있으며 Git은 별도 설치가 필요합니다(`xcode-select --install`). Ad-hoc 서명된 미리보기이며 Apple 공증은 받지 않았습니다. 수동 macOS 실기기 QA는 아직 남아 있습니다.

## 작업 흐름

1. 상단 **+ / ⌘T**로 프로젝트를 엽니다. 로컬 열기·복제·새 저장소 만들기를 선택할 수 있습니다. 같은 저장소를 다시 열면 기존 탭으로 이동합니다.
2. 프로젝트 탭마다 파일 선택·그래프 검색·커밋 메시지 초안을 유지합니다. 닫기는 저장소 파일을 삭제하지 않습니다. 초안이 있는 탭은 닫기 전에 확인합니다. 데스크톱 앱을 다시 실행하면 열린 프로젝트 목록을 복원합니다. 커밋 초안은 재실행 후에는 복원하지 않습니다.
3. 이력에서 커밋을 선택하면 하단에 변경 파일 목록과 **Before / After** 좌우 Diff가 표시됩니다. 방향키 탐색, 브랜치 필터, 메시지·작성자·SHA 검색을 지원합니다.
4. 커밋·브랜치를 **우클릭**하면 관련 작업을 고를 수 있습니다. 브랜치 클릭은 이력 필터이고, 더블클릭은 전환 확인 폼을 엽니다.
5. **WIP** 또는 **변경 사항**에서 파일·블록·줄 단위로 스테이징합니다. **작업 중 / 커밋할 변경** 목록을 나눠 표시하며, 일부 스테이징 파일은 두 영역에 나타납니다. 파일을 선택한 영역에 맞춰 Diff와 블록·줄 스테이징 창을 엽니다.
6. **스테이징한 변경 커밋 · N개 파일**은 커밋할 변경 영역만 기록합니다. 작업 중 영역의 변경은 남으며, 충돌이 있으면 먼저 해결해야 합니다.
7. **⌘K / Ctrl+K**로 전체 작업을 검색합니다. 외부에 게시하거나 저장소를 수정하는 작업은 실행 폼에서 실행합니다.

## 커밋 Before / After 비교

- 커밋을 선택하고 변경 파일을 클릭하면 왼쪽은 부모 커밋, 오른쪽은 선택한 커밋의 파일 내용입니다. 현재 작업 폴더의 미커밋 내용은 섞이지 않습니다.
- 줄 번호·추가/삭제 색상·공백 행 정렬, 이전/다음 변경, 세로 스크롤 동기화, 좌우/통합 보기, 크게 보기를 제공합니다. 경계선을 드래그하거나 포커스 후 위/아래 방향키로 비교 영역 높이를 조절할 수 있습니다.
- 병합 커밋은 부모를 선택할 수 있습니다. 첫 커밋·추가·삭제·이름 변경·심볼릭 링크·파일 모드 변경을 구분합니다.
- 커밋 하나를 선택한 뒤 다른 커밋을 **Shift+클릭**하거나, 작업 검색의 **두 커밋 비교**에서 브랜치/SHA를 입력하면 두 시점의 변경을 비교합니다.
- 각 파일은 1MB/20,000줄까지 텍스트로 표시합니다. 긴 파일은 보이는 행만 그립니다. 바이너리·UTF-8이 아닌 파일·서브모듈·큰 파일은 상태와 크기를 표시합니다.

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
| GitLab | 자체 호스팅·하위 그룹·원격 선택, MR/Issues/Pipelines 목록, MR Diff·파이프라인·Checkout, Draft MR·댓글·이슈 생성 |
| 복구 | 추적 텍스트 파일의 미스테이징 변경 버리기·복구 목록, 외부 수정 감지 |
| GitHub | PR/Issues/Actions 목록, PR Diff·검사·Checkout, Draft PR·리뷰·댓글·이슈 게시 |

GitLab 기능은 `glab` 설치와 `glab auth login --hostname gitlab.example.com` 로그인이 필요합니다. 연동 화면에서 선택한 원격 URL의 호스트와 프로젝트 경로를 사용하며 하위 그룹을 지원합니다. SSH 포트는 API 포트로 사용하지 않습니다. 별도 API 포트는 HTTPS 원격 주소에 지정하세요. 토큰을 pGit에 저장하지 않습니다. MR 생성·댓글·이슈 생성은 명령 폼에서 실행해야 게시됩니다. 실제 사내 서버 인증·권한은 해당 환경에서 검증해야 합니다.

변경 버리기는 1MB 이하 UTF-8 추적 파일의 작업 폴더 수정에 한정됩니다. 스테이징된 내용은 유지하고 복구본은 해당 워크트리의 Git 디렉터리에 저장합니다. 작업 검색의 **버린 변경 복구**에서 복원하며, 이후 수정된 파일은 덮어쓰지 않습니다. 새 파일·삭제·이름 변경·바이너리·줄/블록 단위 버리기 및 일반 Undo/Redo는 후속 범위입니다.

Pull은 fast-forward only(기본), Merge, Rebase를 선택할 수 있습니다. 충돌은 기존 계속/중단 흐름에서 처리합니다.

GitHub 기능은 사용자 PC의 `gh` 설치와 `gh auth login`이 필요합니다. `origin`의 GitHub 또는 Enterprise 저장소를 대상으로 기존 로그인 정보를 사용합니다. 이 앱이 토큰을 수집하지 않습니다. LFS 기능은 Git LFS 설치가 필요합니다. Git hook과 SSH/credential helper·서명 설정은 기존 Git 설정을 사용합니다.

## 동작 한계

- **전체 GitKraken 유료 기능과 동등한 완성판은 아닙니다.** [기능 현황 및 남은 작업](docs/NON_AI_ROADMAP.md)을 확인하세요.
- 그래프는 처음 200개, 더 불러오기로 최대 2,000개를 표시합니다. 그래프 검색은 로드한 커밋에 적용됩니다. 작업 검색의 전체 이력 메시지 검색은 별도로 최대 200건을 반환합니다.
- 부분 스테이징은 충돌·생성·삭제·이름 변경·모드 변경이 없는 추적 텍스트 파일에 지원합니다. 편집은 1MB 이하 일반 텍스트 파일에 지원합니다.
- 커밋은 인덱스 전체를 기록합니다. 외부 도구가 이미 스테이징한 내용도 포함됩니다.
- 리베이스·Amend 전 HEAD는 `refs/pgit/backups/<timestamp>`에 보관합니다. 복구는 Reflog/참조 비교로 확인한 뒤 Git에서 수행하세요. 자동 undo/redo 전체 기능은 아직 없습니다.
- 일반 Git 명령은 30초, 고급 리베이스와 GitHub CLI 등 일부 명령은 120초 제한입니다. 시간 초과가 발생하면 새로고침하고 실제 Git 상태를 확인하세요.
- 서버는 프로젝트별 작업 폴더를 분리합니다. 서로 다른 프로젝트의 작업을 함께 처리할 수 있으며, 같은 저장소의 겹치는 요청은 거부합니다. 파일 감시 기반 자동 갱신은 아직 없으며 도구 모음의 새로고침으로 외부 변경을 읽습니다.
- 브라우저 모드의 열린 프로젝트 기록은 해당 서버 주소의 localStorage에 저장됩니다. 데스크톱은 앱의 userData/arctic-workspace.json에 목록을 저장하므로 서버 포트가 달라져도 복원됩니다.

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

로컬 테스트가 임시 저장소에서 스테이징 분리, 충돌 복구, 리베이스와 백업, 원격/worktree, 파일 편집 가드와 HTTP 요청 검증을 확인합니다. CI의 브라우저 테스트는 저장소 열기·그래프/컨텍스트 메뉴·로고/CSS·브랜치 생성·블록 스테이징·파일 편집·인터랙티브 리베이스를 실행합니다. 부분 스테이징 파일의 두 영역 표시, 파일 전환/새로고침 뒤 Diff 모드 유지, 스테이징한 줄만 실제 커밋되는 것도 확인합니다. 실제 사용자 계정으로 GitHub 게시를 검증한 것은 아닙니다.

## 구조와 디자인

- `git.mjs`, `operations.mjs`, `advanced.mjs`: 실제 Git 실행과 검증
- `providers.mjs`: 선택적 GitHub/GitLab CLI 어댑터
- `server.mjs`: 127.0.0.1의 임의 포트, Host·Origin·세션 토큰 검증, 프로젝트별 요청 분리
- `public/shell.*`: 프로젝트 탭·최근 프로젝트·시작 화면
- `public/arctic.*`: 그래프/diff와 커밋 패널 배치
- `desktop/workspace-store.cjs`: 열린 프로젝트 목록 검증·저장·복원
- `public/`: 실행 화면과 로고; `prototype.html`은 과거 초안 보관본
- `desktop/`: Electron 셸과 서명; `scripts/`: 아이콘 빌드와 리베이스 editor

[Polar 디자인 시스템](https://github.com/Polar-Little-Lab/design-system)의 Frost 색상·간격·컨트롤을 사용합니다. Git 명령은 셸 문자열 대신 인자 배열로 실행하며 Diff의 외부 도구와 textconv는 끕니다. 신뢰하는 로컬 저장소에서 사용하세요.

프로젝트 탭의 요청 격리, UI 동작과 디자인 적용 범위는 [Arctic workspace](docs/ARCTIC_WORKSPACE.md)를 참고하세요.
