# pGit 개발 인수인계

2026년 11월 6일 기준. 이 문서는 pGit의 제품 방향, 누적 UI 요구사항, 구현 구조, 검증 방법을 다음 개발자와 GPT에 전달한다. 코드와 함께 읽고, 이후 변경 시 구현 상태와 검증 기록을 함께 갱신한다. 상세 조작은 [사용 가이드](USER_GUIDE.md), 기존 화면 감사는 [단계 점검](UX_DEPTH_REVIEW.md), 공통 UI는 [컴포넌트 지침](UI_COMPONENTS.md)을 참고한다.

## 제품과 작업 환경

- 제품: pGit, Polar Little Lab의 로컬 Git 데스크톱 클라이언트. 홈에 `Powered by Polar`를 표시한다.
- 공개 저장소: https://github.com/Polar-Little-Lab/pGit
- 기본 통합 브랜치: main. 버전: package.json 기준 0.4.0. 프리뷰 배포 태그와 package 버전은 서로 다를 수 있다.
- 플랫폼: macOS Apple Silicon/Intel, Windows x64. Electron 40, Node 22 이상, 일반 JavaScript·HTML·CSS. React나 별도 프런트엔드 번들러를 사용하지 않는다.
- Git 실행 파일은 사용자 시스템 것을 사용한다. Node 런타임은 Electron에 포함된다.
- 기능 목표는 Git 작업을 맥락 안에서 빠르게 수행하는 것이다. AI 생성 기능과 Git LFS는 현재 제품 범위에서 제외한다. LFS를 지원하는 UI를 다시 추가하지 않는다.
- 개발 체크아웃은 환경마다 다르다. 이전 임시 워크트리 이름이나 경로를 하드코딩하지 않는다. 실행 전에 pwd, git status, branch, worktree list와 저장소 지침을 확인한다.

## 반드시 유지할 UX 원칙

1. 이미 선택한 브랜치·커밋·파일·워크트리를 다음 창에서 다시 고르게 하지 않는다. 값이 필요한 입력과 실제 변경 확인만 남긴다.
2. 대상 선택과 실행은 구분한다. 병합·삭제·리뷰 게시 등을 목록 선택만으로 실행하지 않는다. 자동 사전 검사가 있어도 사용자가 작업 버튼으로 실행하는 방식을 유지한다.
3. 모달은 닫기, Esc, 바깥 클릭을 지원한다. 드롭다운이 열려 있으면 Esc가 그 목록부터 닫혀야 한다. 진행 중인 Git 작업처럼 중단 불가 상태에서는 닫힘을 제한한다.
4. 커밋은 메시지·작성자·해시·날짜와 그래프 맥락이 보이는 목록에서 고른다. 긴 커밋 셀렉트박스로 되돌리지 않는다.
5. 행 전체가 클릭·호버 대상이어야 한다. 메시지 텍스트 부분만 반응하거나 아이콘과 행의 호버 범위가 어긋나지 않게 한다.
6. 새로고침·닫기 같은 익숙한 보조 동작은 아이콘과 접근성 이름/툴팁을 쓴다. 병합·댓글 게시·그룹 만들기 같은 주요 실행은 의미 있는 텍스트를 유지한다. 모든 버튼을 아이콘으로 바꾸지 않는다.
7. 작은 아이콘 버튼의 중심 정렬, 클릭 영역, 체크박스와 라벨 사이 간격을 확인한다. 새로고침 아이콘에 불필요한 테두리를 추가하지 않는다.
8. 설명을 중복된 배너로 반복하지 않는다. `실행`보다 `병합`, `댓글 게시`처럼 결과를 알 수 있는 이름을 쓴다. 우하단에 고립된 버튼만 두지 말고 입력·결과·실행 영역의 관계를 정리한다.
9. 많은 커밋·파일을 고려한다. 고정 페이지 번호보다 스크롤과 점진 로딩을 우선하고, 큰 코드 목록은 가상화를 유지한다. 검색이 불러온 범위에 한정되면 이를 숨기지 않는다.
10. 담백하지만 Git 도구임을 드러내는 화면을 만든다. 추상적인 슬로건, 과도한 빈 공간, 일반적인 마케팅 영웅 영역을 피한다. 그래프 모티프와 최근 작업 정보를 사용한다.
11. 저장소 이름·메시지·경로·코드·외부 출력은 번역하지 않는다. 앱 문구는 한국어·영어·일본어·중국어·스페인어·프랑스어 체계를 유지한다.

## 프로젝트 홈과 복제

