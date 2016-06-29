<?php

namespace OCA\Files_EosBrowser\Appinfo;

$eventDispatcher = \OC::$server->getEventDispatcher();
$eventDispatcher->addListener
(
		'OCA\Files::loadAdditionalScripts',
		function() 
		{
			\OCP\Util::addScript('files_eosbrowser', 'app');
			\OCP\Util::addScript('files_eosbrowser', 'eoslist');
			\OCP\Util::addStyle('files_eosbrowser', 'eosbrowser');
		}
);

\OC::$server->getActivityManager()->registerExtension(function() {
	return new \OCA\Files_EosBrowser\Activity();
});

\OCA\Files\App::getNavigationManager()->add(
[
	"id" => 'eosbrowser',
	"appname" => 'files_eosbrowser',
	"script" => 'list.php',
	"order" => 50,
	"name" => /*$l->t(*/'Eos Browser'//)
]);