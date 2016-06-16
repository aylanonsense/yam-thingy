define([
	'shared/util/EventHelper',
	'time/now'
], function(
	EventHelper,
	now
) {
	//this is a module that automatically dequeues items put into it at the time specified
	// a slow item at the front of the queue will "hold up" the items behind it (hence a queue)
	function DelayQueue() {
		this._queue = [];
		this._timer = null;
		this._events = new EventHelper([ 'dequeue' ]);
	}
	DelayQueue.prototype.empty = function() {
		if(this._timer) {
			clearTimeout(this._timer);
		}
		this._queue = [];
		this._timer = null;
	};
	DelayQueue.prototype.enqueue = function(item, timeToDequeue) {
		//we put it in a queue and schedule a time (in seconds) for it to be dequeued
		this._queue.push({ time: timeToDequeue, item: item });
		this._checkForDequeue();
	};
	DelayQueue.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	DelayQueue.prototype._checkForDequeue = function() {
		//if there are queued items and no timer is currently going...
		if(this._queue.length > 0 && !this._timer) {
			var time = now();
			//if the first item is scheduled to dequeue now or in the past, dequeue it
			if(this._queue[0].time <= time) {
				this._dequeue();
			}
			//otherwise schedule the item to be dequeued
			else {
				var self = this;
				this._timer = setTimeout(function() {
					self._timer = null;
					self._dequeue();
				}, this._queue[0].time - time);
			}
		}
	};
	DelayQueue.prototype._dequeue = function() {
		this._events.trigger('dequeue', this._queue.shift().item);
		this._checkForDequeue();
	};
	return DelayQueue;
});