상단 + 또는 Cmd/Ctrl+T는 새 탭을 연다. 새 탭에서 로컬 프로젝트 열기, 저장소 복제, 새 저장소 만들기, 최근 프로젝트를 선택한다. 로컬 열기는 네이티브 폴더 선택으로 바로 연결한다. 복제와 새로 만들기는 독립 모달이며 모드 전환 탭을 다시 넣지 않는다.

성공하면 새 탭이 프로젝트 탭으로 대체된다. 취소·실패하면 새 탭이 남고 기존 프로젝트는 유지된다. 이미 열려 있는 경로는 중복으로 열지 않고 해당 탭을 선택한다. 빈 새 탭은 앱 재시작 시 복원하지 않는다. 프로젝트별 요청, 선택 상태, 작성 중 초안은 다른 탭과 섞이지 않아야 한다.

### URL과 대상 경로

- 데스크톱 복제 창의 경로가 비어 있으면 사용자 홈 폴더 아래에 저장소 이름을 제안한다. 찾아보기에서는 상위 폴더를 고른다.
- URL이 바뀌면 현재 대상 경로의 상위 폴더는 유지하고 마지막 폴더 이름을 새 저장소 이름으로 바꾼다. 직접 입력했던 이름도 URL 변경 시 갱신한다. 예: `/work/codeql` + `https://github.com/github/gh-aw` → `/work/gh-aw`.
- URL 변경 후 사용자가 최종 경로를 다시 수정할 수 있다. 경로 갱신은 입력값만 바꾸며 기존 폴더를 이동·삭제하지 않는다.
- HTTPS, SSH와 `.git` 접미사, Windows 경로 구분자를 고려한다. 브라우저 실행에서는 네이티브 홈 경로 API가 없어 상위 경로 입력/선택이 먼저 필요하다.
- 비어 있지 않은 폴더에는 복제하지 않는다. 실패했다고 사용자 폴더를 자동 삭제하지 않는다.
- 큰 저장소 복제는 30분 제한을 사용한다. 다른 일반 Git 명령의 기본 제한은 30초다. 과거 CodeQL 복제 실패는 30초 제한 때문에 발생했으며, 이를 늘린 뒤 전체 복제를 검증했다.
- 이전 확인 중 gh-aw는 실제 다운로드 중이었다. 특정 링크의 새로운 실패 원인은 정확한 오류/실행 로그를 보고 판단한다. 단순히 같은 원인이라고 단정하지 않는다.
- 현재 복제 화면은 `복제 중…`을 보여준다. 바이트·퍼센트 실시간 진행률과 명시적 취소는 별도 개선 과제다.

## 프로젝트 그룹

새 기능은 Git 브랜치 그룹이 아닌 로컬 저장소의 시각적 분류다. 하나의 저장소 경로는 하나의 그룹에 속하거나 미분류 상태다. AWS, 개인, 회사 등의 실제 분류는 사용자가 정하며 URL로 임의 추측하지 않는다.

- 상단 그룹 아이콘 또는 프로젝트 탭/최근 프로젝트 우클릭으로 관리한다.
- 그룹 이름, 6가지 색상, 6가지 아이콘(폴더·클라우드·코드·워크트리·브랜치·잠금)을 선택한다. 이름은 최대 40자, 그룹은 최대 30개다.
- AWS 예시는 주황 + 클라우드, 개인 프로젝트 예시는 청록 + 코드로 구분할 수 있다. 사용자에게 자동 배정된 기본 그룹은 없다.
- 탭에는 그룹 배지와 프로젝트 이름을 함께 표시한다. 색상만으로 구분하지 않고 이름·아이콘도 유지한다.
- 홈의 최근 프로젝트에 동일 배지를 표시하고 최근 3개 바로가기 아래에 그룹별 목록과 그룹 없는 목록을 제공한다. 그룹 이름도 홈 검색 대상이다.
- 관리 화면에서 프로젝트 체크박스를 선택하면 그 그룹으로 이동하고 즉시 저장한다. 체크 해제는 그룹 소속만 제거한다. 현재 프로젝트 맥락에서 새 그룹을 만들면 그 프로젝트를 포함한다.
- 그룹 이름·색상·아이콘 편집은 `그룹 저장`으로 반영한다. 그룹 삭제는 소속 정보만 제거하며 Git 파일·브랜치·원격은 건드리지 않는다.
- 저장은 데스크톱 workspace JSON 또는 브라우저 localStorage에 한다. 최근 목록에서 빠져도 그룹 소속을 보관한다. 클라우드 동기화는 하지 않는다.
- 홈 그룹 목록 접기와 그룹 저장소 열기를 지원한다. 탭 묶음 접기/닫기, 그룹 간 드래그, 경로 이동 자동 추적은 구현 범위에 포함하지 않는다.

## 누적 기능과 사용자의 결정

