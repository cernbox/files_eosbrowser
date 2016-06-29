<?php

OCP\JSON::checkLoggedIn();
\OC::$server->getSession()->close();

OC_JSON::error(['data' => ['message' => 'File deletion has been disabled in this mode [EOS Browser]']]);
exit();

$instance = isset($_POST['instance'])? $_POST['instance'] : false;

if($instance)
{
	\OC\Files\ObjectStore\EosInstanceManager::setUserInstance($instance);
}
else
{
	OC_JSON::error(['data' => ['message' => 'An error occured. Please, reload your browser']]);
	exit();
}

require '/var/www/html/cernbox/apps/files/ajax/delete.php';