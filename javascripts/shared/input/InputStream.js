define([
	'shared/time/clock'
], function(
	clock
) {
	function InputStream() {
		this._inputs = [];
	}
	InputStream.prototype.reset = function() {
		this._inputs = [];
	};
	InputStream.prototype.scheduleInput = function(input, frame, maxFramesLate) {
		this._inputs.push({ input: input, frame: frame, maxFramesLate: maxFramesLate || 0 });
	};
	InputStream.prototype.popInputs = function() {
		//return inputs that are happening right now or in the very recent past
		var inputs = this._inputs.filter(function(input) {
			return input.frame <= clock.frame && input.frame + (input.maxFramesLate) >= clock.frame;
		});
		//TODO it'd be best to perform a stable sort on this
		//only keep inputs that are in the near future
		this._inputs = this._inputs.filter(function(input) {
			return input.frame > clock.frame && input.frame < clock.frame + 500;
		});
		return inputs.map(function(record) {
			return record.input;
		});
	};
	return InputStream;
});