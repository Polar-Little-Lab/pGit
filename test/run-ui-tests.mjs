// Run every UI scenario so one stale assertion does not hide later regressions.
import {spawnSync} from 'node:child_process';
const tests = [
  "test/ui-history-search.mjs",
  "test/ui-large-history.mjs",
  "test/ui-clone-progress.mjs",
  "test/ui-project-home.mjs",
  "test/ui-group-curation.mjs",
  "test/ui-finance-icons.mjs",
  "test/ui-group-icons.mjs",
  "test/ui-repo-navigation.mjs",
  "test/ui-interface-polish.mjs",
  "test/ui-group-home.mjs",
  "test/ui-git-setup.mjs",
  "test/ui-project-groups.mjs",
  "test/ui.mjs",
  "test/ui-tabs.mjs",
  "test/ui-missing-repository.mjs",
  "test/ui-notices.mjs",
  "test/ui-workflow.mjs",
  "test/ui-language.mjs",
  "test/ui-inline-staging.mjs",
  "test/ui-new-file.mjs",
  "test/ui-diff-editor.mjs",
  "test/ui-conflicts.mjs",
  "test/ui-merge-preview.mjs",
  "test/ui-worktrees.mjs",
  "test/ui-refresh.mjs",
  "test/ui-history-tools.mjs",
  "test/ui-settings.mjs",
  "test/ui-command-help.mjs",
  "test/ui-remote-addresses.mjs",
  "test/ui-settings-layout.mjs",
  "test/ui-project-dialog.mjs",
  "test/ui-folder-controls.mjs",
  "test/ui-sidebar.mjs",
  "test/ui-parent-navigation.mjs",
  "test/ui-gitlab-recovery.mjs",
  "test/ui-history-edits.mjs",
  "test/ui-amend.mjs",
  "test/ui-commit-picker.mjs",
  "test/ui-reference-errors.mjs",
  "test/ui-provider-review.mjs",
  "test/ui-provider-navigation.mjs"
];
const failures=[];
for(const test of tests){
 console.log(`\n=== ${test} ===`);
 const result=spawnSync(process.execPath,[test],{stdio:'inherit',env:process.env,timeout:120000});
 if(result.status!==0){failures.push(test);console.error(`FAILED ${test}: ${result.error?.message||result.signal||result.status}`)}
}
console.log(`UI scenarios: ${tests.length-failures.length}/${tests.length} passed`);
if(failures.length){console.error('Failed scenarios:\n'+failures.join('\n'));process.exitCode=1}
