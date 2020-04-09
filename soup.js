const { Soup, GObject } = imports.gi;
const ByteArray = imports.byteArray;
const noop = () => {};

var TvRemoteServer = GObject.registerClass(
class TvRemoteServer extends Soup.Server
{
	_init()
	{
		super._init();

		this.add_handler('/', this._onDefaultAccess);
		this.listen_local(0, Soup.ServerListenOptions.IPV4_ONLY);
	}

	_onDefaultAccess(self, msg)
	{
		msg.status_code = 404;
	}
});

var TvRemoteClient = GObject.registerClass(
class TvRemoteClient extends Soup.Session
{
	_init(host, port)
	{
		super._init({
			timeout: 3,
			use_thread_context: true
		});

		this.apiHost = '127.0.0.1';
		this.apiPort = 9090;
		this.wsConn = null;

		this.setApiHost(host);
		this.setApiPort(port);
	}

	setApiHost(host)
	{
		this.apiHost = (host) ? host : '127.0.0.1';
	}

	setApiPort(port)
	{
		this.apiPort = (port && port > 0) ? parseInt(port) : 9090;
	}

	_getRequest(type, cb)
	{
		cb = cb || noop;

		let message = Soup.Message.new(
			'GET', 'http://127.0.0.1:' + this.nodePort + '/api/' + type
		);

		this.queue_message(message, () =>
		{
			let result = null;

			if(
				typeof message === 'object'
				&& message.response_body
				&& typeof message.response_body === 'object'
				&& message.response_body.data
			) {
				try { result = JSON.parse(message.response_body.data); }
				catch(err) {}
			}

			return cb(result);
		});
	}

	cecApiRequest()
	{
		let ip = webConfig.ip || '127.0.0.1';
		let port = webConfig.port || 8080;

		query = (typeof query !== 'string' || !this.devicesMenu) ? ''
			: (query === 'changeSource') ? 'dev0/' + query
			: this.devicesMenu.activeDevId + '/' + query;

		this._getRequest(query);
	}

	connectWs(cb)
	{
		cb = cb || noop;

		if(!this.apiPort)
			cb(new Error('No websocket port to connect'));

		let message = Soup.Message.new(
			'GET', 'ws://' + this.apiHost + ':' + this.apiPort + '/jsonrpc'
		);

		this.websocket_connect_async(message, null, null, null, (self, res) =>
		{
			let conn = null;
			try { conn = this.websocket_connect_finish(res); }
			catch(err) { return cb(err); }

			this.wsConn = conn;

			return cb(null);
		});
	}

	disconnectWs(cb)
	{
		cb = cb || noop;

		if(
			!this.wsConn
			|| this.wsConn.get_state() !== Soup.WebsocketState.OPEN
		)
			return cb(null);

		this.wsConn.connect('closed', () =>
		{
			this.wsConn = null;
			cb(null);
		});

		this.wsConn.close(Soup.WebsocketCloseCode.NORMAL, null);
	}

	onWsMsg(cb)
	{
		if(!this.wsConn)
			return cb(new Error('Websocket not connected'));

		this.wsConn.connect('message', (self, type, bytes) =>
		{
			/* Ignore not compatible messages */
			if(type !== Soup.WebsocketDataType.TEXT)
				return;

			let msg = bytes.get_data();

			if(msg instanceof Uint8Array)
				msg = ByteArray.toString(msg);

			let parsedData = null;
			try {
				parsedData = JSON.parse(msg);
			}
			catch(err) {
				return cb(new Error('Could not parse websocket data'));
			}

			return cb(null, parsedData);
		});
	}

	sendWsMsg(method, params, id)
	{
		if(
			!this.wsConn
			|| this.wsConn.get_state() !== Soup.WebsocketState.OPEN
		)
			return;

		let data = {
			jsonrpc: "2.0",
			method: method,
			id: id || 1,
			params: params
		};

		this.wsConn.send_text(JSON.stringify(data));
	}
});
