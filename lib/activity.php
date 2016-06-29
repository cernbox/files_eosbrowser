<?php

namespace OCA\Files_EosBrowser;

use OCP\Activity\IExtension;

class Activity extends IExtension
{
	const TYPE_EOSBROWSER = 'eosbrowser';
	
	public function getNotificationTypes($languageCode)
	{
		return false;
	}
	
	public function getDefaultTypes($method)
	{
		return [self::TYPE_EOSBROWSER];
	}
	
	public function getTypeIcon($type)
	{
		return 'icon-external';
	}
	
	public function translate($app, $text, $params, $stripPath, $highlightParams, $languageCode)
	{
		return false;
	}
	
	public function getSpecialParameterList($app, $text)
	{
		return false;
	}
	
	public function getGroupParameter($activity)
	{
		return false;
	}
	
	public function getNavigation()
	{
		return false;
	}
	
	public function isFilterValid($filterValue)
	{
		return false;
	}
	
	public function filterNotificationTypes($types, $filter)
	{
		return false;
	}
	
	public function getQueryForFilter($filter)
	{
		return false;
	}
}