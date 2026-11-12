# pGit 기술 스택

기준: v1.1.0 / 2026-11-13. 실제 의존성 버전은 `package.json`과 `package-lock.json`이 기준입니다.

pGit은 사용자 PC에 설치된 Git을 GUI로 조작하는 Windows·macOS 데스크톱 앱입니다. Electron 내부에서 Node.js HTTP 서버를 실행하고, 로컬 화면에서 저장소 상태를 조회하거나 Git 작업을 요청합니다.

## 구성 요소

| 영역 | 기술 / 버전 | 역할 | 주요 파일 |
|---|---|---|---|
| 언어 | JavaScript ES Modules / CommonJS | 서버·화면·데스크톱 코드 | `*.mjs`, `desktop/*.cjs`, `public/*.js` |
| 화면 | HTML / CSS / 순수 JavaScript | 프로젝트 탭, Git 그래프, Diff, 변경 선택 | `public/shell.html`, `public/index.html`, `public/diff-viewer.js` |
| 데스크톱 | Electron 45.3.1 | Chromium 화면, Node.js 런타임, 창·IPC·폴더 선택 | `desktop/main.cjs`, `desktop/preload.cjs` |
| 로컬 API | Node.js 내장 `http` | loopback HTTP 서버 및 POST `/api` 라우팅 | `server.mjs` |
| 파일·프로세스 | Node.js `fs`, `path`, `crypto`, `child_process` | 파일 저장, 임시 경로, 토큰 생성, CLI 실행 | `git.mjs`, `advanced.mjs`, `git-runtime.mjs` |
| Git 엔진 | 사용자 PC의 Git CLI | clone, diff, stage, commit, fetch, push, rebase 등 | `git.mjs`, `operations.mjs`, `history-edits.mjs` |
| GitHub / GitLab | 외부 CLI `gh` / `glab` | PR/MR·리뷰·이슈 API 연동 코드 | `providers.mjs`, `provider-review.mjs` |
| 설정 저장 | 로컬 JSON / 브라우저 localStorage | 워크스페이스, 최근 프로젝트, 화면 설정 | `desktop/workspace-store.cjs`, `public/settings.js` |
| 패키징 | electron-builder 26.18.0 | Windows NSIS, macOS DMG·ZIP | `package.json`의 `build` |
| 단위·통합 테스트 | Node.js 내장 `node:test` | Git 작업·검증·상태 및 경로 처리 | `test/*.test.mjs` |
| UI / 데스크톱 테스트 | Playwright 1.58.2 | Chromium UI와 패키징된 앱 실행 검증 | `test/ui*.mjs`, `test/desktop*.mjs` |
| CI/CD | GitHub Actions | OS별 테스트·설치 파일 빌드·검증·릴리스 | `.github/workflows/` |

React, Vue, Express, ORM 및 별도 DB 서버는 사용하지 않습니다. 코드 비교와 문법 강조는 저장소 내부 코드로 구현되어 있습니다. GitHub·GitLab 전용 기능은 구현 코드가 있지만 현재 일반 사용자 작업 검색에서는 숨겨져 있습니다.

## 실행 구조

| 단계 | 동작 |
|---|---|
| 1. 앱 시작 | Electron main 프로세스가 로컬 서버를 시작하고 해당 URL을 BrowserWindow에 로드합니다. |
| 2. 화면 요청 | HTML·JavaScript 화면이 같은 origin의 `/api`에 action과 입력값을 전달합니다. |
| 3. 작업 처리 | Node.js가 작업 공간별 저장소를 확인하고 Git CLI를 인자 배열로 실행합니다. |
| 4. 결과 표시 | Git 실행 결과를 파싱해 JSON으로 반환하고 화면 상태와 Diff를 갱신합니다. |
| 5. 네이티브 기능 | 폴더 선택·워크스페이스 저장은 preload의 제한된 IPC 인터페이스를 통해 처리합니다. |

로컬 서버는 `127.0.0.1`의 임의 포트만 사용합니다. 원격 Git 서버와의 네트워크 통신·인증은 Git 및 외부 CLI의 설정과 자격 증명 처리에 의존합니다. 원격 호스팅 백엔드에 프로젝트 파일을 일괄 업로드하는 구조가 아닙니다.

