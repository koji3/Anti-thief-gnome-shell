const Lang   = imports.lang;
const Main   = imports.ui.main;
const UPower = imports.ui.status.power.UPower;
const St     = imports.gi.St;

let _activateAlarmButton = null;
let _Activated = false;

// Main extension API
function init() { 
	_activateAlarmButton = new St.Bin({ style_class: 'panel-button', 
									reactive: true,
									can_focus: true,
									x_fill: true,
									y_fill: false,
									track_hover: true });
	let icon = new St.Icon ({ icon_name: 'changes-prevent-symbolic',
							style_class: 'system-status-icon'});
	_activateAlarmButton.set_child(icon);
	_activateAlarmButton.connect('button-press-event', _AlarmActivate);
};

function _AlarmActivate () {
	let _Activated = !_Activated;
}

//Enable
function enable() {
	Main.panel._rightBox.insert_child_at_index(_activateAlarmButton,0);
	battery.bind().update();
};

//Disable
function disable() {
	Main.panel._rightBox.remove_child(_activateAlarmButton);
	battery.unbind().show();
};

// Namespace for extension logic
let battery = {
	// Watcher ID to disable listening
	watching: null,

	// Start listen to battery status changes
	bind: function () {
		this.getBattery(function (proxy) {
			let update = Lang.bind(this, this.update);
			this.watching = proxy.connect('g-properties-changed', update);
		});
		return this;
	},

	// Stop listen to battery status changes
	unbind: function () {
		this.getBattery(function (proxy) {
			proxy.disconnect(this.watching);
		});
		return this;
	},

	// Show alarm icon in status area		TODO
	show: function () {
		this.getBattery(function (proxy, icon) {
			icon.show();
		});
		return this;
	},
	
	// Hide alarm icon in status area		TODO
	hide: function () {
		this.getBattery(function (proxy, icon) {
			icon.hide();
		});
		return this;
	},

	// Play a sound			TODO
	play: function () {
		this.getBattery(function (proxy, icon) {
			icon.show();
		});
		return this;
	},
	
	// pause a sound			TODO
	pause: function () {
		this.getBattery(function (proxy, icon) {
			icon.show();
		});
		return this;
	},

	// Return GNOME Shell version
	shell: function () {
		var parts = imports.misc.config.PACKAGE_VERSION.split('.')
		return parseFloat(parts[0] + '.' + parts[1]);
	},

	// Check current battery state and hide or show icon
	update: function () {
		if ( this.shell() >= 3.12 ) {
			this.getBattery(function (proxy) {
				var batteryPowered = UPower.DeviceKind.BATTERY,
					fullyCharged = UPower.DeviceState.FULLY_CHARGED;
					charging = UP_DEVICE_STATE_CHARGING;
					discharging = UP_DEVICE_STATE_DISCHARGING;

				if ((proxy.State ==  fullyCharged || proxy.State ==  charging ) && proxy.Type == batteryPowered) {
					this.pause();
				} else {
					this.play();
				}
			});
		} else {
			this.getDevice(function (device) {
				if ( device.state == UPower.DeviceState.FULLY_CHARGED ) {
					this.hide();
				} else {
					this.show();
				}
			});
		}

		return this;
	},

	// Execute `callback` on every battery device
	getDevice: function (callback) {
		this.getBattery(function (proxy) {
			proxy.GetDevicesRemote(Lang.bind(this, function(result, error) {
				if ( error ) {
					return;
				}

				let devices = result[0];
				for ( let i = 0; i < devices.length; i++ ) {
					let device = {
						id:	  devices[i][0],
						type:	devices[i][1],
						icon:	devices[i][2],
						percent: devices[i][3],
						state:   devices[i][4],
						time:	devices[i][5]
					};

					if ( device.type == UPower.DeviceKind.BATTERY ) {
						callback.call(this, device);
						break;
					}
				}
			}));
		});
	},

	// Run `callback`, only if battery is avaiable. First argument will be icon,
	// second will be it proxy.
	getBattery: function (callback) {
		let menu = Main.panel.statusArea.aggregateMenu;
		if ( menu && menu._power ) {
			callback.call(this, menu._power._proxy, menu._power.indicators);
		}
	}
};
