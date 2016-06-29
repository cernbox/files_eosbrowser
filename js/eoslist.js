/**
 * 
 */
(function() {

	var FileList = function($el, options) {
		this.initialize($el, options);
	};
	FileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
		/** @lends OCA.Sharing.FileList.prototype */ {
		appName: 'EOS Browser',
		id: 'eosbrowser',

		/**
		 * @private
		 */
		initialize: function($el, options) {
			if (this.initialized) {
				return;
			}
			
			OCA.Files.FileList.prototype.initialize.apply(this, arguments);
			
			OC.Plugins.attach('OCA.EosBrowser.FileList', this);
			
			this.initialized = true;
		},
		
		_createRow: function(fileData) 
		{
			var $tr = OCA.Files.FileList.prototype._createRow.apply(this, arguments);
			$tr.attr('eos-instance', fileData.eosinstance);
			$tr.attr('custom-perm', fileData.customperm);
			return $tr;
		},

		reload: function() {
			this._selectedFiles = {};
			this._selectionSummary.clear();
			if (this._currentFileModel) {
				this._currentFileModel.off();
			}
			this._currentFileModel = null;
			this.$el.find('.select-all').prop('checked', false);
			this.showMask();
			if (this._reloadCall) {
				this._reloadCall.abort();
			}
			this._reloadCall = $.ajax({
				url: OC.filePath('files_eosbrowser', 'ajax', 'list.php'),
				data: {
					instance : OCA.EosBrowser.App.instance,
					dir : this.getCurrentDirectory(),
					sort: this._sort,
					sortdirection: this._sortDirection
				}
			});
			if (this._detailsView) {
				// close sidebar
				this._updateDetailsView(null);
			}
			var callBack = this.reloadCallback.bind(this);
			return this._reloadCall.then(callBack, callBack);
		},
		
		reloadCallback: function(result) {
			delete this._reloadCall;
			this.hideMask();

			if (!result || result.status === 'error') {
				// if the error is not related to folder we're trying to load, reload the page to handle logout etc
				if (result.data.error === 'authentication_error' ||
					result.data.error === 'token_expired' ||
					result.data.error === 'application_not_enabled'
				) {
					OC.redirect(OC.generateUrl('apps/files'));
				}
				OC.Notification.showTemporary(result.data.message);
				return false;
			}

			// Firewall Blocked request?
			if (result.status === 403) {
				OCA.EosBrowser.App.instance = '-2';
				// Go home
				this.changeDirectory('/');
				OC.Notification.showTemporary(t('files', 'This operation is forbidden'));
				return false;
			}

			// Did share service die or something else fail?
			if (result.status === 500) {
				// Go home
				this.changeDirectory('/');
				OCA.EosBrowser.App.instance = '-2';
				OC.Notification.showTemporary(t('files', 'This directory is unavailable, please check the logs or contact the administrator'));
				return false;
			}

			if (result.status === 404) {
				// go back home
				OCA.EosBrowser.App.instance = '-2';
				this.changeDirectory('/');
				return false;
			}
			// aborted ?
			if (result.status === 0){
				return true;
			}

			// TODO: should rather return upload file size through
			// the files list ajax call
			this.updateStorageStatistics(true);

			if (result.data.permissions) {
				this.setDirectoryPermissions(result.data.permissions);
			}

			this.setFiles(result.data.files);
			return true;
		},
		
		setFiles: function(filesArray) 
		{
			// Remove sharing possibility
			$.each(filesArray, function(index, value)
			{
				var perm = parseInt(value['permissions']);
				perm = perm & ~OC.PERMISSION_SHARE;
				value['permissions'] = perm;
			});
			
			OCA.Files.FileList.prototype.setFiles.apply(this, arguments);
		},
		
		_onUrlChanged: function(e)
		{
			OCA.EosBrowser.App.instance = '-2';
			OCA.Files.FileList.prototype._onUrlChanged.apply(this, arguments);
		},
		
		do_delete:function(files, dir) {
			
			OC.dialogs.alert('File deletion has been disabled in this mode [EOS Browser]', 'Error');
			return;
			
			var self = this;
			var params;
			if (files && files.substr) {
				files=[files];
			}
			if (files) {
				this.showFileBusyState(files, true);
				for (var i=0; i<files.length; i++) {
				}
			}
			// Finish any existing actions
			if (this.lastAction) {
				this.lastAction();
			}

			params = {
				instance: OCA.EosBrowser.App.instance,
				dir: dir || this.getCurrentDirectory()
			};
			if (files) {
				params.files = JSON.stringify(files);
			}
			else {
				// no files passed, delete all in current dir
				params.allfiles = true;
				// show spinner for all files
				this.showFileBusyState(this.$fileList.find('tr'), true);
			}

			$.post(OC.filePath('files_eosbrowser', 'ajax', 'delete.php'),
				params,
				function(result) {
					if (result.status === 'success') {
						if (params.allfiles) {
							self.setFiles([]);
						}
						else {
							$.each(files,function(index,file) {
								var fileEl = self.remove(file, {updateSummary: false});
								// FIXME: not sure why we need this after the
								// element isn't even in the DOM any more
								fileEl.find('.selectCheckBox').prop('checked', false);
								fileEl.removeClass('selected');
								self.fileSummary.remove({type: fileEl.attr('data-type'), size: fileEl.attr('data-size')});
							});
						}
						// TODO: this info should be returned by the ajax call!
						self.updateEmptyContent();
						self.fileSummary.update();
						self.updateSelectionSummary();
						self.updateStorageStatistics();
						// in case there was a "storage full" permanent notification
						OC.Notification.hide();
					} else {
						if (result.status === 'error' && result.data.message) {
							OC.Notification.showTemporary(result.data.message);
						}
						else {
							OC.Notification.showTemporary(t('files', 'Error deleting file.'));
						}
						if (params.allfiles) {
							// reload the page as we don't know what files were deleted
							// and which ones remain
							self.reload();
						}
						else {
							$.each(files,function(index,file) {
								self.showFileBusyState(file, false);
							});
						}
					}
				});
		},
		
		createDirectory: function(name) {
			var self = this;
			var deferred = $.Deferred();
			var promise = deferred.promise();

			OCA.Files.Files.isFileNameValid(name);
			name = this.getUniqueName(name);

			if (this.lastAction) {
				this.lastAction();
			}

			$.post(
				OC.generateUrl('/apps/files_eosbrowser/ajax/newfolder.php'),
				{
					instance: OCA.EosBrowser.App.instance,
					dir: this.getCurrentDirectory(),
					foldername: name
				},
				function(result) {
					if (result.status === 'success') {
						self.add(result.data, {animate: true, scrollTo: true});
						deferred.resolve(result.status, result.data);
					} else {
						if (result.data && result.data.message) {
							OC.Notification.showTemporary(result.data.message);
						} else {
							OC.Notification.showTemporary(t('core', 'Could not create folder'));
						}
						deferred.reject(result.status);
					}
				}
			);

			return promise;
		},
		
		createFile: function(name) {
			var self = this;
			var deferred = $.Deferred();
			var promise = deferred.promise();

			OCA.Files.Files.isFileNameValid(name);
			name = this.getUniqueName(name);

			if (this.lastAction) {
				this.lastAction();
			}

			$.post(
				OC.generateUrl('/apps/files_eosbrowser/ajax/newfile.php'),
				{
					instance: OCA.EosBrowser.App.instance,
					dir: this.getCurrentDirectory(),
					filename: name
				},
				function(result) {
					if (result.status === 'success') {
						self.add(result.data, {animate: true, scrollTo: true});
						deferred.resolve(result.status, result.data);
					} else {
						if (result.data && result.data.message) {
							OC.Notification.showTemporary(result.data.message);
						} else {
							OC.Notification.showTemporary(t('core', 'Could not create file'));
						}
						deferred.reject(result.status, result.data);
					}
				}
			);

			return promise;
		},
		
		rename: function(oldname) {
			var self = this;
			var tr, td, input, form;
			tr = this.findFileEl(oldname);
			var oldFileInfo = this.files[tr.index()];
			tr.data('renaming',true);
			td = tr.children('td.filename');
			input = $('<input type="text" class="filename"/>').val(oldname);
			form = $('<form></form>');
			form.append(input);
			td.children('a.name').hide();
			td.append(form);
			input.focus();
			//preselect input
			var len = input.val().lastIndexOf('.');
			if ( len === -1 ||
				tr.data('type') === 'dir' ) {
				len = input.val().length;
			}
			input.selectRange(0, len);
			var checkInput = function () {
				var filename = input.val();
				if (filename !== oldname) {
					// Files.isFileNameValid(filename) throws an exception itself
					OCA.Files.Files.isFileNameValid(filename);
					if (self.inList(filename)) {
						throw t('files', '{new_name} already exists', {new_name: filename});
					}
				}
				return true;
			};

			function restore() {
				input.tooltip('hide');
				tr.data('renaming',false);
				form.remove();
				td.children('a.name').show();
			}

			form.submit(function(event) {
				event.stopPropagation();
				event.preventDefault();
				if (input.hasClass('error')) {
					return;
				}

				try {
					var newName = input.val();
					input.tooltip('hide');
					form.remove();

					if (newName !== oldname) {
						checkInput();
						// mark as loading (temp element)
						self.showFileBusyState(tr, true);
						tr.attr('data-file', newName);
						var basename = newName;
						if (newName.indexOf('.') > 0 && tr.data('type') !== 'dir') {
							basename = newName.substr(0, newName.lastIndexOf('.'));
						}
						td.find('a.name span.nametext').text(basename);
						td.children('a.name').show();

						$.ajax({
							url: OC.filePath('files_eosbrowser','ajax','rename.php'),
							data: {
								instance: OCA.EosBrowser.App.instance,
								dir : tr.attr('data-path') || self.getCurrentDirectory(),
								newname: newName,
								file: oldname
							},
							success: function(result) {
								var fileInfo;
								if (!result || result.status === 'error') {
									OC.dialogs.alert(result.data.message, t('files', 'Could not rename file'));
									fileInfo = oldFileInfo;
									if (result.data.code === 'sourcenotfound') {
										self.remove(result.data.newname, {updateSummary: true});
										return;
									}
								}
								else {
									fileInfo = result.data;
								}
								// reinsert row
								self.files.splice(tr.index(), 1);
								tr.remove();
								tr = self.add(fileInfo, {updateSummary: false, silent: true});
								self.$fileList.trigger($.Event('fileActionsReady', {fileList: self, $files: $(tr)}));
								self._updateDetailsView(fileInfo.name, false);
							}
						});
					} else {
						// add back the old file info when cancelled
						self.files.splice(tr.index(), 1);
						tr.remove();
						tr = self.add(oldFileInfo, {updateSummary: false, silent: true});
						self.$fileList.trigger($.Event('fileActionsReady', {fileList: self, $files: $(tr)}));
					}
				} catch (error) {
					input.attr('title', error);
					input.tooltip({placement: 'right', trigger: 'manual'});
					input.tooltip('show');
					input.addClass('error');
				}
				return false;
			});
			input.keyup(function(event) {
				// verify filename on typing
				try {
					checkInput();
					input.tooltip('hide');
					input.removeClass('error');
				} catch (error) {
					input.attr('title', error);
					input.tooltip({placement: 'right', trigger: 'manual'});
					input.tooltip('show');
					input.addClass('error');
				}
				if (event.keyCode === 27) {
					restore();
				}
			});
			input.click(function(event) {
				event.stopPropagation();
				event.preventDefault();
			});
			input.blur(function() {
				form.trigger('submit');
			});
		},
		
		move: function(fileNames, targetPath) {
			var self = this;
			var dir = this.getCurrentDirectory();
			var target = OC.basename(targetPath);
			if (!_.isArray(fileNames)) {
				fileNames = [fileNames];
			}
			_.each(fileNames, function(fileName) {
				var $tr = self.findFileEl(fileName);
				self.showFileBusyState($tr, true);
				// TODO: improve performance by sending all file names in a single call
				$.post(
					OC.filePath('files_eosbrowser', 'ajax', 'move.php'),
					{
						instance: OCA.EosBrowser.App.instance,
						dir: dir,
						file: fileName,
						target: targetPath
					},
					function(result) {
						if (result) {
							if (result.status === 'success') {
								// if still viewing the same directory
								if (self.getCurrentDirectory() === dir) {
									// recalculate folder size
									var oldFile = self.findFileEl(target);
									var newFile = self.findFileEl(fileName);
									var oldSize = oldFile.data('size');
									var newSize = oldSize + newFile.data('size');
									oldFile.data('size', newSize);
									oldFile.find('td.filesize').text(OC.Util.humanFileSize(newSize));

									// TODO: also update entry in FileList.files

									self.remove(fileName);
								}
							} else {
								OC.Notification.hide();
								if (result.status === 'error' && result.data.message) {
									OC.Notification.showTemporary(result.data.message);
								}
								else {
									OC.Notification.showTemporary(t('files', 'Error moving file.'));
								}
							}
						} else {
							OC.dialogs.alert(t('files', 'Error moving file'), t('files', 'Error'));
						}
						self.showFileBusyState($tr, false);
					}
				);
			});
		},
		
		getDownloadUrl: function (files, dir)
		{
			var params = 
			{
				instance: OCA.EosBrowser.App.instance,
				dir: dir,
				files: files
			};
			
			var stringParam = '?' + OC.buildQueryString(params);
			
			return OC.filePath('files_eosbrowser', 'ajax', 'download.php') + stringParam;
		},
	});


	OCA.EosBrowser.FileList = FileList;
})();