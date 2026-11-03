# UI 공통 컴포넌트

새 화면에서는 기존 컴포넌트를 먼저 사용합니다. 공통 컴포넌트는 DOM 구조와 접근성 상태를 관리하며, Git 요청·초안·비동기 요청 취소 여부는 호출한 화면에서 관리합니다.

| 역할 | API / 파일 | 사용 화면 |
| --- | --- | --- |
| 선택형 메뉴 생성 | `PgitUI.segments()` / `public/ui-components.js` | 브랜치 시작점, 원격 PR·MR·이슈, Diff 보기·공백 옵션 |
| 기존 버튼 그룹 연결 | `PgitUI.selectionGroup()` | 프로젝트 추가 방식, 리뷰 상세 메뉴 |
| 모달 제목·닫기 | `PgitUI.dialogHeader()` | 작업 검색·입력·결과, 고급 작업, 워크트리, 가이드·이미지 확대 |
| 단독 닫기 버튼 | `PgitUI.closeButton()` | 공통 모달 헤더 내부 |
| 레이블과 입력 연결 | `PgitUI.labeledField()` | 브랜치·커밋·참조 선택 필드 |
| 외부 링크 | `PgitUI.externalLink()` | 원격 저장소 링크, PR·MR·이슈·CI 항목 |
| 폴더 선택 | `PgitFolderPicker` / `public/folder-picker.js` | 프로젝트 열기·생성·복제, 작업 검색 생성·복제, 워크트리 |
| 커밋 선택 | `PgitCommitPicker` / `public/commit-picker.js` | Reset, 체리픽, 브랜치 시작점 등 |
| 아이콘 | `PgitIcons` / `public/icons.js` | 버튼·탭·사이드바 |
| 작업 설명 | `PgitCommandHelp` / `public/command-help.js` | 작업 검색과 실행 화면 |

## 선택형 메뉴

```js
const modes = PgitUI.segments({
  items: [['branch', '브랜치'], ['commit', '커밋']],
  value: 'branch',
  label: '시작점 선택',
  onChange: value => showFields(value),
});
container.append(modes.element);
modes.setValue('commit');
```

`setValue()`는 화면의 선택 상태만 바꾸고 `onChange`를 실행하지 않습니다. 사용자가 버튼을 클릭하면 상태를 갱신한 뒤 콜백을 실행합니다. 버튼은 `type="button"`이므로 폼을 제출하지 않습니다. 선택 상태는 `aria-pressed`와 `active` 클래스로 표시합니다. `buttons` 맵으로 각 버튼의 툴팁이나 비활성 상태를 지정할 수 있습니다.

기존 DOM 버튼을 보존해야 하면 `selectionGroup(element, {items: [{value, button}], ...})`을 사용합니다. 별도의 클릭 핸들러나 선택 상태 갱신 루프를 중복해서 추가하지 않습니다. 모달형 메뉴는 `reference-modes`, 좁은 도구막대는 `ui-segmented` 스타일을 사용합니다.

## 모달과 입력

`dialogHeader(dialog, title)`은 `{element, title, close}`를 반환하며, 모달의 `aria-labelledby`를 제목에 연결합니다. 제목을 바꿔야 하는 워크트리처럼 `title.textContent`를 갱신해도 연결은 유지됩니다. `className`, `titleTag`, `titleId` 옵션으로 가이드 헤더처럼 기존 레이아웃을 유지할 수 있습니다.

`labeledField(text, control)`은 입력의 고유 ID와 레이블의 `for`를 연결합니다. 입력 검증과 값 처리는 화면에서 담당합니다.

## 외부 링크

`externalLink(anchor, url)`은 HTTPS 주소만 허용하고 URL 내 사용자 이름·비밀번호를 거부합니다. 성공하면 새 창 및 `noopener noreferrer` 속성을 설정하고 `true`를 반환합니다. 실패하면 클릭 가능한 링크를 만들지 않습니다. 저장소 제목·본문 등 외부 데이터는 항상 `textContent`로 렌더링합니다.

## 검증

공통 컴포넌트를 수정하면 해당 사용 화면의 테스트를 실행합니다. 이번 공통화는 작업 설명, 브랜치·커밋 선택, 프로젝트 대화상자, 6개 폴더 선택 컨트롤, 리뷰 상세·원격 목록, Diff 편집기, 설정·가이드 UI 테스트로 검증했습니다.
