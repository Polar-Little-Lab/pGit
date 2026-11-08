# pGit

**여러 저장소의 변경을 검토하고 필요한 내용만 커밋하는 Windows·macOS Git 클라이언트입니다.**

[1.0.0 정식 버전](https://github.com/Polar-Little-Lab/pGit/releases/latest) · [사용 가이드](docs/USER_GUIDE.md)

## 다운로드

| 운영체제 | 설치 파일 |
|---|---|
| Windows 10/11 · x64 | [Windows 설치 프로그램](https://github.com/Polar-Little-Lab/pGit/releases/download/v1.0.0/pGit-1.0.0-windows-x64-setup.exe) |
| macOS · Apple Silicon | [Mac ARM64 DMG](https://github.com/Polar-Little-Lab/pGit/releases/download/v1.0.0/pGit-1.0.0-macos-arm64.dmg) |
| macOS · Intel | [Mac x64 DMG](https://github.com/Polar-Little-Lab/pGit/releases/download/v1.0.0/pGit-1.0.0-macos-x64.dmg) |

Mac ZIP 파일과 `SHA256SUMS.txt`는 [릴리스 첨부 파일](https://github.com/Polar-Little-Lab/pGit/releases/tag/v1.0.0)에서 받을 수 있습니다.

## 개발한 기능

### 프로젝트 작업 공간

- 여러 저장소를 탭으로 열고 프로젝트별 작업 화면을 유지합니다.
- 프로젝트를 그룹으로 묶고 로고·아이콘·색상으로 구분합니다. 그룹에 속한 저장소를 함께 열 수 있습니다.
- 최근 사용한 프로젝트 3개와 그룹별 저장소 목록, 이름·경로 검색을 제공합니다.
- 로컬 저장소 열기, 원격 저장소 복제, 새 저장소 초기화를 지원합니다. 복제 중에는 진행 상태를 표시합니다.

### 커밋 이력 탐색과 변경 검토

- 브랜치·태그와 분기·병합 관계를 커밋 그래프로 표시합니다. 스크롤하면 다음 이력을 미리 불러옵니다.
- 전체 이력의 커밋 메시지를 검색하고 결과를 눌러 해당 커밋으로 이동할 수 있습니다.
- 파일 이력과 줄별 작성 이력(Blame)으로 변경 시점과 작성자를 확인합니다.
- 좌우·통합 Diff, 문법 색상, 변경된 단어 강조, 공백 비교, 스크롤 동기화와 변경 구간 이동을 제공합니다.

### 필요한 변경만 커밋

- 작업 중인 변경과 스테이징된 변경을 나누어 보여줍니다.
- 파일 전체뿐 아니라 변경 블록이나 개별 줄을 선택해 스테이징할 수 있습니다.
- 새 텍스트 파일과 필요한 폴더를 만들고, 기존 파일을 직접 편집·저장할 수 있습니다.
- 폴더 트리에서 추적하지 않는 파일을 골라 `.gitignore`에 추가합니다.
- 커밋 메시지만 수정하는 작업과 마지막 커밋에 파일 변경을 추가하는 작업을 구분합니다.

### 브랜치·원격·이력 관리

- 브랜치 생성·전환·이름 변경·삭제, 태그와 원격 저장소 관리를 제공합니다.
- Fetch·Pull·Push와 자동 Fetch를 지원합니다. Pull은 fast-forward only, Merge, Rebase 방식을 선택합니다.
- 병합 사전 검사, 충돌 해결 편집기, 작업 계속·중단을 제공합니다.
- Cherry-pick, Revert, Reset과 커밋 메시지 수정을 지원합니다.
- 선형 커밋 이력의 순서·메시지·합치기·제외를 편집하고 결과를 미리 확인할 수 있습니다.

### 보관과 복구

- Stash 생성·조회·적용·삭제와 Worktree 생성·조회·제거·잠금을 제공합니다.
- 서브모듈 상태 확인과 초기화·갱신을 지원합니다.
- 지원되는 파일 변경 버리기는 복구본을 남기며, Reset 실행 취소·다시 실행과 Reflog 조회를 제공합니다.

### 검색·설정·사용 가이드

- `Cmd/Ctrl+K` 작업 검색에서 이름이나 익숙한 표현으로 작업을 찾습니다. 예: 파일 추가 → 새 파일, 브랜치 추가 → 브랜치 만들기.
- 밝은·어두운 테마, 글꼴·글자 크기, 6개 언어와 자동 Fetch 주기를 설정할 수 있습니다.
- 저장소별 커밋 작성자와 기존 Git 키를 이용한 서명 여부를 설정합니다.
- 첫 커밋까지 안내하는 시작 가이드와 실제 화면 44장·24개 장으로 구성된 사용 가이드를 제공합니다.

## 첫 커밋까지

1. Git 설치 상태를 확인하고 저장소를 열거나 복제합니다.
2. **변경 사항**에서 파일을 눌러 변경 전후를 확인합니다.
3. 이번 커밋에 넣을 파일·블록·줄만 스테이징합니다.
4. 메시지를 작성하고 **스테이징한 변경 커밋**을 누릅니다.
5. 원격에 공유할 때 **Push**를 사용합니다.

파일 저장, 스테이징, 커밋, Push는 서로 다른 단계입니다. 커밋은 인덱스 전체를 기록하므로 외부 도구에서 이미 스테이징한 내용도 함께 확인하세요.

## 지원 범위

- Git은 별도 설치가 필요합니다. Node.js는 데스크톱 앱에 포함됩니다. 앱에서 Git 설치 안내와 설치 확인을 제공합니다.
- 부분 스테이징은 지원되는 추적 텍스트 파일에 적용합니다. 새 파일·삭제·이름 변경·바이너리는 파일 단위로 처리합니다.
- 커밋 이력 정리는 병합 커밋을 포함하지 않는 지원 범위의 선형 이력을 대상으로 합니다. 이미 공유한 이력을 수정할 때는 다른 작업자와 조율하세요.
- GitHub·GitLab 전용 리뷰·이슈 연동은 현재 작업 검색에서 숨겨져 있습니다. 일반 Git 원격 작업은 사용할 수 있습니다.
- Windows 게시자 인증서 서명과 Apple 공증은 아직 적용되지 않았습니다.
- 텍스트 편집은 1MB 이하 일반 텍스트 파일을 지원합니다. Diff는 큰 파일·바이너리·서브모듈 등 미리보기가 제한되는 상태를 따로 안내합니다.
- Windows·macOS CI에서 기능·UI 검사와 설치·실행 검증을 수행합니다. Windows Server 2022 자동 검증은 Windows 10/11 실기기 수동 검증을 대신하지 않습니다.

## 개발 및 검증

Node.js 22 이상과 Git이 필요합니다.

```sh
git clone https://github.com/Polar-Little-Lab/pGit.git
cd pGit
npm ci
npm start
```

터미널에 표시되는 로컬 주소를 열면 브라우저에서 실행됩니다. 데스크톱 앱은 `npm run desktop`으로 실행합니다.

```sh
npm test
npx playwright install chromium
npm run test:ui
npm run test:desktop
```

운영체제에 맞는 설치 파일을 생성합니다. 결과는 `dist/`에 저장됩니다.

```sh
npm run dist:mac
npm run dist:win
```

## 코드와 문서

| 위치 | 역할 |
|---|---|
| `public/` | 프로젝트 탭·그룹, 그래프·Diff, 스테이징과 설정 화면 |
| `git.mjs`, `operations.mjs`, `advanced.mjs` | Git 작업과 파일 편집·이력 관리 |
| `server.mjs` | 로컬 API와 저장소별 요청 처리 |
| `desktop/` | Electron 앱, 창과 프로젝트 목록 저장 |
| `test/` | Git 기능·브라우저 UI·데스크톱 검증 |
| `scripts/` | 아이콘 빌드, 가이드 촬영·문서 생성 |

- [사용 가이드](docs/USER_GUIDE.md): 화면의 빨간 번호를 따라 수행하는 기능별 절차
- [AI 작업 인수인계](docs/GPT_HANDOFF.md): 구조와 구현·검증 시 참고할 내용
- [웹 GPT 작업 안내](docs/GPT_WEB_TASK_PROMPT.md): 원격 작업을 위한 안내
- [프로젝트 작업 공간](docs/ARCTIC_WORKSPACE.md): 탭과 저장소별 상태 관리

Powered by Polar.