## 런타임과 지원 플랫폼

- 개발 Node.js 조건은 `>=22`, CI는 Node.js 22입니다. 데스크톱 앱은 Electron에 내장된 Node.js를 사용하므로 개발용 Node.js와 버전 관리 경로가 다릅니다.
- Windows 패키지 대상은 x64이며, 자동 검증은 Windows Server 2022/2025 환경을 사용합니다. Windows 10/11 실기기 수동 검증과는 구분합니다.
- macOS 패키지는 arm64와 x64를 제공합니다. Electron 44 이상부터 **macOS 13 Ventura 이상**이 필요합니다.
- Git은 별도 설치가 필요합니다. `gh`와 `glab`은 해당 연동 기능을 사용할 때 필요합니다. 이 실행 파일들은 npm lockfile에 버전이 고정되지 않습니다.

## 직접 사용하는 npm 오픈소스

| 패키지 | 버전 | 라이선스 | 용도 |
|---|---|---|---|
| electron | 45.3.1 | MIT | 배포 앱 런타임 |
| electron-builder | 26.18.0 | MIT | 설치 파일 생성 |
| playwright | 1.58.2 | Apache-2.0 | UI·데스크톱 테스트 |

세 패키지는 모두 `devDependencies`에 선언되어 있습니다. 하지만 Electron은 실제 배포 앱의 런타임이므로 개발 의존성을 보안 검사에서 제외하면 안 됩니다. 하위 의존성은 lockfile에 기록하며, Electron의 Chromium·Node.js 등 번들 구성요소 고지도 별도로 유지해야 합니다.

주요 하위 도구에는 `app-builder-lib`, `@electron/asar`, `@electron/universal`, `tar`, `minimatch` 등이 있습니다. v1.1.0 갱신 시 `tar`는 7.5.23, `builder-util-runtime`은 9.7.0으로 변경됐습니다.

## 아이콘 및 외부 자산

AWS 공식 아키텍처 아이콘, gilbarbara/logos, Wikimedia, Toss 및 금융기관 공식 자산을 로컬에 포함합니다. 출처와 자산 목록은 [GROUP_ICON_SOURCES.md](GROUP_ICON_SOURCES.md)에 기록되어 있습니다. 출처 명시와 재배포 허가는 별개이며, 상표와 자산별 사용 조건을 확인해야 합니다.

## 보안 설정과 갱신 정책

- Electron: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
- IPC: 발신 창, main frame, URL 검증.
- HTTP: loopback 바인딩, Host·Origin·무작위 토큰 검사, 요청 크기 제한.
- Git: `execFile`/`spawn` 인자 배열 사용, 파일 작업 경로·심볼릭 링크 검사.
- Dependabot: npm 및 GitHub Actions 주간 업데이트 PR.
- 보안 CI: `npm audit --include=dev --audit-level=high`.

v1.1.0 준비 시 npm audit에서 Critical/High 항목은 0개이며, 빌드 도구의 minimatch에서 파생된 Moderate 6개 항목이 남았습니다. 이는 공격 가능성을 입증한 수치가 아닙니다. [SECURITY_REVIEW.md](SECURITY_REVIEW.md)에 범위와 한계를 정리했습니다.

현재 CSP에는 `unsafe-inline`이 있으며 macOS는 ad-hoc 서명, hardened runtime 비활성 상태입니다. Windows 게시자 인증서 서명과 Apple 공증은 적용하지 않았습니다.

## 실행 및 검증 명령

```sh
npm ci
npm start                 # 브라우저용 로컬 서버
npm run desktop           # Electron 앱 실행
npm test
npx playwright install --with-deps chromium
npm run test:ui
npm audit --include=dev
```

OS별로 `npm run dist:win` 또는 `npm run dist:mac`을 실행합니다. 패키지 버전 변경이 main에 반영되면 릴리스 워크플로가 Windows·macOS 빌드와 실행 검증을 수행하고, 두 작업이 성공한 뒤 해당 버전의 태그·설치 파일·SHA-256 체크섬을 게시합니다. 릴리스 노트는 `docs/releases/v<버전>.md`에 함께 준비해야 합니다.
