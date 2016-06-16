define([
	'shared/config'
], function(
	sharedConfig
) {
	function InputStream() {
		this._inputs = [];
	}
	InputStream.prototype.enqueue = function(input) {
		//inputs are expected to be inserted in order
		this._inputs.push(input);
	};
	InputStream.prototype.dequeue = function(frame) {
		//return inputs that are happening right now or in the very recent past
		var inputs = this._inputs.filter(function(input) {
			return input.frame <= frame && input.frame + (input.framesLate || 0) >= frame;
		});
		//only keep inputs that are in the near future (in the next second)
		this._inputs = this._inputs.filter(function(input) {
			return input.frame > frame && input.frame - sharedConfig.FRAMES_PER_SECOND < frame;
		});
		return inputs;
	};
	InputStream.prototype.reset = function() {
		this._inputs = [];
	};
	return InputStream;
});