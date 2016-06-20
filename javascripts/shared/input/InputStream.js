define([
	'shared/config'
], function(
	sharedConfig
) {
	function InputStream() {
		this._inputs = [];
	}
	InputStream.prototype.addInput = function(input, frame, maxFramesLate) {
		//inputs are expected to be inserted in order
		this._inputs.push({ input: input, frame: frame, maxFramesLate: maxFramesLate || 0 });
	};
	InputStream.prototype.popInputs = function(frame) {
		//return inputs that are happening right now or in the very recent past
		var inputs = this._inputs.filter(function(input) {
			return input.frame <= frame && input.frame + (input.maxFramesLate) >= frame;
		});
		//only keep inputs that are in the near future
		this._inputs = this._inputs.filter(function(input) {
			return input.frame > frame && input.frame < frame + 3 * sharedConfig.FRAMES_PER_SECOND;
		});
		return inputs.map(function(record) {
			return record.input;
		});
	};
	InputStream.prototype.reset = function() {
		this._inputs = [];
	};
	return InputStream;
});