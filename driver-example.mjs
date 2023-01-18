/**
 * example script demonstrating async context tracking issues in the Node driver
 * 
 * run with both 4.10 and 4.11+ of the driver and observe the difference
 * 
 * tl;dr
 * 
 * NodeJS defines an async resource as a resource associated with a callback (see question 1).
 * Async resources' callbacks are executed within an asynchronous context.  Async hooks provide
 * an API to track these asynchronous resources 
 */
import { MongoClient } from 'mongodb';
import { AsyncLocalStorage } from 'node:async_hooks';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const collection = client.db('foo').collection('bar');

const localStorage = new AsyncLocalStorage();

function callbacks() {
	localStorage.run({ storeId: 1 }, () => {
		collection.insertOne({ name: "bailey" }, () => {
			const store = localStorage.getStore();
			console.error('callbacks', { store });
		})
	})
}

function promises() {
	localStorage.run({ storeId: 1 }, async () => {
		await collection.insertOne({ name: 'bailey' });
		const store = localStorage.getStore();
		console.error('promises', { store });
	})
}

callbacks();
promises();

setTimeout(() => {
	client.close()
}, 4000)