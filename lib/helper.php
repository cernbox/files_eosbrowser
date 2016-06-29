<?php

namespace OCA\Files_EosBrowser;

final class Helper 
{
	public static function formatRootInstances(array $files)
	{
		$data = [];
		foreach($files as $file)
		{
			$data[] = self::formatRootInstance($file);
		}
	
		return $data;
	}
	
	public static function formatRootInstance(array $i) {
		$entry = array();
	
		$entry['id'] = $i['id'];
		$entry['parentId'] = -1;
		//$entry['date'] = \OCP\Util::formatDate($i['mtime']);
		//$entry['mtime'] = $i['mtime'] * 1000;
		// only pick out the needed attributes
		$entry['icon'] = '/core/img/filetypes/folder-external.svg';
		$entry['isPreviewAvailable'] = false;
		$entry['name'] = $i['name'];
		$entry['path'] = '';
		$entry['permissions'] = '1';
		$entry['mimetype'] = 'httpd/unix-directory';
		$entry['size'] = 0;
		$entry['type'] = 'dir';
		$entry['etag'] = 0;
		$entry['eospath'] = $i['user_root_dir'];
		$entry['eosinstance'] = $i['id'];
		$entry['customperm'] = $i['custom_perm'];
		
		return $entry;
	}
}