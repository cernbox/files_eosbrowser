<?php

use OCA\Files_EosBrowser\Helper;

use OC\Files\ObjectStore\EosUtil;
use OC\Files\ObjectStore\EosInstanceManager;
use OC\Files\ObjectStore\EosCmd;

OCP\JSON::checkLoggedIn();
\OC::$server->getSession()->close();

$instance = isset($_GET['instance'])? $_GET['instance'] : '-2';

/**
 * LOAD THE EOS INSTANCES LIST
 */
if($instance === '-2')
{
	// Print main eos instances page
	$all = EosInstanceManager::getAllMappings();
	
	if(!$all)
	{
		// there aren't EOS intances
		$data = [];
		$data['directory'] = '/';
		$data['files'] = array();
		$data['permissions'] = 1;
		OCP\JSON::success(array('data' => $data));
		exit();
	}
	
	$user = \OC_User::getUser();
	list($uid, $gid) = EosUtil::getUidAndGid($user);
	
	if(!$uid || !$gid)
	{
		OCP\JSON::error(['data' => ['message' => 'An error occoured. Please, reload your web browser']]);
		exit();
	}
	
	foreach($all as $id => $i)
	{
		$path = escapeshellarg($i['user_root_dir']);
		list($result, $errcode) = EosCmd::exec("eos -b -r $uid $gid stat $path", $i['mgm_url']);
	
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
	$files = Helper::formatRootInstances($all);
	foreach($files as $file) {
		$file['permissions'] = 1; // RO access
	}
	$data['files'] = $files;
	$data['permissions'] = 1;
	
	
	OCP\JSON::success(array('data' => $data));
}
else
{
	$instanceObj = EosInstanceManager::getMappingById($instance);
	
	if(!$instanceObj || $instanceObj === NULL)
	{
		OCP\JSON::error(['data' => ['message' => 'An error occoured. Please, reload your web browser']]);
		exit();
	}
	
	EosInstanceManager::setUserInstance($instance);
	
	require '/var/www/html/cernbox/apps/files/ajax/list.php';
}
