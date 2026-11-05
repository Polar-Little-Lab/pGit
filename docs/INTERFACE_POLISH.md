# 화면과 움직임 개선

기준: main `84e90c8`. 브랜치: `codex/interface-motion-polish`. 시각 검토 후 2026-11-05 사용자 승인으로 main에 병합했다.

## 방향

Stageshow의 [SKILL.md](https://github.com/benjitaylor/skills/blob/main/stageshow/SKILL.md)에서 시선의 중심, 실제 제품의 맥락, 원인이 있는 움직임, 정지 화면의 완성도를 참고했다. pGit에는 모형 UI나 React kit를 설치하지 않고 기존 HTML/CSS/JavaScript에 적용했다.

- 큰 장식 그래프와 그라데이션 배너를 제거하고 최근 작업의 이름·경로·브랜치·열기를 첫 화면의 중심에 둔다.
- 최근 작업 옆에 열기/복제/만들기 동작을 압축된 행으로 배치한다. 작은 화면에서는 아래로 내려간다.
- 그룹 목록은 겹친 카드 테두리를 줄이고 구분선·아이콘·그룹 색상으로 계층을 표시한다. 최근 저장소 목록은 행 높이를 줄이고 경로를 고정폭 글꼴로 정렬한다.
- Frost와 Polar Night의 배경을 중립적인 회색으로 바꾸고 파란색은 주요 동작과 선택에 유지한다. 다른 4개 테마의 색상은 유지한다. 테마 토큰의 변경은 작업 공간에도 적용된다.

## 움직임

- 홈 진입: 180ms, 5px 이동과 페이드. 저장소 새로고침 시 반복되지 않는다.
- 그룹: 180ms 높이 전환과 펼침 화살표 회전. 닫는 동안 내부 항목은 inert로 키보드 포커스에서 제외한다. 빠르게 다시 누르면 진행 중인 애니메이션을 취소하고 현재 높이에서 반대로 움직인다.
- 모달: native showModal에 CSS starting-style로 180ms 진입. 포커스·Esc 동작을 지연시키지 않는다.
- 행·작업 버튼: 120ms 색상 전환. 유휴 루프와 Git 상태를 연출하는 가짜 진행률은 없다.
- prefers-reduced-motion에서는 새 이동·전환을 제거하고 그룹 상태도 즉시 반영한다.

## 검증과 되돌리기

로컬 `npm test`: 103 통과, 1 skipped, 실패 0. 기본 6개 테마의 본문/버튼 명암비 검사도 포함한다. 새 UI 검증은 `node test/ui-interface-polish.mjs`: 키보드·빠른 재클릭·모션 감소·6개 언어의 좁은 화면·모달 닫기와 empty/light/dark/compact PNG를 생성한다. 기존 그룹 테스트도 애니메이션 완료를 기다리도록 수정했다.

후속 로컬 Chrome 검증에서 ui-interface-polish, ui-group-home, ui-project-groups가 통과했다. CI 산출물은 `pGit-ui-verification-*`의 `interface-*.png`다. 플랫폼별 패키지 사용성 검수는 별도다.

주요 스타일은 `public/interface-polish.css`에 분리했다. 서버 정적 파일 허용 목록에 추가했으며 데스크톱의 기존 `public/*.css` 패키징에 포함된다. 스키마·사용자 저장 데이터·Git 명령은 변경하지 않는다. PR 전체를 revert하면 이전 화면으로 되돌릴 수 있다.
