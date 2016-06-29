<?php 

OCP\User::checkLoggedIn();

$tmpl = new OCP\Template('files_eosbrowser', 'list', '');

OCP\Util::addScript('files_eosbrowser', 'app');
OCP\Util::addScript('files_eosbrowser', 'eoslist');

$tmpl->printPage();