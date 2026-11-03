# 작업 화면 단계 점검 (2026-11-03)

작업 검색에 노출되는 항목은 검색 후 클릭해 열고, 진행 중 작업용 항목은 해당 진입 함수를 통해 열었다. 총 75개 작업의 설명·입력·버튼을 확인했다. 임시 저장소에서 생성·전환·커밋·Reset·충돌 해결·복구를 검증했다. 외부 서비스의 댓글·승인·병합·체크아웃 응답은 테스트 대역으로 확인했으며 실제 사내 서버나 GitHub에 게시하지 않았다.

## 이번 변경

- Reflog, 서브모듈 상태, LFS 상태는 조회 결과를 바로 연다.
- Reset 실행 취소·다시 실행, 버린 변경 복구는 기록 목록을 바로 연다. 실제 복구는 목록에서 확인한 뒤 실행한다.
- GitHub PR·이슈·Actions, GitLab MR·이슈·Pipelines는 결과 목록을 바로 연다. 여러 원격은 결과 화면 안에서 선택한다.
- PR/MR 목록의 체크아웃은 선택된 원격·번호를 전달한다. 다시 번호를 입력하지 않는다.
- Reflog의 한국어 표시를 ‘로컬 작업 기록 (Reflog)’으로 바꾸고 용도와 한계를 설명한다. 예전 검색어 ‘참조 이동 기록’도 지원한다.
- 가이드 설명과 11개 조회 화면 스크린샷을 갱신했다. 원격이 없는 안내 화면은 실제로 원격을 등록하지 않은 저장소에서 촬영했다.

## 유지한 단계

이름·경로·메시지 입력, 대상이 정해지지 않은 작업 검색, 삭제·변경 폐기, Reset 방식, 리베이스 계획, 원격 댓글·승인·병합은 입력 또는 확인 단계가 필요하다. 충돌 해결의 결과 저장·스테이징과 작업 계속도 별개 단계로 유지한다.

## 검증

- 기본 테스트 89개 통과.
- 작업 진입 75개, 직접 결과·편집 경로 14개, 여러 원격 전환, 조회 실패·빈 상태를 확인.
- 브랜치 문맥 메뉴, 커밋 선택, 마지막 커밋 수정, Reset·실행 취소, 충돌 편집기, 병합 전 검사, 프로젝트 열기, 폴더 선택, 설정·가이드, GitHub/GitLab 목록·리뷰 화면의 UI 테스트 통과.
- 앱 실행 화면에서 조회 전후 HEAD와 작업 파일이 바뀌지 않는 것도 확인.

## 전체 진입 화면 목록

