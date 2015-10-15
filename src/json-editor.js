var JsonEditor = function(config, options) {
	var self = this;

	config = config || {};

	self.editor = {
		selector : config.selector,
		width : config.width || '100%',
		height : config.height,
		theme : config.theme || 'default',
		lineNumbers : config.lineNumbers,
		spacing : config.spacing || 4,
		readOnly : config.readOnly
	};

	var $editor = $(self.editor.selector);

	if (this.codeMirror == null) {
		this.codeMirror = CodeMirror.fromTextArea($editor.get(0), {
			mode: 'javascript',
			theme: self.editor.theme,
			readOnly: self.editor.readOnly,
			lineNumbers: self.editor.lineNumbers
		});
	}

	self.resize();
	self.load(options);
};

JsonEditor.dataTypes = {
	json : 'json',
	csv  : 'text'
};

JsonEditor.prototype.parseOptions = function(options) {
	var self = this;

	options = options || {};

	self.strict = options.strict || self.strict;
	self.url = options.url || self.url || '';
	self.json = options.json || self.json;

	// Optional
	self.indexBy = options.indexBy || self.indexBy;	
	self.castTypes = options.types || self.castTypes;

	self.dataType = JsonEditor.getDataType(self.url);
};

JsonEditor.prototype.load = function(options) {
	var self = this;

	self.parseOptions(options || {});

	if (self.json) {
		self.setValue(self.json);
		return;
	}

	if (self.url.length > 0) {
		$.ajax({
			url: self.url,
			type: 'GET',
			dataType: self.dataType,
			success: function(data) {
				self.onLoad.apply(self, arguments);
			}
		});
	}
};

JsonEditor.prototype.onLoad = function(data) {	
	var self = this;

	console.log(data);

	self.setValue(self.indexData(self.processData(data)));
};

JsonEditor.prototype.setValue = function(value) {
	var self = this;

	// Validation
	if (self.strict && typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch (e) {
			value = {
				message : "Error parsing JSON.",
				source : value
			}
		}
	}

	if (typeof value !== 'string') {
		value = JSON.stringify(value, null, self.editor.spacing);
	}

	this.codeMirror.getDoc().setValue(value);
};

JsonEditor.prototype.processData = function(data) {
	var self = this;

	if (self.dataType === 'text') {
		return new CSV(data, {
			header: true,
			cast: self.castTypes
		}).parse();
	}

	return data;
};

JsonEditor.prototype.indexData = function(data) {
	return this.indexBy != null ? _.indexBy(data, this.indexBy) : data;
};

JsonEditor.prototype.resize = function() {
	this.codeMirror.setSize(this.editor.width, this.editor.height);
};

JsonEditor.getDataType = function(filename, ext) {
	return ext || JsonEditor.dataTypes[JsonEditor.getFileExt(filename)] || 'text';
};

JsonEditor.getFileExt = function(filename) {
	// See: http://stackoverflow.com/a/12900504
	return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};