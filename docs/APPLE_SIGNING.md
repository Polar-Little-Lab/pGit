# macOS Developer ID 서명과 Apple 공증

pGit은 GitHub에서 DMG/ZIP으로 배포하므로 **Developer ID Application** 인증서를 사용합니다. Mac App Store 배포용 인증서와는 다릅니다. 개발자 가입만으로 인증서와 CI 인증 정보가 자동 등록되지는 않습니다.

## Apple 계정 준비

1. Apple Developer Program 가입 승인이 완료되어 있어야 합니다.
2. 키체인 접근 → 인증서 지원 → 인증 기관에서 인증서 요청에서 CSR을 디스크에 저장합니다. Apple Developer의 Certificates → + → **Developer ID Application**에 CSR을 올려 발급받고, 내려받은 `.cer`를 CSR을 만든 Mac의 로그인 키체인에 추가합니다. 이미 사용한 CSR은 재사용하지 말고 새로 생성합니다. Xcode의 Manage Certificates에서도 생성할 수 있습니다.
3. Keychain Access의 내 인증서에서 해당 인증서와 개인 키를 함께 암호화된 `.p12`로 내보냅니다. `.cer`만으로는 CI에서 서명할 수 없습니다.
4. App Store Connect의 Users and Access → Integrations에서 공증에 사용할 제품 개발(Developer) 권한의 **Team API Key**를 생성합니다. `.p8`, Key ID, Issuer ID를 준비합니다. 키 생성 권한이 없다면 Account Holder에게 요청합니다.

## GitHub 설정

저장소 Settings → Secrets and variables → Actions에 다음 **Secrets**를 등록합니다. 개인 키나 암호를 채팅·문서·커밋에 넣지 않습니다.

| Secret | 값 |
|---|---|
| `APPLE_CERTIFICATE_P12_BASE64` | 개인 키가 포함된 .p12 파일을 Base64로 인코딩한 값 |
| `APPLE_CERTIFICATE_PASSWORD` | .p12 내보내기 암호 |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: 개발자 이름 (TEAMID)` 전체 이름 |
| `APPLE_API_KEY_BASE64` | Team API Key .p8 파일을 Base64로 인코딩한 값 |
| `APPLE_API_KEY_ID` | API Key ID |
| `APPLE_API_ISSUER` | API Issuer ID |

값을 터미널에 출력하지 않고 GitHub CLI로 직접 등록할 수 있습니다.

```sh
base64 < /안전한/경로/certificate.p12 | tr -d '\n' | gh secret set APPLE_CERTIFICATE_P12_BASE64 --repo Polar-Little-Lab/pGit
base64 < /안전한/경로/AuthKey.p8 | tr -d '\n' | gh secret set APPLE_API_KEY_BASE64 --repo Polar-Little-Lab/pGit
# 아래 명령은 값을 대화형으로 입력합니다.
gh secret set APPLE_CERTIFICATE_PASSWORD --repo Polar-Little-Lab/pGit
gh secret set APPLE_SIGNING_IDENTITY --repo Polar-Little-Lab/pGit
gh secret set APPLE_API_KEY_ID --repo Polar-Little-Lab/pGit
gh secret set APPLE_API_ISSUER --repo Polar-Little-Lab/pGit
```

모두 등록한 뒤 Actions **Variable** `APPLE_SIGNING_ENABLED`를 `true`로 설정합니다. 이 값은 비밀 정보가 아닙니다.

```sh
gh variable set APPLE_SIGNING_ENABLED --body true --repo Polar-Little-Lab/pGit
```

## 빌드·배포

- 기존 `Build desktop downloads` 워크플로를 사용합니다.
- 먼저 workflow_dispatch로 실행하여 서명·공증된 산출물과 실제 실행을 확인합니다. 수동 실행은 기존 publish 조건상 릴리스를 게시하지 않습니다.
- 서명 빌드는 별도 설정을 사용하며, 기존 임시 서명 afterPack 훅을 실행하지 않습니다.
- Hardened Runtime과 Electron JIT entitlement를 활성화합니다. electron-builder가 Developer ID 서명과 공증, 앱 티켓 부착을 수행합니다.
- ARM64/x64 양쪽 앱을 codesign, stapler, Gatekeeper로 검증합니다. 실패하면 산출물 게시 단계에 도달하지 않습니다.
- API 키 파일은 임시 디렉터리에서만 사용하고 빌드 종료 시 삭제합니다.
- 서명을 활성화한 뒤 인증 정보가 누락되면 빌드를 실패시킵니다. 임시 서명으로 대체해 배포하지 않습니다.
- 변수가 꺼진 동안에는 기존 임시 서명 방식입니다. 현재 공개된 설치 파일은 자동 변경되지 않습니다.
- Windows 코드 서명은 Apple 인증서로 처리할 수 없습니다.

## 확인할 사항

인증서 만료·폐기 또는 API 키 교체 시 GitHub Secrets도 갱신하세요. 첫 공증은 Apple 처리 시간이 길어질 수 있습니다. 서명·공증은 앱 신원을 확인하는 것으로 모든 보안 취약점이 없다는 인증은 아닙니다.

- [Apple Developer ID 인증서](https://developer.apple.com/help/account/certificates/create-developer-id-certificates)
- [Apple 공증 안내](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
