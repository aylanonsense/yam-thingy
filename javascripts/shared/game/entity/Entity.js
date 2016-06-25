define(function() {
	function Entity(id, type) {
		this.id = id;
		this.type = type;
	}
	Entity.prototype.getProperties = function(keys) {
		var props = {};
		for(var i = 0; i < keys.length; i++) {
			props[keys[i]] = this[keys[i]];
		}
		return props;
	};
	Entity.prototype.setProperties = function(keys, props) {
		for(var i = 0; i < keys.length; i++) {
			if(typeof props[keys[i]] !== 'undefined') {
				this[keys[i]] = props[keys[i]];
			}
		}
	};
	return Entity;
});