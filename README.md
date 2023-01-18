# async hooks & the Node driver

## tl;dr

The async hooks api is divided into three parts:

- async resources
- async hooks
- async local storage

Async resources are resources that are associated with an asynchronous callback.  When an
async resource executes its callback, the callback is executed within an asynchronous context.

Async hooks allow tracking of async resources.  Specifically,
async hooks allow the tracking of:

- when an async resource is initialized
- when the async resource calls its associated callback
- when the associated callback finishes
- when the async resource is destroyed

Bullets 2 & 3 can happen multiple times (for resources that may call
their callbacks multiple times).

Each async resource is associated with an async context, and if the resource's callback
is not intentionally executed within the context of its async resource, async hooks will not 
be able to properly track the execution of async code across multiple async resources.

Async local storage builds on top async resources and provides a mechanism to store state
across multiple async contexts.  Async local storage requires that async resources properly
bind their async context when executing their callback.  See the driver example for an example
of using async local storage, and the difference between driver versions <4.11 and those above.