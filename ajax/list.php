<?php

use OCA\Files_EosBrowser\Helper;

OCP\JSON::checkLoggedIn();
\OC::$server->getSession()->close();

$instance = isset($_GET['instance'])? $_GET['instance'] : '-2';

/**
 * LOAD THE EOS INSTANCES LIST
 */
if($instance === '-2')
{
	// Print main eos instances page
	$all = \OC\Cernbox\Storage\EosInstanceManager::getAllMappings();
	
	if(!$all)
	{
		header("HTTP/1.0 404 Not Found");
		exit();
	}
	
	$user = \OC_User::getUser();
	list($uid, $gid) = \OC\Cernbox\Storage\EosUtil::getUidAndGid($user);
	
	if(!$uid || !$gid)
	{
		OCP\JSON::error(['data' => ['message' => 'An error occoured. Please, reload your web browser']]);
		exit();
	}
	
	foreach($all as $id => $i)
	{
		$path = escapeshellarg($i['user_root_dir']);
		list($result, $errcode) = \OC\Cernbox\Storage\EosCmd::exec("eos -b -r $uid $gid stat $path", $i['mgm_url']);
	
		if(!$result || $errcode !== 0)
		{
			$perm = '-1';
		}
		else
		{
			$perm = '1';
		}
	
		$i['custom_perm'] = $perm;
		$all[$id] = $i;
	}
	
	$data = [];
	$data['directory'] = '/';
	$data['files'] = Helper::formatRootInstances($all);
	$data['permissions'] = 1;
	
	OCP\JSON::success(array('data' => $data));
}
else
{
	$instanceObj = \OC\Cernbox\Storage\EosInstanceManager::getMappingById($instance);
	
	if(!$instanceObj || $instanceObj === NULL)
	{
		OCP\JSON::error(['data' => ['message' => 'An error occoured. Please, reload your web browser']]);
		exit();
	}
	
	\OC\Cernbox\Storage\EosInstanceManager::setUserInstance($instance);
	
	require '/var/www/html/cernbox/apps/files/ajax/list.php';
}
