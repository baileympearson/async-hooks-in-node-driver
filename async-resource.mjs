import { AsyncLocalStorage, AsyncResource, createHook} from 'node:async_hooks';

class ConnectionWithoutTracking {
	command(callback) {
		setTimeout(() => callback(), 1000)
	}

	commandRecursive(callback, count = 0) {
		if (count === 5 ) {
			return process.nextTick(() => callback());
		}
		setTimeout(() => {
			this.commandRecursive(callback, count + 1);
		}, 1000)
	}
}

class ConnectionWithTracking extends AsyncResource {
	constructor() {
		super('CustomConnection');
	}

	command(callback) {
		this.runInAsyncScope(() => {
			setTimeout(() => {
				callback();
			}, 1000)
		})
	}

	commandRecursive(callback, count = 0) {
		this.runInAsyncScope(() => {
			if (count === 5 ) {
				return process.nextTick(() => callback());
			}
			setTimeout(() => {
				this.commandRecursive(callback, count + 1);
			}, 1000)
		})
	}
}

function makeHook() {
	const resources = new Map();
	const hook = createHook({
		init: (asyncId, type, triggerAsyncId, resource) => {
			resources.set(asyncId, { 
				asyncId, 
				resource,
				type,
				triggerAsyncId
			})
		}
	})

	hook.resources = resources;

	return hook
}

const hook = makeHook();
hook.enable();

/**
 * toggle between the following lines and observe the difference in output.  key notes
 * 
 * ConnectionWithoutTracking
 * - the async hook captures the Timeout object created by executing command.  the `triggerAsyncId`
 *   field of the Timeout resource is `0`, indicating that it was triggered by the global async scope.
 * 
 * ConnectionWithTracking
 * - The output shows a new async resource with type `CustomConnection`.  This is useful for tracking
 *	 async resources that a library creates.
 * - More interestingly, the Timeout resource's triggerAsyncId is the same as the asyncId of `CustomConnection`.
 * 	 This connection (the parent-child relationship) is enabled by wrapping the timeout in `this.runInAsyncScope`.
 */
const connection = new ConnectionWithoutTracking();
// const connection = new ConnectionWithTracking();
connection.command(() => 
	console.error(hook.resources)
);

/**
 * Toggling between the preceding example and this example demonstrates that
 * by using `runInAsyncScope`, each timeout object is triggered by the connection, not
 * by the preceding timeout.
 */
// connection.commandRecursive(() => 
// 	console.error(hook.resources)
// );
