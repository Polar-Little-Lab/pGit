# pGit 동작 보존 기준

- 프로젝트 열기·탭 전환·재시작 복원·프로젝트별 초안: `test/ui-tabs.mjs`, `test/ui-tab-restore.mjs`.
- 스테이징·커밋·이력 편집·충돌: 기존 `test/*.test.mjs` 및 `test/run-ui-tests.mjs` 전체 시나리오.
- 프로젝트 그룹·설정·테마·언어·사이드바: 해당 기존 UI 테스트를 유지합니다. 공통 디자인 컴포넌트를 우선 사용합니다.
- Windows 설치와 실제 Electron 앱 열기: `npm run test:desktop`; macOS ARM64/Intel 서명·공증은 release workflow.
- 저장소 데이터·설정 포맷·appId `dev.polar.pgit`를 의도 없이 변경하지 않습니다.

검증: `npm test`, `npm run test:ui`, Windows 2022/2025 및 Linux Actions. 배포 빌드의 설치/실행 검사도 별도로 필요합니다. DOM 검사는 시각적 동등성이나 모든 실제 사용자 환경을 보장하지 않으므로 UI 변경은 전후 화면과 핵심 흐름을 직접 확인합니다.
