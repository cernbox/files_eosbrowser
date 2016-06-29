<?php 

namespace OCA\Files_ProjectSpaces\AppInfo;

$this->create('files_eosbrowser_ajax_list', 'ajax/list.php')
->actionInclude('files_eosbrowser/ajax/list.php');

$this->create('files_eosbrowser_ajax_delete', 'ajax/delete.php')
->actionInclude('files_eosbrowser/ajax/delete.php');

$this->create('files_eosbrowser_ajax_download', 'ajax/download.php')
->actionInclude('files_eosbrowser/ajax/download.php');

$this->create('files_eosbrowser_ajax_move', 'ajax/move.php')
->actionInclude('files_eosbrowser/ajax/move.php');

$this->create('files_eosbrowser_ajax_newfile', 'ajax/newfile.php')
->actionInclude('files_eosbrowser/ajax/newfile.php');

$this->create('files_eosbrowser_ajax_newfolder', 'ajax/newfolder.php')
->actionInclude('files_eosbrowser/ajax/newfolder.php');

$this->create('files_eosbrowser_ajax_rename', 'ajax/rename.php')
->actionInclude('files_eosbrowser/ajax/rename.php');