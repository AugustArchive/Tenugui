# Tenugui
> :peacock: **Net protocol for worker_threads that is fast and scalable to send from one main server to loads of clients**

## Usage
### tenugui.Server
```js
// ESM
import tenugui from '@augu/tenugui';

// CommonJS
const tenugui = require('@augu/tenugui');

// Creating a server to handle payloads from clients
const server = new tenugui.Server('server name', {
  port: 3621, // the port to connect to
  debug: true, // provide debug logging
  modules: [] // Any modules to implement to interact with this Server
});

// Listening for clients that connected
server.on('connect', (client) => {
  console.log(`[${client.name}] New client! (connection string: '${client.connection}'`);
  // do whatever with the client, you can send messages from server -> <- client
});

// Listening for clinets to disconnect
server.on('disconnect', (client, event) => {
  console.log(`[${client.name}] Client has disconnected with ${event.code}${event.signal ? ` signal "${event.signal}"` : ''}`);
});

// Listening when we established a connection
server.on('listening', (event) => {
  console.log(`[${event.server.name}] Server has connected with connection string ${event.connection}`);
});

// Now we recieve connections
server.connect();
```

### tenugui.Client
```js
// ESM
import tenugui from '@augu/tenugui';

// CommonJS
const tenugui = require('@augu/tenugui');

// Creating a client to connect to the Tenugui server
// 1. Use a connection string
const client = new tenugui.Client('tenugui://<host>:<port>', 'client name');

// 2. UNIX Sock
const client = new tenugui.Client('/var/www/socks/tenugui.sock', 'client name');

// Emitted when we established a connection, you must use
// Client.findServer('name') to establish a connection with
// the server, this is used for multiple servers to connect
// with different clients
client.on('establish', async (event) => {
  console.log(`[${event.client.name}] Established a client, finding server...`);
  await event.client.findServer('server name');
});

// Emitted when we made a server connection when you use `client.findServer('name')`
client.on('server.establish', (event) => {
  console.log(`[${event.client.name}] Established a connection with ${event.server.name}`);
  // do stuff with `event` (tenugui.events.client.EstablishedServerEvent)
});

// Create a connection to find a Server
client.connect();
```

## Modules
Tenugui has the ability to create modular libraries to define a [Server] or [Client], this is used with the **k8s** module to create scalable servers for different pods.

```js
// ESM
import tenugui from '@augu/tenugui';

// CommonJS
const tenugui = require('@augu/tenugui');

// A Module instance
class MyModule extends tenugui.Module {
  constructor() {
    super('module name', {
      dependencies: [], // list of module dependencies
      type: tenugui.ModuleType.Server // type that this module is for
    });
  }

  onLoad(event) {
    // when the module is loaded
    // `event` is the LoadModuleEvent, which has `client` or `server` defined by the type
  }

  onUnload(event) {
    // when the module is unloaded
  }

  onMessage(event) {
    // when the module has received a message by the client or server
  }
}

// Load it with the class, which will be initialized at runtime
client.use(MyModule);

// Load it with the instance of it, used for any additional options
client.use(new MyModule());
```

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## License
**Tenugui** is released under the [**MIT**](/LICENSE) License. :)
