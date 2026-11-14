# 의존성 보안 업데이트 자동화

- Dependabot alerts와 security updates로 알려진 취약점을 탐지하고 수정 PR을 생성합니다.
- npm 버전은 매일 확인합니다. 일반 버전 업데이트는 게시 후 7일 대기하며 보안 업데이트에는 이 대기 기간을 적용하지 않습니다.
- GitHub Actions 업데이트는 매주 확인하고 검토용 PR로 남깁니다.
- 매일 `npm audit --include=dev --audit-level=high`를 실행합니다. 앱에 포함되는 Electron도 검사하며 high/critical 취약점은 검사를 실패시킵니다.
- npm 패치·마이너 업데이트만 자동 병합을 예약합니다. 메이저 버전과 Actions 변경은 사람이 검토합니다.
- main의 필수 검사 `Dependency update gate`(Linux·Windows 기능/UI 검사 전체)와 `audit`가 성공해야 병합할 수 있습니다. 최신 main 기준으로 검사를 다시 요구합니다.
- 권한이 있는 자동 병합 작업은 PR 코드를 실행하지 않습니다. Dependabot이 생성한 동일 저장소 PR이며 변경 파일이 package.json/package-lock.json뿐인지 확인합니다.

## 저장소 설정

Dependabot alerts/security updates 및 Allow auto-merge를 활성화합니다. main 브랜치 보호에서 위 두 검사를 필수로 지정합니다. 자동 병합 작업도 해당 보호 설정이 존재하는지 확인하며, 없으면 실패합니다.

## 앱 릴리스와의 구분

여기서 자동으로 올리는 버전은 **의존성 버전**입니다. pGit 자체 버전과 Windows/macOS 릴리스는 별도입니다. 봇이 병합한 변경은 GITHUB_TOKEN 이벤트 재실행 제한도 있으므로 자동 배포에 의존하지 않습니다. 릴리스 시 앱 버전을 올리고 기존 데스크톱 빌드 워크플로로 검증·배포합니다.

취약점이 알려지지 않았거나 패치가 없는 경우까지 자동 해결하지는 못합니다. 실패한 audit 실행과 Dependabot Security 탭에서 조치 대상을 확인하세요.

참고: https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions
