imports.gi.versions.Gtk = '3.0';

const { Gtk } = imports.gi;

class TVRemoteBox extends Gtk.HBox
{
	constructor(cwd)
	{
		super();

		this.remoteButtons = [];
		let popupBase = new Gtk.VBox();

		imports.searchPath.unshift(cwd);
		let layout = imports.layout;
		imports.searchPath.shift();

		layout.remoteLayout.forEach(row =>
		{
			let buttonsBox = new Gtk.HBox({
				halign: Gtk.Align.CENTER,
				valign: Gtk.Align.CENTER
			});

			row.forEach(item =>
			{
				let button = new RemoteButton(item);

				this.remoteButtons.push(button);
				buttonsBox.pack_start(button, false, false, 0);
			});

			popupBase.pack_start(buttonsBox, false, false, 0);
		});

		this.pack_start(popupBase, false, false, 0);
	}
}

class RemoteButton
{
	constructor(opts)
	{
		let color = (opts.color) ? 'color: ' + opts.color + '; ' : '';
		opts.size = opts.size || 26;
		opts.margin_lr = opts.margin_lr + 4 || 4;
		opts.margin_top = opts.margin_top + 4 || 4;
		opts.margin_bottom = opts.margin_bottom + 4 || 4;

		let provider = new Gtk.CssProvider();

		let buttonChild = (opts.icon) ?
			new Gtk.Image({ icon_name: opts.icon })
			: (opts.text) ?
			new Gtk.Label({ label: opts.text })
			: null;

		let styleText = this._getStyleText(opts);
		provider.load_from_data('.button {' + color + styleText + '}');

		this.widget = (buttonChild)
			? new Gtk.Button({ child: buttonChild })
			: new Gtk.Box();

		let style = this.widget.get_style_context();
		style.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
		style.add_class('button');

		if(!buttonChild)
			return this.widget;

		let callback = () => this.widget.opacity = (this.widget.hover) ? 1 : 0.5;

		this.signalIds = [
			this.widget.connect('clicked', callback),
			this.widget.connect('destroy', () => {
				this.signalIds.forEach(signalId => this.widget.disconnect(signalId));
			})
		];

		return this.widget;
	}

	_getStyleText(opts)
	{
		return (opts.icon) ?
				'margin-top: ' + opts.margin_top + 'px; ' +
				'margin-bottom: ' + opts.margin_bottom + 'px; ' +
				'margin-left: ' + opts.margin_lr + 'px; ' +
				'margin-right: ' + opts.margin_lr + 'px;'
			: (opts.text) ?
				'font-family: Sans-serif; ' +
				'font-weight: bold; ' +
				'font-size: 22px; ' +
				'margin-top: ' + opts.margin_top + 'px; ' +
				'margin-bottom: ' + opts.margin_bottom + 'px; ' +
				'margin-left: ' + opts.margin_lr + 'px; ' +
				'margin-right: ' + opts.margin_lr + 'px;'
			:
				'margin-top: ' + opts.margin_top + 'px; ' +
				'margin-bottom: ' + opts.margin_bottom + 'px; ' +
				'margin-left: ' + opts.margin_lr + 'px; ' +
				'margin-right: ' + opts.margin_lr + 'px;'
	}
}