| 영역 | 유지할 동작과 기준 |
|---|---|
| 브랜치 탐색 | 사이드바 탐색과 실제 체크아웃을 구분한다. 다른 워크트리에서 사용 중인 브랜치는 Git이 중복 체크아웃을 거부하므로 해당 워크트리를 열도록 안내해야 한다. |
| 워크트리 | 사용자 표시에서는 브랜치/워크트리 이름을 우선한다. 작업 명령 내부에는 정확한 경로를 유지한다. 변경 있음, 잠금, 기본·현재 작업 폴더 등의 삭제 제한을 설명한다. 무조건 강제 삭제하지 않는다. |
| 태그·원격 | `서버의 태그`보다 `원격 저장소의 태그`. Fetch/Push URL이 같으면 한 주소로 합쳐 보여주고 다를 때만 구분한다. |
| 로컬 작업 기록 | Reflog는 HEAD/참조 이동을 기록해 이전 위치를 찾는 기능이다. 일반 커밋 이력과 구분하고 `참조 이동 기록`만으로 설명하지 않는다. |
| 파일 이력 | 텍스트 로그 나열 대신 행 목록, 작성자·날짜·해시를 정렬한다. 행을 선택하면 그 커밋에서 해당 파일이 어떻게 변했는지 비교한다. 검색·새로고침 정렬, 스크롤 로딩을 유지한다. |
| 줄별 작성 이력 | 작성자·날짜·커밋 정보, 줄 번호, 코드가 정렬된 코드 뷰어로 보여준다. 긴 파일에 가상화와 줄 이동을 제공한다. |
| 코드 편집 | 파일 확장자에 따른 구문 색상을 제공한다. 코드 비교에서도 변경 강조와 구문 색상 의미가 충돌하지 않게 한다. |
| Ignore | 추적하지 않는 파일을 트리/체크박스로 고를 수 있어야 한다. 경로를 모르는 상태에서 빈 텍스트칸만 제공하지 않는다. |
| 작성자 설정 | 이름·이메일·서명 여부를 편집한다. 체크박스의 라벨과 클릭 영역을 충분히 확보한다. |
| 병합 | 가져올 브랜치 → 현재 브랜치 방향을 명시하고 검사 상태와 결과를 보여준다. 대상 변경 시 사전 검사한다. 불필요한 중복 검사 버튼을 없애되 사용자가 `병합`으로 실행한다. |
| Fetch/Pull/Push | Fetch는 원격 객체·참조 갱신, Pull은 원격 변경을 현재 브랜치에 통합, Push는 로컬 커밋을 원격에 전송한다. 실제 구현의 추적 브랜치·전송 대상·통합 방식과 설명을 일치시킨다. |
| GitHub/GitLab | 사이드바에 PR/이슈/CI 바로가기 묶음을 중복 배치하지 않는다. 작업 검색의 각각 독립 화면으로 진입한다. |
| 이슈 댓글 | 원격과 이슈를 목록에서 고르고 제목·상태·본문·대화 맥락을 확인한 뒤 여러 줄 댓글을 작성한다. 번호만 입력하는 창으로 되돌리지 않는다. |
| PR/MR 리뷰 | 대상 목록과 제목·작성자·브랜치·상태를 확인하고 리뷰 내용을 작성한다. 승인/변경 요청 등 실제 외부 게시 동작을 분명히 표시한다. |
| LFS | 사용하지 않으므로 제품 메뉴에서 제거한 상태를 유지한다. |
| 부분 커밋 | 변경 사항 화면에서 파일·블록·줄 단위 스테이징을 지원한다. 오래된 diff에 잘못된 patch를 적용하지 않도록 상태를 확인한다. |
| 메시지만 수정 | 스테이징 변경은 포함하지 않는다. 최신·이전 커밋의 메시지 변경을 지원하며 선택한 커밋 이후의 해시가 달라질 수 있음을 설명한다. |
| 마지막 커밋에 변경 추가 | 별도 화면에서 원하는 파일을 선택하고 diff를 미리 본 뒤 amend한다. 스테이징된 내용과 작업 폴더 내용을 구분하며 제외된 변경은 보존한다. |
| 이전 커밋 reword | 현재 브랜치의 조상에 한해 파일 트리와 병합 구조를 유지한 채 메시지를 고친다. 작업 폴더·인덱스를 유지한다. 기존 서명은 제거될 수 있고 다른 브랜치·태그는 이동하지 않는다. 백업 참조를 남긴다. |
| 커밋 이력 정리 | 범위 선택 → 편집의 두 단계. 선택한 첫 커밋을 포함해 HEAD까지 강조하고 선택 개수를 표시한다. 활성 행에만 수정·합치기·제외 도구를 표시하고 드래그/위아래로 순서를 바꾼다. 합친 묶음·제외 취소선·적용 후 개수를 확인한 뒤 실행한다. |

