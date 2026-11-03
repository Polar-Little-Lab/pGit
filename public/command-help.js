// One description catalog for the palette and its destination screens.
window.PgitCommandHelp=(()=>{
const catalog={
  "init": {
    "ko": "Git으로 관리하지 않는 폴더에 새 저장소를 만듭니다. 기존 파일을 유지하면서 변경 이력을 기록할 준비를 합니다.",
    "en": "Create a Git repository in an unversioned folder, keeping its existing files.",
    "ja": "未管理のフォルダーに Git リポジトリを作成します。既存のファイルは保持します。",
    "zh-CN": "在尚未受版本控制的文件夹中创建 Git 仓库，并保留现有文件。",
    "es": "Crea un repositorio Git en una carpeta sin control de versiones, conservando sus archivos.",
    "fr": "Crée un dépôt Git dans un dossier non versionné en conservant ses fichiers."
  },
  "clone": {
    "ko": "저장소 주소에서 파일과 커밋 이력을 내려받아 새 작업 폴더를 만듭니다.",
    "en": "Download files and commit history from a repository URL into a new working folder.",
    "ja": "リポジトリの URL からファイルと履歴を取得し、新しい作業フォルダーを作成します。",
    "zh-CN": "从仓库地址下载文件和提交历史，创建新的工作文件夹。",
    "es": "Descarga archivos e historial desde una URL de repositorio a una nueva carpeta.",
    "fr": "Télécharge les fichiers et l’historique d’un dépôt dans un nouveau dossier."
  },
  "branchCreate": {
    "ko": "기준 브랜치·커밋·참조에서 새 로컬 브랜치를 만듭니다. 생성 후 현재 작업 브랜치는 유지됩니다.",
    "en": "Create a local branch from a branch, commit or reference without switching your working branch.",
    "ja": "ブランチ・コミット・参照からローカルブランチを作成します。現在のブランチは切り替わりません。",
    "zh-CN": "从分支、提交或引用创建本地分支，当前工作分支保持不变。",
    "es": "Crea una rama local desde una rama, commit o referencia sin cambiar la rama de trabajo.",
    "fr": "Crée une branche locale depuis une branche, un commit ou une référence sans changer de branche active."
  },
  "branchSwitch": {
    "ko": "선택한 로컬 브랜치로 전환하고 작업 폴더의 파일을 그 브랜치 상태로 바꿉니다.",
    "en": "Switch to a local branch and update working files to that branch.",
    "ja": "ローカルブランチを切り替え、作業ファイルをそのブランチの状態にします。",
    "zh-CN": "切换到所选本地分支，并将工作文件更新为该分支的状态。",
    "es": "Cambia a una rama local y actualiza los archivos de trabajo a su estado.",
    "fr": "Passe à une branche locale et met les fichiers de travail dans son état."
  },
  "branchRename": {
    "ko": "선택한 로컬 브랜치의 이름을 바꿉니다. 커밋 내용은 그대로 유지됩니다.",
    "en": "Rename a local branch while keeping its commits unchanged.",
    "ja": "ローカルブランチ名を変更します。コミット内容は保持されます。",
    "zh-CN": "重命名本地分支，提交内容保持不变。",
    "es": "Cambia el nombre de una rama local sin alterar sus commits.",
    "fr": "Renomme une branche locale sans modifier ses commits."
  },
  "branchDelete": {
    "ko": "선택한 로컬 브랜치를 삭제합니다. 원격 브랜치는 유지됩니다.",
    "en": "Delete the selected local branch. The remote branch is retained.",
    "ja": "選択したローカルブランチを削除します。リモートブランチは保持されます。",
    "zh-CN": "删除所选本地分支，保留远程分支。",
    "es": "Elimina la rama local seleccionada; conserva la rama remota.",
    "fr": "Supprime la branche locale sélectionnée ; la branche distante est conservée."
  },
  "remoteAdd": {
    "ko": "원격 저장소의 이름과 주소를 등록해 Fetch·Push 대상으로 사용합니다.",
    "en": "Register a remote name and URL for Fetch and Push.",
    "ja": "Fetch・Push に使うリモート名と URL を登録します。",
    "zh-CN": "注册远程仓库名称和地址，用于 Fetch 和 Push。",
    "es": "Registra el nombre y la URL de un remoto para Fetch y Push.",
    "fr": "Enregistre le nom et l’URL d’un dépôt distant pour Fetch et Push."
  },
  "remoteRemove": {
    "ko": "이 저장소의 원격 연결 설정과 원격 추적 참조를 제거합니다. 서버의 저장소는 유지됩니다.",
    "en": "Remove this repository’s remote configuration and tracking refs; the server repository remains.",
    "ja": "このリポジトリのリモート設定と追跡参照を削除します。サーバー側のリポジトリは残ります。",
    "zh-CN": "移除此仓库的远程配置和跟踪引用，服务器上的仓库保持不变。",
    "es": "Elimina la configuración y referencias de seguimiento del remoto; el repositorio del servidor permanece.",
    "fr": "Retire la configuration distante et les références de suivi ; le dépôt sur le serveur reste intact."
  },
  "remoteList": {
    "ko": "등록된 원격 저장소의 이름과 Fetch·Push 주소를 확인합니다.",
    "en": "View registered remote names and Fetch/Push URLs.",
    "ja": "登録済みリモートの名前と Fetch・Push の URL を確認します。",
    "zh-CN": "查看已注册远程仓库的名称及 Fetch、Push 地址。",
    "es": "Consulta los nombres y las URL de Fetch y Push de los remotos.",
    "fr": "Affiche les noms et URL de Fetch et Push des dépôts distants."
  },
  "fetch": {
    "ko": "선택한 원격 저장소의 최신 커밋과 브랜치 정보를 가져옵니다. 현재 브랜치와 작업 파일은 그대로 유지됩니다.",
    "en": "Fetch remote commits and branch updates without merging them into your working files.",
    "ja": "リモートのコミットとブランチ情報を取得します。作業ファイルへの統合は行いません。",
    "zh-CN": "获取远程提交和分支更新，不合并到当前工作文件。",
    "es": "Obtiene commits y ramas del remoto sin fusionarlos con tus archivos de trabajo.",
    "fr": "Récupère les commits et branches distants sans les intégrer aux fichiers de travail."
  },
  "pull": {
    "ko": "현재 브랜치에 연결된 원격 브랜치의 최신 커밋을 가져와 현재 브랜치와 작업 파일에 반영합니다. 빠른 앞으로 이동, 병합, 리베이스 중 반영 방식을 선택할 수 있습니다.",
    "en": "Fetch the tracked remote branch and integrate it into the current branch using the selected strategy.",
    "ja": "追跡中のリモートブランチを取得し、選択した方法で現在のブランチに統合します。",
    "zh-CN": "获取跟踪的远程分支，并按所选方式整合到当前分支。",
    "es": "Obtiene la rama remota seguida y la integra en la actual con la estrategia elegida.",
    "fr": "Récupère la branche distante suivie et l’intègre à la branche actuelle selon la stratégie choisie."
  },
  "push": {
    "ko": "현재 브랜치의 커밋을 선택한 원격 저장소의 같은 이름 브랜치에 올립니다. 커밋하지 않은 변경은 포함되지 않으며, 원격에 같은 이름의 브랜치가 없으면 새로 만듭니다.",
    "en": "Send local commits on the current branch to the same-named remote branch.",
    "ja": "現在のローカルブランチのコミットを同名のリモートブランチへ送信します。",
    "zh-CN": "将当前本地分支的提交发送到远程同名分支。",
    "es": "Envía los commits de la rama actual a la rama remota del mismo nombre.",
    "fr": "Envoie les commits de la branche actuelle vers la branche distante du même nom."
  },
  "stashSave": {
    "ko": "커밋하지 않은 변경과 새 파일을 임시 보관하고 작업 폴더를 정리합니다.",
    "en": "Temporarily store uncommitted changes and new files, then clean the working folder.",
    "ja": "未コミットの変更と新規ファイルを一時保存し、作業フォルダーを整理します。",
    "zh-CN": "临时保存未提交的更改及新文件，然后清理工作文件夹。",
    "es": "Guarda temporalmente cambios sin commit y archivos nuevos, y limpia la carpeta de trabajo.",
    "fr": "Met temporairement de côté les modifications non commitées et les nouveaux fichiers, puis nettoie le dossier de travail."
  },
  "stashApply": {
    "ko": "보관한 변경을 현재 작업 폴더에 적용합니다. 스태시는 목록에 남습니다.",
    "en": "Apply stashed changes to the working folder and keep the stash in the list.",
    "ja": "スタッシュの変更を作業フォルダーに適用し、スタッシュは残します。",
    "zh-CN": "将暂存的更改应用到工作文件夹，并保留该 stash。",
    "es": "Aplica los cambios guardados a la carpeta de trabajo y conserva el stash.",
    "fr": "Applique les modifications mises de côté au dossier de travail et conserve le stash."
  },
  "stashPop": {
    "ko": "보관한 변경을 적용하고 성공하면 해당 스태시를 목록에서 제거합니다.",
    "en": "Apply stashed changes and remove the stash after a successful application.",
    "ja": "スタッシュを適用し、成功した場合に一覧から削除します。",
    "zh-CN": "应用 stash 中的更改，成功后从列表移除该 stash。",
    "es": "Aplica los cambios y elimina el stash si la aplicación tiene éxito.",
    "fr": "Applique les modifications puis supprime le stash si l’application réussit."
  },
  "stashDrop": {
    "ko": "선택한 스태시에 보관된 변경을 삭제합니다.",
    "en": "Delete the changes stored in the selected stash.",
    "ja": "選択したスタッシュに保存された変更を削除します。",
    "zh-CN": "删除所选 stash 中保存的更改。",
    "es": "Elimina los cambios almacenados en el stash seleccionado.",
    "fr": "Supprime les modifications conservées dans le stash sélectionné."
  },
  "stashDiff": {
    "ko": "선택한 스태시에 어떤 파일 변경이 담겨 있는지 비교해 봅니다.",
    "en": "Inspect the file changes stored in a stash.",
    "ja": "選択したスタッシュに含まれるファイルの変更を確認します。",
    "zh-CN": "查看所选 stash 中保存的文件更改。",
    "es": "Examina los cambios de archivos guardados en un stash.",
    "fr": "Examine les modifications de fichiers conservées dans un stash."
  },
  "tagCreate": {
    "ko": "선택한 커밋에 버전 표시용 로컬 태그를 붙입니다.",
    "en": "Attach a local version tag to a selected commit.",
    "ja": "選択したコミットにバージョンを示すローカルタグを付けます。",
    "zh-CN": "为所选提交添加用于标记版本的本地标签。",
    "es": "Añade una etiqueta local de versión al commit seleccionado.",
    "fr": "Ajoute une étiquette locale de version au commit sélectionné."
  },
  "tagDelete": {
    "ko": "로컬 태그를 삭제합니다. 태그가 가리키던 커밋과 원격 저장소의 태그는 유지됩니다.",
    "en": "Delete a local tag while retaining its commit and the server’s tag.",
    "ja": "ローカルタグを削除します。対象コミットとサーバーのタグは保持されます。",
    "zh-CN": "删除本地标签，保留其指向的提交及服务器上的标签。",
    "es": "Elimina una etiqueta local; conserva su commit y la etiqueta del servidor.",
    "fr": "Supprime une étiquette locale en conservant son commit et l’étiquette du serveur."
  },
  "mergePreview": {
    "ko": "선택한 브랜치를 현재 브랜치에 합칠 때 충돌할지 검사합니다. 파일은 바꾸지 않습니다.",
    "en": "Check for merge conflicts with the current branch without changing files.",
    "ja": "現在のブランチへのマージで競合するか確認します。ファイルは変更しません。",
    "zh-CN": "检查合并到当前分支时是否会产生冲突，不修改文件。",
    "es": "Comprueba conflictos al fusionar con la rama actual sin modificar archivos.",
    "fr": "Vérifie les conflits de fusion avec la branche actuelle sans modifier les fichiers."
  },
  "merge": {
    "ko": "다른 브랜치의 커밋과 변경을 현재 브랜치에 합칩니다. 충돌이 생기면 해결이 필요합니다.",
    "en": "Merge another branch’s commits and changes into the current branch; conflicts may need resolution.",
    "ja": "他のブランチのコミットと変更を現在のブランチに統合します。競合時は解決が必要です。",
    "zh-CN": "将其他分支的提交和更改合并到当前分支，可能需要解决冲突。",
    "es": "Fusiona los commits y cambios de otra rama en la actual; puede requerir resolver conflictos.",
    "fr": "Fusionne les commits et modifications d’une autre branche dans la branche actuelle ; des conflits peuvent nécessiter une résolution."
  },
  "rebase": {
    "ko": "현재 브랜치의 커밋을 기준 브랜치 뒤에 다시 적용해 이력을 정리합니다. 커밋 해시가 바뀝니다.",
    "en": "Replay current-branch commits on top of a base branch; commit hashes change.",
    "ja": "現在のコミットを基準ブランチ上に再適用します。コミットのハッシュが変わります。",
    "zh-CN": "在基准分支之上重新应用当前分支的提交，提交哈希会改变。",
    "es": "Reaplica los commits actuales sobre una rama base; cambian sus hashes.",
    "fr": "Réapplique les commits actuels sur une branche de base ; leurs hashes changent."
  },
  "cherryPick": {
    "ko": "다른 브랜치 등에서 고른 커밋의 변경만 현재 브랜치에 적용합니다.",
    "en": "Apply the changes from a chosen commit to the current branch.",
    "ja": "選んだコミットの変更を現在のブランチに適用します。",
    "zh-CN": "将选定提交的更改应用到当前分支。",
    "es": "Aplica los cambios de un commit elegido a la rama actual.",
    "fr": "Applique les modifications d’un commit choisi à la branche actuelle."
  },
  "revert": {
    "ko": "선택한 커밋의 변경을 취소하는 새 커밋을 만듭니다. 기존 이력은 남습니다.",
    "en": "Create a new commit that reverses a selected commit, preserving existing history.",
    "ja": "選択したコミットの変更を打ち消す新しいコミットを作成し、既存の履歴を残します。",
    "zh-CN": "创建一个撤销所选提交更改的新提交，保留现有历史。",
    "es": "Crea un nuevo commit que revierte el seleccionado, conservando el historial.",
    "fr": "Crée un nouveau commit annulant les modifications du commit sélectionné, en conservant l’historique."
  },
  "continue": {
    "ko": "충돌 해결과 스테이징을 마친 뒤 진행 중이던 병합·리베이스·체리픽을 이어갑니다.",
    "en": "Continue a merge, rebase or cherry-pick after resolving and staging conflicts.",
    "ja": "競合を解決してステージした後、マージ・リベース・チェリーピックを再開します。",
    "zh-CN": "解决并暂存冲突后，继续进行中的合并、变基或 cherry-pick。",
    "es": "Continúa una fusión, rebase o cherry-pick tras resolver y preparar los conflictos.",
    "fr": "Reprend une fusion, un rebase ou un cherry-pick après résolution et indexation des conflits."
  },
  "abort": {
    "ko": "진행 중인 병합·리베이스·체리픽 등을 중단하고 시작 전 상태로 돌아갑니다.",
    "en": "Abort the ongoing merge, rebase or cherry-pick and return to its starting state.",
    "ja": "進行中のマージ・リベース・チェリーピックを中止し、開始前の状態に戻します。",
    "zh-CN": "中止正在进行的合并、变基或 cherry-pick，返回开始前的状态。",
    "es": "Aborta la fusión, rebase o cherry-pick en curso y vuelve al estado inicial.",
    "fr": "Interrompt la fusion, le rebase ou le cherry-pick en cours et revient à son état initial."
  },
  "resolve": {
    "ko": "외부 편집기로 충돌을 해결한 파일을 스테이징해 해결 완료로 표시합니다.",
    "en": "Stage a file whose conflicts were resolved in an external editor.",
    "ja": "外部エディターで競合を解決したファイルをステージし、解決済みにします。",
    "zh-CN": "将已在外部编辑器中解决冲突的文件暂存，标记为已解决。",
    "es": "Prepara un archivo cuyos conflictos se resolvieron en un editor externo.",
    "fr": "Indexe un fichier dont les conflits ont été résolus dans un éditeur externe."
  },
  "undoCommit": {
    "ko": "마지막 커밋을 이력에서 되돌리고 그 변경을 스테이징에 남겨 다시 커밋할 수 있게 합니다.",
    "en": "Undo the last commit and leave its changes staged for a new commit.",
    "ja": "最後のコミットを取り消し、変更をステージしたまま再コミットできる状態にします。",
    "zh-CN": "撤销最后一个提交，将其更改保留在暂存区以便重新提交。",
    "es": "Deshace el último commit y deja sus cambios preparados para volver a commitear.",
    "fr": "Annule le dernier commit et conserve ses modifications indexées pour un nouveau commit."
  },
  "fileHistory": {
    "ko": "선택한 파일이 어떤 커밋에서 변경됐는지 이력을 확인합니다.",
    "en": "View the commits that changed a selected file.",
    "ja": "選択したファイルが変更されたコミットを確認します。",
    "zh-CN": "查看所选文件的修改提交历史。",
    "es": "Consulta los commits que modificaron el archivo seleccionado.",
    "fr": "Affiche les commits ayant modifié le fichier sélectionné."
  },
  "blame": {
    "ko": "파일의 각 줄을 마지막으로 바꾼 커밋과 작성자를 확인합니다.",
    "en": "See the commit and author that last changed each line of a file.",
    "ja": "ファイルの各行を最後に変更したコミットと作成者を確認します。",
    "zh-CN": "查看最后修改文件各行的提交及作者。",
    "es": "Consulta el commit y autor que modificó por última vez cada línea.",
    "fr": "Affiche le commit et l’auteur de la dernière modification de chaque ligne."
  },
  "compare": {
    "ko": "두 커밋 사이에서 달라진 파일과 코드를 비교합니다.",
    "en": "Compare changed files and code between two commits.",
    "ja": "2つのコミット間で変更されたファイルとコードを比較します。",
    "zh-CN": "比较两个提交之间的文件和代码更改。",
    "es": "Compara archivos y código entre dos commits.",
    "fr": "Compare les fichiers et le code entre deux commits."
  },
  "reflog": {
    "ko": "커밋·브랜치 전환·Reset으로 작업 위치가 바뀐 로컬 기록을 봅니다. 이전 커밋을 찾아 복구할 때 참고하며, 조회만으로 파일이 복구되지는 않습니다.",
    "en": "View local changes to your working position from commits, branch switches and Reset. Use this log to find earlier commits for recovery; viewing it does not restore files.",
    "ja": "コミット・ブランチ切り替え・Reset による作業位置のローカル履歴です。復旧に使う過去のコミットを探せます。表示だけではファイルは復元されません。",
    "zh-CN": "查看提交、切换分支和 Reset 引起的本地工作位置记录。可用于查找恢复所需的历史提交；仅查看不会恢复文件。",
    "es": "Consulta el registro local de commits, cambios de rama y Reset para encontrar commits anteriores. Consultarlo no restaura archivos.",
    "fr": "Affiche les changements locaux de position après un commit, un changement de branche ou un Reset. Retrouvez un ancien commit pour une récupération ; consulter ce journal ne restaure aucun fichier."
  },
  "worktreeList": {
    "ko": "같은 저장소의 작업 폴더들을 확인하고 열기·잠금·삭제를 관리합니다.",
    "en": "View and manage this repository’s working folders, including opening, locking and removal.",
    "ja": "同じリポジトリの作業フォルダーを確認し、開く・ロック・削除を管理します。",
    "zh-CN": "查看并管理同一仓库的工作文件夹，包括打开、锁定和删除。",
    "es": "Consulta y administra las carpetas de trabajo: abrir, bloquear o eliminar.",
    "fr": "Affiche et gère les dossiers de travail : ouverture, verrouillage et suppression."
  },
  "worktreeAdd": {
    "ko": "새 브랜치를 별도 작업 폴더에 만들어 현재 작업과 나란히 진행할 수 있게 합니다.",
    "en": "Create a new branch in a separate working folder for parallel work.",
    "ja": "別の作業フォルダーに新しいブランチを作成し、並行して作業できます。",
    "zh-CN": "在单独的工作文件夹中创建新分支，以便并行工作。",
    "es": "Crea una rama nueva en otra carpeta para trabajar en paralelo.",
    "fr": "Crée une branche dans un dossier distinct pour travailler en parallèle."
  },
  "worktreeRemove": {
    "ko": "변경이 없고 잠금이 해제된 작업 폴더를 삭제합니다. 브랜치와 커밋은 남습니다.",
    "en": "Remove a clean, unlocked working folder while retaining its branch and commits.",
    "ja": "変更がなくロックされていない作業フォルダーを削除し、ブランチとコミットは残します。",
    "zh-CN": "删除无更改且未锁定的工作文件夹，保留分支和提交。",
    "es": "Elimina una carpeta limpia y desbloqueada, conservando su rama y commits.",
    "fr": "Supprime un dossier de travail propre et déverrouillé en conservant sa branche et ses commits."
  },
  "resetPreview": {
    "ko": "브랜치를 선택한 커밋으로 옮길 계획을 확인합니다. Soft·Mixed·Hard에 따라 파일과 스테이징 처리 방식이 달라집니다.",
    "en": "Preview moving the branch to a commit; Soft, Mixed and Hard handle files and staging differently.",
    "ja": "ブランチを指定コミットへ移動する計画を確認します。Soft・Mixed・Hard でファイルとステージの扱いが異なります。",
    "zh-CN": "预览将分支移到指定提交的计划；Soft、Mixed、Hard 对文件和暂存区的处理不同。",
    "es": "Revisa el cambio de la rama a un commit; Soft, Mixed y Hard tratan archivos y staging de forma distinta.",
    "fr": "Prévisualise le déplacement de la branche vers un commit ; Soft, Mixed et Hard traitent différemment les fichiers et l’index."
  },
  "resetJournal": {
    "ko": "pGit에서 실행한 Reset 기록을 확인하고 가능한 항목을 실행 취소하거나 다시 실행합니다.",
    "en": "Review Reset operations made in pGit and undo or redo eligible entries.",
    "ja": "pGit で実行した Reset を確認し、可能な操作を取り消すかやり直します。",
    "zh-CN": "查看在 pGit 中执行的 Reset，并撤销或重做符合条件的记录。",
    "es": "Revisa los Reset de pGit y deshaz o rehace las entradas disponibles.",
    "fr": "Consulte les Reset effectués dans pGit et annule ou rétablit les opérations possibles."
  },
  "discardPreview": {
    "ko": "선택한 파일의 커밋되지 않은 변경을 버리기 전에 대상과 변경 내용을 확인합니다.",
    "en": "Review a file’s uncommitted changes before discarding them.",
    "ja": "ファイルの未コミット変更を破棄する前に対象と内容を確認します。",
    "zh-CN": "丢弃文件未提交的更改前，确认目标及更改内容。",
    "es": "Revisa los cambios sin commit de un archivo antes de descartarlos.",
    "fr": "Vérifie les modifications non commitées d’un fichier avant de les abandonner."
  },
  "recoveryList": {
    "ko": "pGit에서 버린 변경의 복구 기록을 확인하고 저장된 파일 내용을 되살립니다.",
    "en": "Inspect recovery records for changes discarded in pGit and restore saved file content.",
    "ja": "pGit で破棄した変更の復元記録を確認し、保存された内容を復元します。",
    "zh-CN": "查看在 pGit 中丢弃更改的恢复记录，并还原保存的文件内容。",
    "es": "Consulta registros de recuperación de cambios descartados en pGit y restaura su contenido.",
    "fr": "Consulte les sauvegardes des modifications abandonnées dans pGit et restaure leur contenu."
  },
  "hunks": {
    "ko": "파일에서 원하는 줄이나 변경 블록을 골라 스테이징·해제하거나 버립니다.",
    "en": "Select lines or change blocks to stage, unstage or discard.",
    "ja": "行や変更ブロックを選び、ステージ・解除・破棄します。",
    "zh-CN": "选择文件中的行或更改块，进行暂存、取消暂存或丢弃。",
    "es": "Selecciona líneas o bloques para preparar, retirar del staging o descartar.",
    "fr": "Sélectionne des lignes ou blocs à indexer, désindexer ou abandonner."
  },
  "readText": {
    "ko": "현재 작업 폴더의 텍스트 파일을 열어 내용을 편집하고 저장합니다.",
    "en": "Open, edit and save a text file in the working folder.",
    "ja": "作業フォルダーのテキストファイルを開き、編集して保存します。",
    "zh-CN": "打开当前工作文件夹中的文本文件，编辑并保存。",
    "es": "Abre, edita y guarda un archivo de texto de la carpeta de trabajo.",
    "fr": "Ouvre, modifie et enregistre un fichier texte du dossier de travail."
  },
  "conflictRead": {
    "ko": "충돌한 양쪽 내용을 비교해 최종 결과를 작성하고 저장·스테이징합니다.",
    "en": "Compare conflicting versions, edit the final result, then save and stage it.",
    "ja": "競合した両側を比較して結果を編集し、保存・ステージします。",
    "zh-CN": "比较冲突双方的内容，编辑最终结果，然后保存并暂存。",
    "es": "Compara las versiones en conflicto, edita el resultado y guárdalo en staging.",
    "fr": "Compare les versions en conflit, modifie le résultat puis l’enregistre et l’indexe."
  },
  "diffSides": {
    "ko": "작업 파일의 변경 전후를 좌우로 비교합니다.",
    "en": "Compare a working file’s before and after versions side by side.",
    "ja": "作業ファイルの変更前後を左右に比較します。",
    "zh-CN": "并排比较工作文件更改前后的版本。",
    "es": "Compara lado a lado el archivo de trabajo antes y después.",
    "fr": "Compare côte à côte les versions avant et après d’un fichier de travail."
  },
  "ignoreFile": {
    "ko": "추적하지 않는 파일을 이 저장소의 .gitignore에 추가해 변경 목록에서 제외합니다.",
    "en": "Add an untracked file to this repository’s .gitignore to exclude it from changes.",
    "ja": "未追跡ファイルをこのリポジトリの .gitignore に追加し、変更一覧から除外します。",
    "zh-CN": "将未跟踪文件添加到此仓库的 .gitignore，从更改列表中排除。",
    "es": "Añade un archivo no seguido al .gitignore del repositorio para excluirlo de los cambios.",
    "fr": "Ajoute un fichier non suivi au .gitignore du dépôt pour l’exclure des changements."
  },
  "rebasePlan": {
    "ko": "기준 커밋 이후의 커밋 순서·메시지·합치기·제외를 계획하고 적용합니다. 이력이 다시 작성됩니다.",
    "en": "Plan and apply reordering, rewording, combining or dropping commits after a base commit; history is rewritten.",
    "ja": "基準コミット以降の順序・メッセージ・結合・除外を計画して適用します。履歴を書き換えます。",
    "zh-CN": "计划并应用基准提交之后的排序、消息修改、合并或移除，历史会被重写。",
    "es": "Planifica y aplica reordenar, renombrar, combinar u omitir commits; se reescribe el historial.",
    "fr": "Planifie et applique la réorganisation, le renommage, la fusion ou la suppression de commits ; l’historique est réécrit."
  },
  "amend": {
    "ko": "마지막 커밋의 기존 메시지를 수정합니다. 스테이징된 변경도 함께 포함되며 커밋 해시가 바뀝니다.",
    "en": "Edit the last commit’s message, including staged changes; its hash changes.",
    "ja": "最後のコミットのメッセージを編集します。ステージ済み変更も含まれ、ハッシュが変わります。",
    "zh-CN": "修改最后一个提交的消息，同时包含暂存的更改，提交哈希会改变。",
    "es": "Edita el mensaje del último commit e incluye cambios preparados; cambia su hash.",
    "fr": "Modifie le message du dernier commit en incluant les changements indexés ; son hash change."
  },
  "searchHistory": {
    "ko": "저장소 전체 이력에서 커밋 메시지에 검색어가 포함된 커밋을 찾습니다.",
    "en": "Search the repository’s full history for commits matching a message query.",
    "ja": "リポジトリ全体の履歴からメッセージに検索語を含むコミットを探します。",
    "zh-CN": "在整个仓库历史中查找消息包含搜索词的提交。",
    "es": "Busca en todo el historial commits cuyo mensaje contenga la consulta.",
    "fr": "Recherche dans tout l’historique les commits dont le message correspond à la recherche."
  },
  "worktreeLock": {
    "ko": "선택한 워크트리를 잠가 정리 작업이나 삭제로부터 보호합니다.",
    "en": "Lock a worktree to protect it from pruning or removal.",
    "ja": "ワークツリーをロックし、整理や削除から保護します。",
    "zh-CN": "锁定工作树，防止清理或删除。",
    "es": "Bloquea un worktree para protegerlo de la limpieza o eliminación.",
    "fr": "Verrouille un worktree pour le protéger du nettoyage ou de la suppression."
  },
  "worktreeUnlock": {
    "ko": "워크트리의 잠금을 해제해 다시 정리하거나 삭제할 수 있게 합니다.",
    "en": "Unlock a worktree so it can be pruned or removed again.",
    "ja": "ワークツリーのロックを解除し、整理や削除を可能にします。",
    "zh-CN": "解除工作树锁定，使其可再次被清理或删除。",
    "es": "Desbloquea un worktree para permitir su limpieza o eliminación.",
    "fr": "Déverrouille un worktree pour permettre son nettoyage ou sa suppression."
  },
  "submodules": {
    "ko": "저장소에 등록된 하위 저장소와 현재 체크아웃된 커밋 상태를 확인합니다.",
    "en": "View registered submodules and their checked-out commit status.",
    "ja": "登録されたサブモジュールと現在チェックアウトされたコミットの状態を確認します。",
    "zh-CN": "查看已注册的子模块及其当前检出提交的状态。",
    "es": "Consulta los submódulos registrados y el estado de sus commits activos.",
    "fr": "Affiche les sous-modules enregistrés et l’état de leurs commits extraits."
  },
  "submoduleUpdate": {
    "ko": "등록된 하위 저장소를 내려받고 상위 저장소에 기록된 커밋으로 맞춥니다.",
    "en": "Download submodules and update them to commits recorded by the parent repository.",
    "ja": "サブモジュールを取得し、親リポジトリに記録されたコミットへ更新します。",
    "zh-CN": "下载子模块，并更新到父仓库记录的提交。",
    "es": "Descarga submódulos y los actualiza a los commits registrados en el repositorio principal.",
    "fr": "Télécharge les sous-modules et les met aux commits enregistrés dans le dépôt parent."
  },
  "profileRead": {
    "ko": "이 저장소에서 앞으로 만들 커밋의 작성자 이름·이메일·서명 사용 여부를 설정합니다.",
    "en": "Set the author name, email and signing preference for future commits in this repository.",
    "ja": "このリポジトリで今後作成するコミットの名前・メール・署名設定を変更します。",
    "zh-CN": "设置此仓库以后提交所用的作者姓名、邮箱及签名选项。",
    "es": "Configura nombre, correo y firma para futuros commits de este repositorio.",
    "fr": "Définit le nom, l’e-mail et la signature pour les futurs commits de ce dépôt."
  },
  "githubPRs": {
    "ko": "GitHub 원격 저장소의 열린 PR 목록을 조회합니다.",
    "en": "View open PRs in the GitHub remote repository.",
    "ja": "GitHub のリモートリポジトリで開かれている PR を確認します。",
    "zh-CN": "查看 GitHub 远程仓库中打开的 PR 列表。",
    "es": "Consulta los PR abiertos del repositorio remoto en GitHub.",
    "fr": "Affiche les PR ouverts dans le dépôt distant GitHub."
  },
  "gitlabMRs": {
    "ko": "GitLab 원격 저장소의 열린 MR 목록을 조회합니다.",
    "en": "View open MRs in the GitLab remote repository.",
    "ja": "GitLab のリモートリポジトリで開かれている MR を確認します。",
    "zh-CN": "查看 GitLab 远程仓库中打开的 MR 列表。",
    "es": "Consulta los MR abiertos del repositorio remoto en GitLab.",
    "fr": "Affiche les MR ouverts dans le dépôt distant GitLab."
  },
  "githubIssues": {
    "ko": "GitHub 원격 저장소의 이슈 목록을 조회합니다.",
    "en": "View issues in the GitHub remote repository.",
    "ja": "GitHub のリモートリポジトリの Issue を確認します。",
    "zh-CN": "查看 GitHub 远程仓库的议题列表。",
    "es": "Consulta los issues del repositorio remoto en GitHub.",
    "fr": "Affiche les issues du dépôt distant GitHub."
  },
  "gitlabIssues": {
    "ko": "GitLab 원격 저장소의 이슈 목록을 조회합니다.",
    "en": "View issues in the GitLab remote repository.",
    "ja": "GitLab のリモートリポジトリの Issue を確認します。",
    "zh-CN": "查看 GitLab 远程仓库的议题列表。",
    "es": "Consulta los issues del repositorio remoto en GitLab.",
    "fr": "Affiche les issues du dépôt distant GitLab."
  },
  "githubRuns": {
    "ko": "GitHub에서 실행된 자동 빌드·테스트의 상태와 결과를 조회합니다.",
    "en": "View automated build and test runs and their results on GitHub.",
    "ja": "GitHub の自動ビルド・テストの実行状態と結果を確認します。",
    "zh-CN": "查看 GitHub 自动构建和测试的运行状态及结果。",
    "es": "Consulta las ejecuciones y resultados de compilación y pruebas en GitHub.",
    "fr": "Affiche l’état et les résultats des builds et tests automatisés sur GitHub."
  },
  "gitlabPipelines": {
    "ko": "GitLab에서 실행된 자동 빌드·테스트의 상태와 결과를 조회합니다.",
    "en": "View automated build and test runs and their results on GitLab.",
    "ja": "GitLab の自動ビルド・テストの実行状態と結果を確認します。",
    "zh-CN": "查看 GitLab 自动构建和测试的运行状态及结果。",
    "es": "Consulta las ejecuciones y resultados de compilación y pruebas en GitLab.",
    "fr": "Affiche l’état et les résultats des builds et tests automatisés sur GitLab."
  },
  "githubPRDiff": {
    "ko": "선택한 PR의 파일 변경을 비교합니다. 조회만 하며 로컬 파일은 바꾸지 않습니다.",
    "en": "Compare file changes in a PR without changing local files.",
    "ja": "選択した PR のファイル変更を比較します。ローカルファイルは変更しません。",
    "zh-CN": "比较所选 PR 中的文件更改，不修改本地文件。",
    "es": "Compara los cambios de un PR sin modificar archivos locales.",
    "fr": "Compare les modifications d’un PR sans modifier les fichiers locaux."
  },
  "gitlabMRDiff": {
    "ko": "선택한 MR의 파일 변경을 비교합니다. 조회만 하며 로컬 파일은 바꾸지 않습니다.",
    "en": "Compare file changes in a MR without changing local files.",
    "ja": "選択した MR のファイル変更を比較します。ローカルファイルは変更しません。",
    "zh-CN": "比较所选 MR 中的文件更改，不修改本地文件。",
    "es": "Compara los cambios de un MR sin modificar archivos locales.",
    "fr": "Compare les modifications d’un MR sans modifier les fichiers locaux."
  },
  "githubPRChecks": {
    "ko": "선택한 PR에 연결된 검사·파이프라인의 실행 결과를 조회합니다.",
    "en": "View check or pipeline results associated with a PR.",
    "ja": "選択した PR に関連するチェック・パイプラインの結果を確認します。",
    "zh-CN": "查看与所选 PR 关联的检查或流水线结果。",
    "es": "Consulta los resultados de comprobaciones o pipelines de un PR.",
    "fr": "Affiche les résultats des contrôles ou pipelines associés à un PR."
  },
  "gitlabMRChecks": {
    "ko": "선택한 MR에 연결된 검사·파이프라인의 실행 결과를 조회합니다.",
    "en": "View check or pipeline results associated with a MR.",
    "ja": "選択した MR に関連するチェック・パイプラインの結果を確認します。",
    "zh-CN": "查看与所选 MR 关联的检查或流水线结果。",
    "es": "Consulta los resultados de comprobaciones o pipelines de un MR.",
    "fr": "Affiche les résultats des contrôles ou pipelines associés à un MR."
  },
  "githubPRCreate": {
    "ko": "이미 Push한 브랜치를 기준 브랜치에 합치기 위한 초안 PR을 GitHub에 게시합니다.",
    "en": "Publish a draft PR on GitHub for merging an already-pushed branch into a base branch.",
    "ja": "Push 済みブランチを基準ブランチに統合するためのドラフト PR を GitHub に公開します。",
    "zh-CN": "在 GitHub 发布草稿 PR，申请将已推送分支合并到基准分支。",
    "es": "Publica un PR borrador en GitHub para fusionar una rama ya enviada en una rama base.",
    "fr": "Publie un brouillon de PR sur GitHub pour fusionner une branche déjà poussée dans une branche de base."
  },
  "gitlabMRCreate": {
    "ko": "이미 Push한 브랜치를 기준 브랜치에 합치기 위한 초안 MR을 GitLab에 게시합니다.",
    "en": "Publish a draft MR on GitLab for merging an already-pushed branch into a base branch.",
    "ja": "Push 済みブランチを基準ブランチに統合するためのドラフト MR を GitLab に公開します。",
    "zh-CN": "在 GitLab 发布草稿 MR，申请将已推送分支合并到基准分支。",
    "es": "Publica un MR borrador en GitLab para fusionar una rama ya enviada en una rama base.",
    "fr": "Publie un brouillon de MR sur GitLab pour fusionner une branche déjà poussée dans une branche de base."
  },
  "githubPRComment": {
    "ko": "입력한 댓글을 선택한 GitHub PR에 게시합니다.",
    "en": "Post your comment to the selected GitHub PR.",
    "ja": "入力したコメントを選択した GitHub の PR に投稿します。",
    "zh-CN": "将输入的评论发布到所选 GitHub PR。",
    "es": "Publica tu comentario en el PR seleccionado de GitHub.",
    "fr": "Publie votre commentaire sur le PR sélectionné de GitHub."
  },
  "gitlabMRComment": {
    "ko": "입력한 댓글을 선택한 GitLab MR에 게시합니다.",
    "en": "Post your comment to the selected GitLab MR.",
    "ja": "入力したコメントを選択した GitLab の MR に投稿します。",
    "zh-CN": "将输入的评论发布到所选 GitLab MR。",
    "es": "Publica tu comentario en el MR seleccionado de GitLab.",
    "fr": "Publie votre commentaire sur le MR sélectionné de GitLab."
  },
  "githubPRApprove": {
    "ko": "선택한 GitHub PR에 승인 리뷰를 게시합니다. PR을 병합하는 작업은 별개입니다.",
    "en": "Post an approval review to a GitHub PR; merging is a separate action.",
    "ja": "GitHub PR に承認レビューを投稿します。マージは別の操作です。",
    "zh-CN": "向 GitHub PR 发布批准评审；合并是另一项操作。",
    "es": "Publica una aprobación en un PR de GitHub; fusionarlo es una acción distinta.",
    "fr": "Publie une approbation sur un PR GitHub ; la fusion est une action distincte."
  },
  "githubPRRequestChanges": {
    "ko": "선택한 GitHub PR에 수정이 필요하다는 리뷰와 의견을 게시합니다.",
    "en": "Post a review requesting changes on a GitHub PR.",
    "ja": "GitHub PR に変更を求めるレビューと意見を投稿します。",
    "zh-CN": "向 GitHub PR 发布请求修改的评审和意见。",
    "es": "Publica una revisión solicitando cambios en un PR de GitHub.",
    "fr": "Publie une revue demandant des modifications sur un PR GitHub."
  },
  "githubPRCheckout": {
    "ko": "선택한 PR의 브랜치를 로컬로 가져와 전환합니다. 작업 파일이 바뀝니다.",
    "en": "Fetch and switch to a PR branch locally, updating working files.",
    "ja": "選択した PR のブランチをローカルに取得して切り替え、作業ファイルを更新します。",
    "zh-CN": "将所选 PR 的分支获取到本地并切换，工作文件会改变。",
    "es": "Obtiene y cambia a la rama de un PR localmente, actualizando los archivos.",
    "fr": "Récupère et active localement la branche d’un PR, en mettant à jour les fichiers."
  },
  "gitlabMRCheckout": {
    "ko": "선택한 MR의 브랜치를 로컬로 가져와 전환합니다. 작업 파일이 바뀝니다.",
    "en": "Fetch and switch to a MR branch locally, updating working files.",
    "ja": "選択した MR のブランチをローカルに取得して切り替え、作業ファイルを更新します。",
    "zh-CN": "将所选 MR 的分支获取到本地并切换，工作文件会改变。",
    "es": "Obtiene y cambia a la rama de un MR localmente, actualizando los archivos.",
    "fr": "Récupère et active localement la branche d’un MR, en mettant à jour les fichiers."
  },
  "githubIssueCreate": {
    "ko": "제목과 본문으로 새 이슈를 만들어 GitHub 원격 저장소에 게시합니다.",
    "en": "Create and publish an issue with a title and body in the GitHub repository.",
    "ja": "タイトルと本文を入力し、GitHub のリポジトリに新しい Issue を投稿します。",
    "zh-CN": "使用标题和正文在 GitHub 仓库中创建并发布新议题。",
    "es": "Crea y publica un issue con título y descripción en el repositorio de GitHub.",
    "fr": "Crée et publie une issue avec titre et description dans le dépôt GitHub."
  },
  "gitlabIssueCreate": {
    "ko": "제목과 본문으로 새 이슈를 만들어 GitLab 원격 저장소에 게시합니다.",
    "en": "Create and publish an issue with a title and body in the GitLab repository.",
    "ja": "タイトルと本文を入力し、GitLab のリポジトリに新しい Issue を投稿します。",
    "zh-CN": "使用标题和正文在 GitLab 仓库中创建并发布新议题。",
    "es": "Crea y publica un issue con título y descripción en el repositorio de GitLab.",
    "fr": "Crée et publie une issue avec titre et description dans le dépôt GitLab."
  },
  "githubIssueComment": {
    "ko": "GitHub 이슈를 선택하고 본문과 기존 댓글을 확인한 뒤 댓글을 작성합니다.",
    "en": "Post your comment to a selected GitHub issue.",
    "ja": "選択した GitHub Issue にコメントを投稿します。",
    "zh-CN": "向所选 GitHub 议题发布输入的评论。",
    "es": "Publica tu comentario en el issue de GitHub seleccionado.",
    "fr": "Publie votre commentaire sur l’issue GitHub sélectionnée."
  }
};
function text(key,language=window.PgitI18n?.language||'ko'){return catalog[key]?.[language]||catalog[key]?.en||''}
function node(key){const p=document.createElement('p');p.className='command-help';p.dataset.commandHelp=key;p.textContent=text(key);return p}
function mount(host,key){host.querySelector(':scope > .command-help')?.remove();if(catalog[key])host.prepend(node(key))}
window.addEventListener('pgit-language-change',()=>{document.querySelectorAll('[data-command-help]').forEach(el=>el.textContent=text(el.dataset.commandHelp))});
return {catalog,text,node,mount};
})();