| 작업 ID | 표시 이름 | 진입 형태 |
|---|---|---|
| `branchCreate` | 브랜치 만들기 | 입력·선택·확인 |
| `branchSwitch` | 브랜치 전환 | 입력·선택·확인 |
| `branchRename` | 브랜치 이름 변경 | 입력·선택·확인 |
| `branchDelete` | 브랜치 삭제 | 입력·선택·확인 |
| `remoteAdd` | 원격 추가 | 입력·선택·확인 |
| `remoteRemove` | 원격 제거 | 입력·선택·확인 |
| `remoteList` | 원격 주소 보기 | 직접 결과·편집 |
| `fetch` | Fetch | 입력·선택·확인 |
| `pull` | Pull | 입력·선택·확인 |
| `push` | Push | 입력·선택·확인 |
| `stashSave` | Stash 만들기 | 입력·선택·확인 |
| `stashApply` | Stash 적용 | 입력·선택·확인 |
| `stashPop` | Stash 적용 후 제거 | 입력·선택·확인 |
| `stashDrop` | Stash 삭제 | 입력·선택·확인 |
| `stashDiff` | Stash Diff | 입력·선택·확인 |
| `tagCreate` | 태그 만들기 | 입력·선택·확인 |
| `tagDelete` | 로컬 태그 삭제 | 입력·선택·확인 |
| `mergePreview` | 병합 전 충돌 검사 | 입력·선택·확인 |
| `merge` | 병합 | 입력·선택·확인 |
| `rebase` | 리베이스 | 입력·선택·확인 |
| `cherryPick` | Cherry-pick | 입력·선택·확인 |
| `revert` | Revert | 입력·선택·확인 |
| `continue` | 작업 계속 | 입력·선택·확인 |
| `abort` | 진행 중인 작업 중단 | 입력·선택·확인 |
| `resolve` | 충돌 해결됨으로 표시 | 입력·선택·확인 |
| `undoCommit` | 마지막 커밋 되돌리기 | 입력·선택·확인 |
| `fileHistory` | 파일 이력 | 입력·선택·확인 |
| `blame` | Blame | 입력·선택·확인 |
| `compare` | 두 커밋 비교 | 입력·선택·확인 |
| `reflog` | Reflog | 직접 결과·편집 |
| `worktreeList` | Worktree 목록 | 직접 결과·편집 |
| `worktreeAdd` | Worktree 만들기 | 입력·선택·확인 |
| `worktreeRemove` | Worktree 제거 | 입력·선택·확인 |
| `init` | 새 저장소 만들기 | 입력·선택·확인 |
| `clone` | 저장소 복제 | 입력·선택·확인 |
| `resetPreview` | 커밋으로 Reset | 입력·선택·확인 |
| `resetJournal` | Reset 실행 취소·다시 실행 | 직접 결과·편집 |
| `discardPreview` | 파일 변경 버리기 | 입력·선택·확인 |
| `recoveryList` | 버린 변경 복구 | 직접 결과·편집 |
| `hunks` | 부분 스테이징 | 입력·선택·확인 |
| `readText` | 파일 편집 | 입력·선택·확인 |
| `conflictRead` | 충돌 편집기 | 입력·선택·확인 |
| `diffSides` | 좌우 파일 비교 | 입력·선택·확인 |
| `ignoreFile` | 파일 무시 | 입력·선택·확인 |
| `rebasePlan` | 인터랙티브 리베이스 | 입력·선택·확인 |
| `amend` | 마지막 커밋 수정 | 입력·선택·확인 |
| `searchHistory` | 전체 이력 메시지 검색 | 입력·선택·확인 |
| `worktreeLock` | Worktree 잠금 | 입력·선택·확인 |
| `worktreeUnlock` | Worktree 잠금 해제 | 입력·선택·확인 |
| `submodules` | Submodule 상태 | 직접 결과·편집 |
| `submoduleUpdate` | Submodule 초기화·갱신 | 입력·선택·확인 |
| `lfsStatus` | Git LFS 상태 | 직접 결과·편집 |
| `lfsFetch` | Git LFS Fetch | 입력·선택·확인 |
| `profileRead` | 저장소 작성자 설정 | 직접 결과·편집 |
| `githubPRs` | GitHub Pull Requests | 직접 결과·편집 |
| `githubIssues` | GitHub Issues | 직접 결과·편집 |
| `githubRuns` | GitHub Actions | 직접 결과·편집 |
| `githubPRDiff` | PR Diff | 입력·선택·확인 |
| `githubPRChecks` | PR 검사 결과 | 입력·선택·확인 |
| `githubPRCreate` | Draft PR 만들기 | 입력·선택·확인 |
| `githubPRComment` | PR 댓글 게시 | 입력·선택·확인 |
| `githubPRApprove` | PR 승인 리뷰 | 입력·선택·확인 |
| `githubPRRequestChanges` | PR 변경 요청 | 입력·선택·확인 |
| `githubPRCheckout` | PR 체크아웃 | 입력·선택·확인 |
| `githubIssueCreate` | GitHub 이슈 만들기 | 입력·선택·확인 |
| `githubIssueComment` | 이슈 댓글 게시 | 입력·선택·확인 |
| `gitlabMRs` | GitLab Merge Requests | 직접 결과·편집 |
| `gitlabIssues` | GitLab Issues | 직접 결과·편집 |
| `gitlabPipelines` | GitLab Pipelines | 직접 결과·편집 |
| `gitlabMRDiff` | MR Diff | 입력·선택·확인 |
| `gitlabMRChecks` | MR 파이프라인 | 입력·선택·확인 |
| `gitlabMRCheckout` | MR 체크아웃 | 입력·선택·확인 |
| `gitlabMRCreate` | Draft MR 만들기 | 입력·선택·확인 |
| `gitlabMRComment` | MR 댓글 게시 | 입력·선택·확인 |
| `gitlabIssueCreate` | GitLab 이슈 만들기 | 입력·선택·확인 |

## 남은 문제

`ui-worktrees.mjs`의 ‘열린 워크트리 탭 닫기 → 삭제 재시도’ 단계가 실패한다. 탭이 사라진 뒤에도 서버가 해당 워크트리를 열린 상태로 판단하는 현상이 재현되었다. 이번 변경은 조회·편집 진입 단계 정리이며 이 삭제 문제는 해결된 것으로 처리하지 않는다.