메시지만 바꾸는 이전 커밋 수정과 변경을 재적용하는 인터랙티브 리베이스는 구현·위험이 다르다. 현재 이력 정리에서는 병합 커밋을 포함한 범위와 루트 커밋 처리에 제한이 있다. 모든 DAG 재정렬을 지원한다고 표기하지 않는다. 이미 원격에 게시된 이력을 바꾼 뒤의 강제 Push는 별도 판단이 필요하며 자동 실행하지 않는다.

## 코드 구조

| 위치 | 역할 |
|---|---|
| `desktop/main.cjs`, `preload.cjs` | Electron 창, 네이티브 폴더 선택, 안전한 IPC, 기본 홈 경로 |
| `desktop/workspace-store.cjs` | 저장 데이터 검증·정규화·원자적 쓰기. 새 필드는 여기서 보존되어야 한다. |
| `public/shell.html`, `shell.js`, `shell.css` | 탭, 홈, 복제·생성, 세션 복원, 프로젝트 관리 |
| `project-groups.cjs` | 브라우저/Node 공용 그룹 정규화와 색상·아이콘 허용 목록 |
| `public/project-groups-ui.js` | 그룹 편집, 소속 체크박스, 홈 필터 |
| `server.mjs` | 로컬 HTTP/API, 프로젝트 workspace 격리, 정적 파일 허용 목록 |
| `git.mjs`, `git-runtime.mjs`, `operations.mjs` | Git 실행·오류·기본 조작. clone 제한은 operations에서 별도 지정 |
| `public/advanced.js`, `advanced.mjs` | 고급 명령 화면·백엔드 |
| `history-edits.mjs`, `advanced.mjs`, `scripts/reword-commit.cjs` | 선택적 amend, 이전 커밋 reword와 이력 보존 |
| `public/history-tools.js`, `history-model.js` | 이력 정리 화면/모델 |
| `public/file-history.js`, `blame-view.js`, `code-syntax.js` | 파일 이력·줄별 작성자·구문 색상 |
| `public/provider-review.js`, `provider-review.mjs`, `providers.mjs` | 외부 서비스 조회·리뷰 |
| `public/ui-components.js`, `ui-components.css`, `icons.js` | 공통 모달·행·컨트롤·SVG 아이콘 |
| `public/i18n.js`, `locales.js` | 앱 문구 번역. 사용자 데이터에는 literal-data 사용 |
| `test/*.test.mjs`, `test/ui-*.mjs`, `test/desktop-*.mjs` | 단위/통합, Playwright UI, 패키지 실행 검증 |

새 브라우저 파일을 만들면 server.mjs 정적 허용 목록을, 새 런타임 파일을 만들면 package.json build.files를 확인한다. 렌더러에서 Git을 직접 실행하지 않는다. shell↔iframe 메시지는 origin/source를 검증한다. 그룹 정보는 Git config나 원격 서버에 저장하지 않는다.

## 실행과 검증

```sh
npm ci
npm test
npm start
# 별도 터미널 또는 UI 테스트 스크립트
node test/ui-project-groups.mjs
node test/ui-project-dialog.mjs
node test/ui-direct-project-open.mjs
npm run dist:mac
# Windows 빌드는 Windows 환경/CI에서
npm run dist:win
```

Playwright 브라우저가 없으면 CI와 같은 설치 절차를 사용한다. 로컬 Chrome을 쓰는 환경은 `PGIT_BROWSER_PATH`에 실행 파일 경로를 지정할 수 있다. 패키지 검증은 `PGIT_APP_EXECUTABLE`을 빌드된 앱 실행 파일로 지정해 `node test/desktop-smoke.mjs`를 실행한다. 플랫폼별 경로는 현재 환경에서 확인한다.

이번 변경의 검증 범위: 전체 기본 테스트 103개, 그룹 생성·소속 이동·필터·이름 수정·삭제·재로드 복원·좁은 화면·Git 상태 보존, 복제 URL과 macOS/Windows 대상 경로 동기화, 기존 프로젝트 모달 동작. 전체 레거시 UI 스위트를 모두 통과했다고 확대 해석하지 않는다. Windows 수동 사용성 검증과 CI 자동 설치·실행 검증은 구분한다.

## 배포

