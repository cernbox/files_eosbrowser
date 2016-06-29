/**
 * 
 */
if (!OCA.EosBrowser) 
{
	OCA.EosBrowser = {};
}

(function() {
	OCA.EosBrowser.App = _.extend({}, OCA.Files.App.prototype,
	{
		fileList: null,
		instance: '-2',
		
		initialize: function($el) 
		{	
			if (this.fileList) 
			{
				return this.fileList;
			}
	
			this.fileList = new OCA.EosBrowser.FileList(
				$el,
				{
					id: 'eosbrowser.self',
					scrollContainer: $('#app-content'),
					fileActions: this._createFileActions()
				}
			);
	
			this.fileList.appName = t('files_eosbrowser', 'EOS Instances Browser');
			this.fileList.$el.find('#emptycontent').html('<div class="icon-settings"></div>' +
				'<h2>' + t('files_eosbrowser', 'No contents in this folder') + '</h2>' +
				'<p>' + t('files_eosbrowser', 'Files and folders you are allowed to see will appear here') + '</p>');
			return this.fileList;
		},
		
		removeContent: function() 
		{
			if (this.fileList) 
			{
				this.fileList.$fileList.empty();
			}
		},
	
		/**
		 * Destroy the app
		 */
		destroy: function() 
		{
			this.removeContent();
		},
	
		_createFileActions: function() 
		{
			
			var fileActions = new OCA.Files.FileActions();
			
			// We let the default navigation handler to fetch the content (this allow us to use the default
			// ajax calls implementation by letting ownCloud to resolve the project as a "share")
			var self = this;
			fileActions.register('dir', 'Open', OC.PERMISSION_READ, '', function (filename, context) 
			{
				if(context.$file.attr('custom-perm') === '-1')
				{
					OC.dialogs.alert('You do not have permission to browser ' + filename, 'Error');
				}
				else if(self.fileList.getCurrentDirectory() === '/' && self.instance === '-2')
				{
					self.instance = context.$file.attr('eos-instance');
					self.fileList.changeDirectory('/', true, true);
				}
				else
				{
					self.fileList.changeDirectory(self.fileList.getCurrentDirectory() + '/' + filename, true, true);
				}
			});
			fileActions.setDefault('dir', 'Open');
			return fileActions;
		},
	});
})();

$(document).ready(function() 
{
	$('#app-content-eosbrowser').on('show', function(e) 
	{
		OCA.EosBrowser.App.initialize($(e.target));
	});
	$('#app-content-eosbrowser').on('hide', function() 
	{
		OCA.EosBrowser.App.destroy();
	});
});