`.github/workflows/release-macos.yml`의 표시 이름은 Build desktop downloads다. macOS와 Windows를 병렬 빌드하고 성공한 태그 빌드에서 배포 파일과 SHA256SUMS를 GitHub Releases에 공개한다. macOS는 arm64/x64 dmg·zip, Windows는 x64 설치 exe를 제공한다. 코드 변경 main push와 새 버전 태그/릴리스 발행은 서로 다른 단계다. 기존 태그를 덮어쓰지 않는다.

현재 서명/공증 구성과 다운로드 URL은 실제 워크플로 및 릴리스 결과로 확인한다. 자동 테스트 성공을 Windows 10/11 실제 사용자 수동 검증이라고 표현하지 않는다. 비밀 키나 사용자의 회사 저장소를 문서·첨부 파일·릴리스에 넣지 않는다.

## 후속 작업과 검수 기준

- 복제 진행률·취소·실패 기록을 개선하면 대형 저장소의 `멈춘 것 같은` 상태를 줄일 수 있다.
- 그룹 기능은 이름·색상·아이콘, 현재 열린 탭, 최근 프로젝트, 재시작 복원을 함께 검수한다. 사용자 저장소를 임의로 그룹화하지 않는다.
- 긴 이름, 같은 basename의 다른 경로, 다크 모드, 6개 언어, 최소 창 크기, 키보드 조작을 확인한다.
- 모달 화면의 과거 스크린샷이 현재 코드와 다르면 설명을 최신 동작으로 고치고 캡처를 다시 만든다.
- 후속 작업자는 변경 전후 동작, 수정 파일, 실제 실행한 테스트, 남은 제한, 커밋/배포 여부를 정확히 보고한다. 설계만 한 것을 구현 완료로 쓰지 않는다.

## Git 실행 파일 오류 안내

`git-runtime.mjs`는 실행 파일 누락·실행 권한·macOS 개발자 도구 오류를 `GIT_UNAVAILABLE`로 분류한다. API는 code/reason/platform을 전달하고 `public/git-setup.js`가 해결 안내를 렌더링한다. 복제·생성 폼은 입력을 유지한 채 인라인 카드, 직접 열기와 작업 중 오류는 설정 안내 창을 사용한다. 공식 설치 링크는 https://git-scm.com/install/ 이다. 설치 확인 API는 `git --version`만 실행하고 원래 변경 작업을 자동 재시도하지 않는다. 폴더 없음·파일 접근 권한·일반 Git 실패를 잘못 분류하지 않는다.

## GitKraken 그룹 참고와 다음 설계 방향

2026년 11월 5일 [공식 Workspaces 문서](https://help.gitkraken.com/gitkraken-desktop/workspaces/)와 [Interface 문서](https://help.gitkraken.com/gitkraken-desktop/interface/)를 확인했다. GitKraken은 관련 저장소를 Local/Cloud Workspace로 관리하고 선택한 저장소를 묶어서 열거나 작업한다. 탭 별칭과 프로필별 탭 유지도 별도의 기능이다. 이를 브라우저식 탭 그룹 접기 기능과 동일하다고 단정하지 않는다.

pGit 후속 설계 제안: 홈에 그룹별 저장소 목록을 배치하고 그룹 이름 옆에 저장소 수와 열기 동작을 둔다. 관리 모달에 들어가지 않고도 그룹을 탐색할 수 있게 한다. 탭의 그룹 이름·색상·아이콘 표시는 유지한다. 그룹 접기와 묶음 열기를 우선 검토하고, 여러 저장소를 변경하는 일괄 Pull/Push는 별도 작업 범위로 다룬다. 이 단락은 참고 조사와 제안이며 현재 구현 완료 목록이 아니다.


## 2026-11-05 후속 구현: 홈 그룹 탐색

- 홈의 그룹 필터 아래에서 그룹별 이름·배지·저장소 수·전체 경로를 확인한다. 최근 이력과 별도 목록이며, 최근 목록에서 제거해도 그룹 등록 경로는 남는다.
- 그룹 제목을 클릭하거나 Enter/Space로 목록을 접고 펼친다. 접힘 상태는 현재 실행 중에만 유지한다. 검색 중에는 일치하는 항목을 펼쳐 보여주며 검색을 비우면 기존 접힘 상태로 돌아간다.
- `그룹 열기`는 저장소를 순차적으로 열고 기존 탭을 재사용한다. 검색 중에는 `표시된 저장소 열기`로 이름을 바꾸고 현재 표시된 경로만 연다. 그룹 명단을 클릭 시점에 고정한다.
- 경로 오류·Git 오류·탭 한도 등으로 열기에 실패하면 다음 경로를 열지 않는다. 이미 열린 탭은 유지하며 홈 그룹 아래에 성공 수/대상 수를 표시한다. 성공 수에는 기존 탭 재사용도 포함한다. 파일 삭제·Fetch/Pull/Push는 실행하지 않는다.
- 새 UI 문구는 6개 언어에 추가했다. 그룹명과 경로는 원문을 보존한다.
- 수정: `public/shell.html`, `shell.js`, `shell.css`, `project-groups-ui.js`, `i18n.js`, `locales.js`. `test/ui-group-home.mjs`를 `npm run test:ui` 첫 순서에 추가했다.
- 로컬 검증: `npm test` 103 통과 / 1 skipped / 실패 0, JS 구문 및 diff 공백 검사 통과. Chromium은 실행 환경의 socket 권한 오류로 시작하지 못했으므로 새 UI 테스트의 실행 성공은 아직 확인하지 못했다. 테스트는 그룹 유지·검색·접기·키보드·묶음 열기·중복 탭·초안 보존·중간 실패·6개 언어·좁은 화면·재로드·Git 상태 보존을 다룬다.
- 배포 없음. 후속 검증은 브라우저 실행이 가능한 CI 및 Windows/macOS 실제 앱에서 진행한다. 복제 진행률/취소와 탭 그룹 접기는 여전히 후속 과제다.


## 별도 검토: 화면·움직임 개선

`codex/interface-motion-polish`는 사용자 요청에 따라 main과 분리해 PR에서 검토한다. 사용자 승인으로 main에 병합했다. 범위·모션 정책·검증 제한·되돌리기는 [화면 개선 기록](INTERFACE_POLISH.md)을 참고한다.


## 2026-11-05 그룹 및 탭 탐색 개선

디자인 검토 브랜치를 사용자 승인으로 main에 병합했습니다. 홈 상단에는 최근 연 프로젝트 최대 3개를 표시합니다. 아래에는 그룹별 저장소와 그룹 없는 저장소를 보여줍니다. 전체·최근·즐겨찾기 필터는 제거했습니다. 그룹 제목에는 색상, 저장소 수, 묶음 열기와 편집 버튼을 모았습니다. 새 그룹 버튼으로 바로 그룹을 만듭니다.

탭 오른쪽 +는 새 탭을 엽니다. 옆의 아래 화살표는 열린 탭 검색입니다. 프로젝트 이름·경로·그룹명으로 찾고 방향키와 Enter로 이동합니다. Esc 또는 바깥 클릭으로 닫습니다. 탭이 많아도 두 버튼은 고정되며 선택한 탭은 보이는 위치로 스크롤됩니다.

GitKraken 공식 Workspaces 화면을 참고했으며 클라우드 동기화나 일괄 Pull/Push는 추가하지 않았습니다. 회귀 검증은 test/ui-repo-navigation.mjs에 있으며 동일한 이름의 저장소, 그룹 편집, 최근 바로가기, 키보드, 좁은 창과 탭 넘침을 확인합니다.

검증: 단위 테스트 104/104, 새 탐색 UI·기존 프로젝트 홈·새 탭 흐름·그룹 UI·디자인 UI 및 macOS 패키지 smoke 테스트 통과. macOS 패키지에서 저장소 열기, rebase helper, 세션 복원을 확인했습니다. Windows 수동 검증은 이번 작업에 포함하지 않았습니다.


## 2026-11-05 SVG group icons

The group editor offers searchable Recommended, AWS, Finance & payments, Development and General categories. Brand assets are bundled for offline display. Finance entries are distinct brands; duplicate Hana affiliate entries have been removed. GLN uses an official PNG, not SVG. See GROUP_ICON_SOURCES.md for provenance. The allowlisted icon ID persists across restarts; unknown IDs fall back to folder.

Tabs now show one group icon followed by the project name on a single line. Hover reveals group name and path. Brand colors are retained. Existing groups are preserved; users choose new icons in the editor. The home resume area is a compact row, with Open/Clone/Create actions above the repository list.

Validation: SVG search/selection/save/reload, bundled images, dark/light themes, narrow layout, and existing group/navigation flows.


## Finance brand correction

Finance & payments now contains Hana, Woori, BIDV, GLN, KB, Shinhan, NH, IBK, Kakao Bank, Kbank, SC, Citi, PayPal, Visa, Mastercard and Stripe. Eight identical Hana affiliate choices were removed. Their saved IDs migrate to the retained Hana icon without changing group names, colors or repository assignments. Woori/BIDV use genuine vector symbols; GLN uses its official PNG wordmark on a dark backing. No generated logo or raster-in-SVG wrapper is presented as a vector.

Regression tests check distinct finance asset hashes, retired-ID migration, Woori/BIDV/GLN selection and persistence, local image loading and dark/light/compact presentation.


## Curated group picker and automatic colors

See [Group icon UX](GROUP_ICON_UX.md) for current behavior. New selections include 25 AWS services, 26 distinct finance/payment brands and 28 development brands. Icons are grouped by purpose; legacy AWS selections remain valid without crowding the picker. Brand logos use their representative color automatically and hide the manual palette. Generic icons retain the user-selected color, including when switching back from a brand. The original logo artwork is never recolored.


### 저장소 복제 진행률
복제 창에서 연결 → 다운로드 준비 → 다운로드 → 객체 정리 → 파일 준비 → 프로젝트 열기 단계를 표시합니다. Git이 제공한 단계별 퍼센트와 받은 용량·전송 속도를 표시하며 전체 작업의 예상 퍼센트는 계산하지 않습니다. 진행률이 없는 단계는 대기 표시를 사용합니다. 복제 성공 시 프로젝트를 자동으로 열고 실패 시 입력을 유지합니다. 서버는 인증된 작업 공간별 진행 상태만 제공하고 완료·실패 후 정리합니다.


### 대규모 저장소의 태그·브랜치 이력
선택한 태그·브랜치의 커밋부터 이력을 직접 조회합니다. 최초 전체 스냅샷 200개에 대상 커밋이 없어도 조회할 수 있습니다. 선택한 커밋 해시에 고정해 200개씩 이전 이력을 추가하며, 선택 범위에는 기존 2,000개 상한을 적용하지 않습니다. 새로고침 시 동일한 커밋의 불러온 범위를 유지합니다. 검색은 현재 불러온 이력 안에서 수행합니다. annotated 태그도 실제 커밋으로 해석합니다.


### 커밋 이력 자동 추가 로딩
이력 목록의 아래쪽에 한 화면 정도가 남으면 다음 200개를 미리 불러옵니다. 스크롤 위치를 유지하며 같은 페이지를 중복 요청하지 않습니다. 마지막 페이지에서는 중단하고, 실패했을 때만 다시 시도 버튼을 표시합니다. 불러온 이력 검색 중에는 자동 추가 조회를 하지 않습니다.


### 전체 커밋 수
선택한 브랜치·태그의 전체 커밋 수는 별도 읽기 요청으로 집계하여 `200 / 전체 1,905개`처럼 표시합니다. 목록은 기존처럼 200개씩 무한 스크롤로 추가합니다. 개수 집계는 목록 로딩을 막지 않으며, 같은 커밋 해시의 집계 결과를 재사용합니다. 검색은 불러온 목록에 적용하고 결과 수와 전체 수를 구분해 표시합니다. 집계 실패 시 개수만 다시 조회할 수 있습니다.


### GitHub·GitLab 작업 검색 임시 비활성화
`public/providers.js`의 `categories.push(...providerCommandCategories);`가 주석 처리되어 있습니다. 해당 한 줄의 주석을 해제하면 작업 검색의 GitHub·GitLab 항목을 모두 복원할 수 있습니다. 명령 정의와 연동 구현은 유지하며, 일반 Git의 Fetch/Pull/Push는 계속 표시합니다.


### 이력 검색 빈 결과
전체 이력 메시지 검색은 입력창을 유지하고 아래에 결과를 표시합니다. 검색 전·로딩·결과 없음·실패를 구분합니다. 조회 결과가 빈 문자열/배열이면 일반 조회 창에서도 빈 화면 대신 안내를 표시합니다.


### 전체 이력 검색 결과 탐색
전체 이력 메시지 검색 결과는 메시지·해시·작성자·날짜를 구분한 클릭 가능한 목록입니다. 결과를 클릭하면 검색 창을 닫고 해당 커밋을 그래프에서 선택하여 변경 파일과 diff를 확인합니다. 초기 로딩 범위 밖의 커밋도 직접 조회합니다. 최대 200개 결과 표시 시 제한 안내를 제공합니다.

## 사용 가이드 재촬영 (2026-11-06)

사용 가이드는 현재 Express 실제 이력과 격리된 실습 클론을 기준으로 24개 작업 흐름으로 다시 작성했다. 기존 그림 154개를 현재 화면 41개로 교체했다. 숨긴 GitHub/GitLab 전용 기능은 실행 절차에서 제외한다.

- 본문: `docs/USER_GUIDE.md`. 앱의 책 아이콘에서 같은 문서를 읽는다.
- 이미지: `docs/images/manual-*.png`. 전체 화면은 1440×960, 모달은 실제 영역만 촬영한다. 합성 UI가 아니다.
- 출처·원본 HEAD·실습 경로·촬영 시각: `docs/guide-captures.json`.
- 재촬영: `scripts/capture-guide-current.mjs`. 이전 capture-guide 진입점들은 이 스크립트로 연결된다.
- 사전 준비: Express를 `~/pgit-guide-projects/express`에 복제한다. 다른 위치는 `PGIT_GUIDE_SOURCE`, 실습 상위 폴더는 `PGIT_GUIDE_WORKSPACE`로 지정한다.
- 실행: `PGIT_BROWSER_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/capture-guide-current.mjs`. Node 22 이상과 npm 의존성이 필요하다.
- 매 실행에서 HTTPS로 새 실습 클론을 만든다. 네트워크가 필요하다. 원본 클론은 읽기 전용이며 변경·커밋·스태시·충돌은 새 session 폴더에서만 만든다. 원격 Push를 실행하지 않는다. 실습 폴더는 검토용으로 남긴다.
- Express: https://github.com/expressjs/express (MIT). 화면 속 소스의 원래 저작권 표기를 유지한다.
- 검증: `test/ui-settings.mjs`가 본문/촬영 manifest의 일치, 이미지 제공, 목차, 검색, 확대·포커스 복원, 좁은 화면을 검사한다.

화면을 바꾼 뒤 가이드를 갱신할 때는 데이터 요청과 Git 작업 완료를 기다린 다음 찍고 실제 그림을 열어 확인한다. 이력 정리는 현재 ‘정리할 첫 커밋부터 최신까지’를 고르는 단계형 UI다. 이전 ‘기준 커밋 다음부터’ 설명을 다시 넣지 않는다.

## Diff 안에서 부분 스테이징 (2026-11-06)

변경 사항의 비교 화면에서 변경 블록과 추가·삭제 줄을 직접 체크하고 선택한 변경을 스테이징/해제한다. 부분 선택 블록은 indeterminate이며 체크 자체는 Git을 변경하지 않는다. 기존 부분 스테이징 모달은 작업 검색에 남기고 파일 툴바의 중복 진입 버튼은 숨겼다.

`renderCodeDiff`의 선택 모델은 가상화·좌우/통합 보기·접기와 독립적이다. Git hunk의 줄 번호/내용과 실제 렌더링한 Diff를 대조해 어긋난 미리보기에서는 선택을 제공하지 않는다. 공백 무시 보기로 전환하면 선택을 비우고 선택 동작을 제한한다. 실제 패치에 없는 시각적 줄을 스테이징하지 않도록 유지한다.

`stageSelection`은 여러 블록의 선택을 하나의 패치로 만들어 revision 검증 및 Git apply --check 이후 인덱스에 적용한다. 블록마다 연속 호출해 인덱스가 중간 상태로 남는 구조로 바꾸지 않는다. 새 파일·삭제·이름 변경·모드 변경·비텍스트는 기존 파일 단위 작업을 사용한다.

검증: `test/advanced.test.mjs`의 다중 블록·오래된 revision·실패 시 인덱스 보존·역적용, `test/ui-inline-staging.mjs`의 혼합 선택·보기 전환·스테이징/해제·실제 부분 커밋·바이너리 안내. 전체 단위 테스트 111개 및 기존 Diff UI 회귀 검사를 통과했다.

## 빨간 번호 클릭 가이드 (2026-11-08)

24개 장 모두 열기 경로 → 실제 화면의 빨간 번호별 조작 → 완료 확인 → 알아두기 형식으로 교체했다. 41개 이미지는 최신 UI를 deviceScaleFactor 2로 촬영한다. `scripts/guide-callouts.mjs`가 실제 DOM 위치에서 빨간 테두리·번호·화살표를 계산하며 캡처 후 오버레이를 제거한다. 제품 화면에는 주석이 남지 않는다. 캡처 대상이 없으면 실패시켜 낡은 위치로 안내하지 않는다.

1. `node scripts/capture-guide-current.mjs`로 격리된 Express 실습 저장소와 모든 캡처를 만든다.
2. `node scripts/write-guide-current.mjs`로 24개 장의 설명과 캡처 manifest의 번호별 설명을 합쳐 `docs/USER_GUIDE.md`를 갱신한다.
3. `PGIT_BROWSER_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node test/ui-settings.mjs`로 이미지 경로·번호·본문 연결, 검색·목차·확대 동작을 확인한다.
4. 실제 그림을 열어 번호 위치·화살표·가려진 글자·선택 상태를 검토한다. 입력·실행·결과 확인을 구분하고 버튼을 누르지 않는 조회 단계는 확인이라고 쓴다.

화면 문구 또는 가이드 설명을 바꿀 때 `write-guide-current.mjs`와 필요 시 `guide-callouts.mjs`를 함께 수정한다. 자동 생성된 Markdown만 수정하면 다음 생성 때 덮어쓴다. 생성 원본도 인수인계 ZIP에 포함한다.
