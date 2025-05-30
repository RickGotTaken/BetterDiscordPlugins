/**
 * @name XenoLib
 * @description Simple library to complement plugins with shared code without lowering performance. Also adds needed buttons to some plugins.
 * @author 1Lighty
 * @authorId 239513071272329217
 * @version 1.4.24
 * @invite NYvWdN5
 * @donate https://paypal.me/lighty13
 * @source https://github.com/1Lighty/BetterDiscordPlugins/blob/master/Plugins/1XenoLib.plugin.js
 * @updateUrl https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js
 */
/*@cc_on
@if (@_jscript)

   // Offer to self-install for clueless users that try to run this directly.
   var shell = WScript.CreateObject('WScript.Shell');
   var fs = new ActiveXObject('Scripting.FileSystemObject');
   var pathPlugins = shell.ExpandEnvironmentStrings('%APPDATA%\\BetterDiscord\\plugins');
   var pathSelf = WScript.ScriptFullName;
   // Put the user at ease by addressing them in the first person
   shell.Popup('It looks like you\'ve mistakenly tried to run me directly. \n(Don\'t do that!)', 0, 'I\'m a plugin for BetterDiscord', 0x30);
   if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
      shell.Popup('I\'m in the correct folder already.', 0, 'I\'m already installed', 0x40);
   } else if (!fs.FolderExists(pathPlugins)) {
      shell.Popup('I can\'t find the BetterDiscord plugins folder.\nAre you sure it\'s even installed?', 0, 'Can\'t install myself', 0x10);
   } else if (shell.Popup('Should I copy myself to BetterDiscord\'s plugins folder for you?', 0, 'Do you need some help?', 0x34) === 6) {
      fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, '1XenoLib.plugin.js'), true);
      // Show the user where to put plugins in the future
      shell.Exec('explorer ' + pathPlugins);
      shell.Popup('I\'m installed!', 0, 'Successfully installed', 0x40);
   }
   WScript.Quit();

@else@*/
/*
 * Copyright © 2019-2025, _Lighty_
 * All rights reserved.
 * Code may not be redistributed, modified or otherwise taken without explicit permission.
 */

// eslint-disable-next-line no-undef
if (window.__XL_waitingForWatcherTimeout && !window.__XL_assumingZLibLoaded) clearTimeout(window.__XL_waitingForWatcherTimeout);

function _extractMeta(code/* : string */)/* : BDPluginManifest */ {
  const [firstLine] = code.split('\n');
  if (firstLine.indexOf('//META') !== -1) return _parseOldMeta(code);
  if (firstLine.indexOf('/**') !== -1) return _parseNewMeta(code);
  throw new /* ErrorNoStack */Error('No or invalid plugin META header');
}

function _parseOldMeta(code/* : string */)/* : BDPluginManifest */ {
  const [meta] = code.split('\n');
  const rawMeta = meta.substring(meta.indexOf('//META') + 6, meta.indexOf('*//'));
  try {
    const parsed = JSON.parse(rawMeta);
    if (!parsed.name) throw 'ENONAME';
    parsed.format = 'json';
    return parsed;
  } catch (err) {
    if (err === 'ENONAME') throw new /* ErrorNoStack */Error('Plugin META header missing name property');
    throw new /* ErrorNoStack */Error('Plugin META header could not be parsed');
  }
}

function _parseNewMeta(code/* : string */)/* : BDPluginManifest */ {
  const ret = {};
  let key = '';
  let value = '';
  try {
    const jsdoc = code.substr(code.indexOf('/**') + 3, code.indexOf('*/') - code.indexOf('/**') - 3);
    for (let i = 0, lines = jsdoc.split(/[^\S\r\n]*?(?:\r\n|\n)[^\S\r\n]*?\*[^\S\r\n]?/); i < lines.length; i++) {
      const line = lines[i];
      if (!line.length) continue;
      if (line[0] !== '@' || line[1] === ' ') {
        value += ` ${line.replace('\\n', '\n').replace(/^\\@/, '@')}`;
        continue;
      }
      if (key && value) ret[key] = value.trim();
      const spaceSeperator = line.indexOf(' ');
      key = line.substr(1, spaceSeperator - 1);
      value = line.substr(spaceSeperator + 1);
    }
    ret[key] = value.trim();
    ret.format = 'jsdoc';
  } catch (err) {
    throw new /* ErrorNoStack */Error(`Plugin META header could not be parsed ${err}`);
  }
  if (!ret.name) throw new /* ErrorNoStack */Error('Plugin META header missing name property');
  return ret;
}

try {
  const fs = require('fs');
  const path = require('path');

  const HOTFIXES = {
    'className: "react-wrapper", ref: "element"': 'className: "react-wrapper", ref: (e) => {if (!this.refs) this.refs = {}; this.refs.element = e;}',
    '    /** Fired when root node added to DOM */\n    onAdded() {\n        const reactElement = modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.ReactDOM.render(modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.React.createElement(ReactSetting, Object.assign({\n            title: this.name,\n            type: this.type,\n            note: this.note,\n        }, this.props)), this.getElement());\n\n        if (this.props.onChange) reactElement.props.onChange = this.props.onChange(reactElement);\n        reactElement.forceUpdate();\n    }\n\n    /** Fired when root node removed from DOM */\n    onRemoved() {\n        modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.ReactDOM.unmountComponentAtNode(this.getElement());\n    }': '    /** Fired when root node added to DOM */\n    onAdded() {\n        this.rroot = BdApi.ReactDOM.createRoot(this.getElement());\n        this.rroot.render(modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.React.createElement(ReactSetting, Object.assign({\n            title: this.name,\n            type: this.type,\n            note: this.note,\n        }, this.props)));\n\n        const instance = this.rroot?._internalRoot?.current?.child?.stateNode;\n        if (!instance) return;\n        if (this.props.onChange) instance.props.onChange = this.props.onChange(instance);\n        instance.forceUpdate();\n    }\n\n    /** Fired when root node removed from DOM */\n    onRemoved() {\n        this.rroot.unmount();\n    }',
    "/** \n * Creates a textbox using discord's built in textbox.\n * @memberof module:Settings\n * @extends module:Settings.SettingField\n */\nclass Textbox": "/** \n * Creates a textbox using discord's built in textbox.\n * @memberof module:Settings\n * @extends module:Settings.SettingField\n */\n\nclass TextBoxWrapper extends BdApi.React.PureComponent {\n    constructor(...args) {\n        super(...args);\n        this.state = {\n          value: this.props.value\n        };\n\n        this.onChange = this.onChange.bind(this);\n      }\n\n      onChange(value) {\n        this.setState({ value });\n        this.props.onChange(value);\n      }\n\n      render() {\n        return BdApi.React.createElement(modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.Textbox, { ...this.props, value: this.state.value, onChange: this.onChange });\n      }\n}\n\nclass Textbox",
    "super(name, note, onChange, modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.Textbox, {": "super(name, note, onChange, TextBoxWrapper, {"
  }

  let ZLibCode = fs.readFileSync(path.join(__dirname, '0PluginLibrary.plugin.js'), 'utf8');
  let gotChanged = false;

  for (const [key, value] of Object.entries(HOTFIXES)) {
    if (!ZLibCode.includes(key)) continue;
    ZLibCode = ZLibCode.replace(key, value);
    gotChanged = true;
  }
  if (gotChanged) {
    fs.writeFileSync(path.join(__dirname, '0PluginLibrary.plugin.js'), ZLibCode, 'utf8');
    console.log('Patched ZLib');
  }
} catch (err) {
  console.error('Failed to patch ZLib', err);
}
module.exports = (() => {
  const canUseAstraNotifAPI = !!(global.Astra && Astra.n11s && Astra.n11s.n11sApi);
  // 1 day interval in milliseconds
  const USER_COUNTER_INTERVAL = 1000 * 60 * 60 * 24 * 1;
  /* Setup */
  const config = {
    main: 'index.js',
    info: {
      name: 'XenoLib',
      authors: [
        {
          name: 'Lighty',
          discord_id: '239513071272329217',
          github_username: '1Lighty',
          twitter_username: ''
        }
      ],
      version: '1.4.24',
      description: 'Simple library to complement plugins with shared code without lowering performance. Also adds needed buttons to some plugins.',
      github: 'https://github.com/1Lighty',
      github_raw: 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js'
    },
    changelog: [
      {
        type: 'fixed',
        items: ['Fixed issues related to Discord updating React to a newer version.']
      }
    ],
    defaultConfig: [
      canUseAstraNotifAPI ? {} : {
        type: 'category',
        id: 'notifications',
        name: 'Notification settings',
        collapsible: true,
        shown: true,
        settings: [
          {
            name: 'Notification position',
            id: 'position',
            type: 'position',
            value: 'topRight'
          },
          {
            name: 'Notifications use backdrop-filter',
            id: 'backdrop',
            type: 'switch',
            value: true
          },
          {
            name: 'Background color',
            id: 'backdropColor',
            type: 'color',
            value: '#3e4346',
            options: {
              defaultColor: '#3e4346'
            }
          },
          {
            name: 'Timeout resets to 0 when hovered',
            id: 'timeoutReset',
            type: 'switch',
            value: true
          }
        ]
      },
      {
        type: 'category',
        id: 'addons',
        name: 'AddonCard settings',
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Add extra buttons to specific plugins',
            note: 'Disabling this will move the buttons to the bottom of plugin settings (if available)',
            id: 'extra',
            type: 'switch',
            value: true
          }
        ]
      },
      {
        type: 'category',
        id: 'userCounter',
        name: 'User counter settings',
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Enable user counter',
            id: 'enabled',
            note: 'Only active after 3 days of enabling this setting',
            type: 'switch',
            value: true
          },
          {
            id: 'enableTime',
            type: 'timeStatus',
            value: 0,
            after: 'User counter will be active ',
            active: 'User counter is currently active',
            inactive: 'User counter is currently inactive',
            time: USER_COUNTER_INTERVAL
          },
          {
            id: 'lastSubmission',
            type: 'timeStatus',
            value: 0,
            after: 'Next user counter submission will be ',
            active: 'User counter submission will be submitted on next load',
            inactive: 'User counter submissions are inactive',
            time: USER_COUNTER_INTERVAL
          }
        ]
      }
    ]
  };

  /* Build */
  const buildPlugin = ([Plugin, Api]) => {
    const start = performance.now();
    const { Settings, Modals, Utilities, WebpackModules, DiscordModules, ColorConverter, DiscordClasses, ReactTools, ReactComponents, Logger, PluginUpdater, PluginUtilities, Structs } = Api;
    const { React, ModalStack, ContextMenuActions, ChannelStore, GuildStore, UserStore, DiscordConstants, PrivateChannelActions, LayerManager, InviteActions, FlexChild, Changelog: ChangelogModal, SelectedChannelStore, SelectedGuildStore, Moment } = DiscordModules;

    const { ReactDOM } = BdApi;

    if (window.__XL_waitingForWatcherTimeout) clearTimeout(window.__XL_waitingForWatcherTimeout);

    try {
      PluginUpdater.checkForUpdate(config.info.name, config.info.version, config.info.github_raw);
    } catch (err) {
    }

    let CancelledAsync = false;
    const DefaultLibrarySettings = {};

    for (let s = 0; s < config.defaultConfig.length; s++) {
      const current = config.defaultConfig[s];
      if (current.type === 'category') {
        DefaultLibrarySettings[current.id] = {};
        for (let s = 0; s < current.settings.length; s++) {
          const subCurrent = current.settings[s];
          DefaultLibrarySettings[current.id][subCurrent.id] = subCurrent.value;
        }
      } else DefaultLibrarySettings[current.id] = current.value;
    }
    const XenoLib = {};

    if (global.XenoLib) try {
      global.XenoLib.shutdown();
      XenoLib._lazyContextMenuListeners = global.XenoLib._lazyContextMenuListeners || [];
    } catch (e) { }
    if (!XenoLib._lazyContextMenuListeners) XenoLib._lazyContextMenuListeners = [];
    XenoLib.shutdown = () => {
      try {
        Logger.log('Unpatching all');
        Patcher.unpatchAll();
      } catch (e) {
        Logger.stacktrace('Failed to unpatch all', e);
      }
      CancelledAsync = true;
      PluginUtilities.removeStyle('XenoLib-CSS');
      try {
        const notifWrapper = document.querySelector('.xenoLib-notifications');
        if (notifWrapper) {
          notifWrapper.remove();
          notifWrapper._XL_rootNode?.unmount();
        }
      } catch (e) {
        Logger.stacktrace('Failed to unmount Notifications component', e);
      }
    };

    XenoLib._ = XenoLib.DiscordUtils = window._ || WebpackModules.getByProps('bindAll', 'debounce');

    XenoLib.loadData = (name, key, defaultData, returnNull) => {
      try {
        return XenoLib._.mergeWith(defaultData ? Utilities.deepclone(defaultData) : {}, BdApi.Data.load(name, key), (_, b) => {
          if (XenoLib._.isArray(b)) return b;
        });
      } catch (err) {
        Logger.err(name, 'Unable to load data: ', err);
        if (returnNull) return null;
        return Utilities.deepclone(defaultData);
      }
    };

    // replica of zeres deprecated DiscordAPI
    XenoLib.DiscordAPI = {
      get userId() {
        const user = UserStore.getCurrentUser();
        return user && user.id;
      },
      get channelId() {
        return SelectedChannelStore.getChannelId();
      },
      get guildId() {
        return SelectedGuildStore.getGuildId();
      },
      get user() {
        return UserStore.getCurrentUser();
      },
      get channel() {
        return ChannelStore.getChannel(this.channelId);
      },
      get guild() {
        return GuildStore.getGuild(this.guildId);
      }
    };

    XenoLib.getClass = (arg, thrw) => {
      try {
        const args = arg.split(' ');
        return WebpackModules.getByProps(...args)[args[args.length - 1]];
      } catch (e) {
        if (thrw) throw e;
        if (XenoLib.DiscordAPI.userId === '239513071272329217' && !XenoLib.getClass.__warns[arg] || Date.now() - XenoLib.getClass.__warns[arg] > 1000 * 60) {
          Logger.warn(`Failed to get class with props ${arg}`, e);
          XenoLib.getClass.__warns[arg] = Date.now();
        }
        return '';
      }
    };
    XenoLib.getSingleClass = (arg, thrw) => {
      try {
        return XenoLib.getClass(arg, thrw).split(' ')[0];
      } catch (e) {
        if (thrw) throw e;
        if (XenoLib.DiscordAPI.userId === '239513071272329217' && !XenoLib.getSingleClass.__warns[arg] || Date.now() - XenoLib.getSingleClass.__warns[arg] > 1000 * 60) {
          Logger.warn(`Failed to get class with props ${arg}`, e);
          XenoLib.getSingleClass.__warns[arg] = Date.now();
        }
        return '';
      }
    };
    XenoLib.getClass.__warns = {};
    XenoLib.getSingleClass.__warns = {};

    const NOOP = () => { };
    const NOOP_NULL = () => null;

    const originalFunctionClass = Function;
    XenoLib.createSmartPatcher = patcher => {
      const createPatcher = patcher => (moduleToPatch, functionName, callback, options = {}) => {
        try {
          var origDef = moduleToPatch[functionName];
        } catch (err) {
          return Logger.error(`Failed to patch ${functionName}`, err);
        }
        if (origDef && typeof origDef === 'function' && origDef.constructor !== originalFunctionClass) window.Function = origDef.constructor;

        const unpatches = [];
        try {
          unpatches.push(patcher(moduleToPatch, functionName, callback, options) || NOOP);
        } catch (err) {
          throw err;
        } finally {
          window.Function = originalFunctionClass;
        }
        try {
          if (origDef && origDef.__isBDFDBpatched && moduleToPatch.BDFDBpatch && typeof moduleToPatch.BDFDBpatch[functionName].originalMethod === 'function') {
            /* do NOT patch a patch by ZLIb, that'd be bad and cause double items in context menus */
            if ((Utilities.getNestedProp(ZeresPluginLibrary, 'Patcher.patches') || []).findIndex(e => e.module === moduleToPatch) !== -1 && moduleToPatch.BDFDBpatch[functionName].originalMethod.__originalFunction) return;
            unpatches.push(patcher(moduleToPatch.BDFDBpatch[functionName], 'originalMethod', callback, options));
          }
        } catch (err) {
          Logger.stacktrace('Failed to patch BDFDB patches', err);
        }
        return function unpatch() {
          unpatches.forEach(e => e());
        };
      };
      return {
        ...patcher, before: createPatcher(patcher.before),
        instead: createPatcher(patcher.instead),
        after: createPatcher(patcher.after)
      };
    };

    const Patcher = XenoLib.createSmartPatcher(Api.Patcher);

    const LibrarySettings = XenoLib.loadData(config.info.name, 'settings', DefaultLibrarySettings);

    try {
      // 1 week before the API will be enabled.
      if (LibrarySettings.userCounter.enabled) {
        const { enableTime } = LibrarySettings.userCounter;
        let changed = false;
        if (enableTime) {
          if ((Date.now() - enableTime > USER_COUNTER_INTERVAL) && (Date.now() - LibrarySettings.userCounter.lastSubmission > USER_COUNTER_INTERVAL)) {
            LibrarySettings.userCounter.lastSubmission = Date.now();
            changed = true;
            require('https').get('https://astranika.com/api/analytics/submit', res => {
              res.on('error', () => { });
            });
          }
        } else {
          LibrarySettings.userCounter.enableTime = Date.now();
          changed = true;
        }
        if (changed) PluginUtilities.saveSettings(config.info.name, LibrarySettings);
      }
    } catch (err) {
      Logger.stacktrace('Failed to load user counter', err);
    }

    PluginUtilities.addStyle(
      'XenoLib-CSS',
      `
      .xenoLib-color-picker .xenoLib-button {
        min-height: 38px;
        width: 34px;
        white-space: nowrap;
        position: relative;
        transition: background-color .2s ease-in-out,color .2s ease-in-out,width .2s ease-in-out;
        overflow: hidden;
        margin: 4px 4px 4px 0;
        padding: 2px 20px;
        border-radius: 2px;
      }

      .xenoLib-color-picker .xenoLib-button:hover {
        width: 128px;
      }

      .xenoLib-color-picker .xenoLib-button .xl-text-1SHFy0 {
        opacity: 0;
        transform: translate3d(200%,0,0);

      }
      .xenoLib-color-picker .xenoLib-button:hover .xl-text-1SHFy0 {
        opacity: 1;
        transform: translateZ(0);
      }
      .xenoLib-button-icon {
        left: 50%;
        top: 50%;
        position: absolute;
        margin-left: -12px;
        margin-top: -8px;
        width: 24px;
        height: 24px;
        opacity: 1;
        transform: translateZ(0);
        transition: opacity .2s ease-in-out,transform .2s ease-in-out,-webkit-transform .2s ease-in-out;
      }
      .xenoLib-button-icon.xenoLib-revert > svg {
        width: 24px;
        height: 24px;
      }
      .xenoLib-button-icon.xenoLib-revert {
        margin-top: -12px;
      }
      .xenoLib-button:hover .xenoLib-button-icon {
        opacity: 0;
        transform: translate3d(-200%,0,0);
      }
      .xenoLib-notifications {
        position: absolute;
        color: white;
        width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        z-index: 1000;
        pointer-events: none;
        font-size: 14px;
      }
      .xenoLib-notification {
        min-width: 200px;
        overflow: hidden;
      }
      .xenoLib-notification-content-wrapper {
        padding: 22px 20px 0 20px;
      }
      .xenoLib-centering-bottomLeft .xenoLib-notification-content-wrapper:first-of-type, .xenoLib-centering-bottomMiddle .xenoLib-notification-content-wrapper:first-of-type, .xenoLib-centering-bottomRight .xenoLib-notification-content-wrapper:first-of-type {
        padding: 0 20px 20px 20px;
      }
      .xenoLib-notification-content {
        padding: 12px;
        overflow: hidden;
        background: #474747;
        pointer-events: all;
        position: relative;
        width: 20vw;
        white-space: break-spaces;
        min-width: 330px;
      }
      .xenoLib-notification-loadbar {
        position: absolute;
        bottom: 0;
        left: 0px;
        width: auto;
        background-image: linear-gradient(130deg,var(--grad-one),var(--grad-two));
        height: 5px;
      }
      .xenoLib-notification-loadbar-user {
        animation: fade-loadbar-animation 1.5s ease-in-out infinite;
      }
      @keyframes fade-loadbar-animation {
        0% {
            filter: brightness(75%)
        }
        50% {
            filter: brightness(100%)
        }
        to {
            filter: brightness(75%)
        }
      }
      .xenoLib-notification-loadbar-striped:before {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 5px;
        background: linear-gradient(
          -20deg,
          transparent 35%,
          var(--bar-color) 35%,
          var(--bar-color) 70%,
          transparent 70%
        );
        animation: shift 1s linear infinite;
        background-size: 60px 100%;
        box-shadow: inset 0 0px 1px rgba(0, 0, 0, 0.2),
          inset 0 -2px 1px rgba(0, 0, 0, 0.2);
      }
      @keyframes shift {
        to {
          background-position: 60px 100%;
        }
      }
      .xenoLib-notification-close {
        float: right;
        padding: 0;
        height: unset;
        opacity: .7;
      }
      .xenLib-notification-counter {
        float: right;
        margin-top: 2px;
      }
      .option-xenoLib {
        position: absolute;
        width: 24%;
        height: 24%;
        margin: 6px;
        border-radius: 3px;
        opacity: .6;
        background-color: #72767d;
        cursor: pointer;
        overflow: hidden;
        text-indent: -999em;
        font-size: 0;
        line-height: 0;
      }
      .selected-xenoLib.option-xenoLib {
        background-color: var(--brand-500);
        border-color: var(--brand-500);
        box-shadow: 0 2px 0 rgba(0,0,0,.3);
        opacity: 1;
      }
      .topLeft-xenoLib {
        top: 0;
        left: 0;
      }
      .topRight-xenoLib {
        top: 0;
        right: 0;
      }
      .bottomLeft-xenoLib {
        bottom: 0;
        left: 0;
      }
      .bottomRight-xenoLib {
        bottom: 0;
        right: 0;
      }
      .topMiddle-xenoLib {
        top: 0;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
      }
      .bottomMiddle-xenoLib {
        bottom: 0;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
      }
      .xenoLib-centering-topLeft, .xenoLib-centering-bottomLeft {
        align-items: flex-start;
      }
      .xenoLib-centering-topMiddle, .xenoLib-centering-bottomMiddle {
        align-items: center;
      }
      .xenoLib-centering-topRight, .xenoLib-centering-bottomRight {
        align-items: flex-end;
      }
      .xenoLib-centering-bottomLeft, .xenoLib-centering-bottomMiddle, .xenoLib-centering-bottomRight {
        flex-direction: column-reverse;
        bottom: 0;
      }
      .xenoLib-position-wrapper {
        box-sizing: border-box;
        position: relative;
        background-color: rgba(0,0,0,.1);
        padding-bottom: 56.25%;
        border-radius: 8px;
        border: 2px solid var(--brand-500);
      }
      .xenoLib-position-hidden-input {
        opacity: 0;
        position: absolute;
        top: 0;
        cursor: pointer;
      }
      /* idk why I did that .XL-chl-p img{
        width: unset !important;
      }*/
      .xenoLib-error-text {
        padding-top: 5px;
      }

      .xenoLib-multiInput {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        font-size: 16px;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        width: 100%;
        border-radius: 3px;
        color: var(--text-normal);
        background-color: var(--deprecated-text-input-bg);
        border: 1px solid var(--deprecated-text-input-border);
        -webkit-transition: border-color .2s ease-in-out;
        transition: border-color .2s ease-in-out;
      }
      .xenoLib-multiInput.xenoLib-multiInput-focused {
        border-color: var(--text-link);
      }
      .xenoLib-multiInput.xenoLib-multiInput-error {
        border-color: hsl(359,calc(var(--saturation-factor, 1)*82.6%),59.4%);
      }
      .xenoLib-multiInputFirst {
        -webkit-box-flex: 1;
        -ms-flex-positive: 1;
        flex-grow: 1
      }
      .xenoLib-multiInputField {
        border: none;
        background-color: transparent
      }
      `
    );

    {
      const hasOwn = {}.hasOwnProperty;

      XenoLib.joinClassNames = function classNames(...args/* : VariableClassNamesArgs */)/* : string */ {
        const classes = [];
        for (let i = 0, len = args.length; i < len; i++) {
          const arg = args[i];
          if (!arg) continue;
          const argType = typeof arg;
          if (argType === 'string' || argType === 'number') classes.push(arg);
          else if (Array.isArray(arg)) {
            if (arg.length) {
              const inner = classNames(...arg);
              if (inner) classes.push(inner);
            }
            // eslint-disable-next-line curly
          } else if (argType === 'object') {
            if (arg.toString === Object.prototype.toString) for (const key in arg/*  as any */) {
              if (hasOwn.call(arg, key) && arg[key]) classes.push(key);
            }
            else classes.push(arg.toString());
          }
        }

        return classes.join(' ');
      };
    }

    XenoLib.authorId = '239513071272329217';
    XenoLib.supportServerId = '389049952732446731';

    /*     try {
          const getUserAsync = WebpackModules.getByProps('getUser', 'acceptAgreements').getUser;
          const requestUser = () =>
            getUserAsync(XenoLib.authorId)
              .then(user => (XenoLib.author = user))
              .catch(() => setTimeout(requestUser, 1 * 60 * 1000));
          if (UserStore.getUser(XenoLib.authorId)) XenoLib.author = UserStore.getUser(XenoLib.authorId);
          else requestUser();
        } catch (e) {
          Logger.stacktrace('Failed to grab author object', e);
        } */

    XenoLib.ReactComponents = {};

    XenoLib.ReactComponents.ErrorBoundary = class XLErrorBoundary extends React.PureComponent {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }
      componentDidCatch(err, inf) {
        Logger.err(`Error in ${this.props.label}, screenshot or copy paste the error above to Lighty for help.`);
        this.setState({ hasError: true });
        if (typeof this.props.onError === 'function') this.props.onError(err);
      }
      render() {
        if (this.state.hasError) return null;
        return this.props.children;
      }
    };

    /* —————————————— Copyright (c) 2022 1Lighty, All rights reserved ——————————————
    *
    * A utility from Astra
    *
    * ————————————————————————————————————————————————————————————————————————————— */
    function fakeRenderHook(executor/* : () => void */, options/* : {
      preExecutor?(): void
      postExecutor?(): void
      useCallback?(...args: any[]): any
      useContext?(...args: any[]): any
      useDebugValue?(...args: any[]): any
      useDeferredValue?(...args: any[]): any
      useEffect?(...args: any[]): any
      useImperativeHandle?(...args: any[]): any
      useLayoutEffect?(...args: any[]): any
      useMemo?(...args: any[]): any
      useMutableSource?(...args: any[]): any
      useOpaqueIdentifier?(...args: any[]): any
      useReducer?(...args: any[]): any
      useRef?(...args: any[]): any
      useState?(...args: any[]): any
      useTransition?(...args: any[]): any
    } */ = {})/* : void */ {
      // @ts-ignore
      const ReactDispatcher = Object.values(React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE).find(e => e.useState);
      const oUseCallback = ReactDispatcher.useCallback;
      const oUseContext = ReactDispatcher.useContext;
      const oUseDebugValue = ReactDispatcher.useDebugValue;
      const oUseDeferredValue = ReactDispatcher.useDeferredValue;
      const oUseEffect = ReactDispatcher.useEffect;
      const oUseImperativeHandle = ReactDispatcher.useImperativeHandle;
      const oUseLayoutEffect = ReactDispatcher.useLayoutEffect;
      const oUseMemo = ReactDispatcher.useMemo;
      const oUseMutableSource = ReactDispatcher.useMutableSource;
      const oUseOpaqueIdentifier = ReactDispatcher.useOpaqueIdentifier;
      const oUseReducer = ReactDispatcher.useReducer;
      const oUseRef = ReactDispatcher.useRef;
      const oUseState = ReactDispatcher.useState;
      const oUseTransition = ReactDispatcher.useTransition;

      ReactDispatcher.useCallback = options.useCallback || (() => () => { });
      ReactDispatcher.useContext = options.useContext || (context => context._currentValue);
      ReactDispatcher.useDebugValue = options.useDebugValue || (() => { });
      ReactDispatcher.useDeferredValue = options.useDeferredValue || (val => val);
      ReactDispatcher.useEffect = options.useEffect || (() => { });
      ReactDispatcher.useImperativeHandle = options.useImperativeHandle || (() => { });
      ReactDispatcher.useLayoutEffect = options.useLayoutEffect || (() => { });
      ReactDispatcher.useMemo = options.useMemo || (memo => memo());
      ReactDispatcher.useMutableSource = options.useMutableSource || (() => { });
      ReactDispatcher.useOpaqueIdentifier = options.useOpaqueIdentifier || (() => rand());
      ReactDispatcher.useReducer = options.useReducer || ((_, val) => [val, () => { }]);
      ReactDispatcher.useRef = options.useRef || (() => ({ current: null }));
      ReactDispatcher.useState = options.useState || (() => [null, () => { }]);
      ReactDispatcher.useTransition = options.useTransition || (() => [() => { }, true]);

      if (typeof options.preExecutor === 'function') options.preExecutor();

      let ret/* : any */ = null;
      try {
        ret = executor();
      } catch (err) {
        Logger.error('Error rendering functional component', err);
      }

      if (typeof options.postExecutor === 'function') options.postExecutor();
      ReactDispatcher.useCallback = oUseCallback;
      ReactDispatcher.useContext = oUseContext;
      ReactDispatcher.useDebugValue = oUseDebugValue;
      ReactDispatcher.useDeferredValue = oUseDeferredValue;
      ReactDispatcher.useEffect = oUseEffect;
      ReactDispatcher.useImperativeHandle = oUseImperativeHandle;
      ReactDispatcher.useLayoutEffect = oUseLayoutEffect;
      ReactDispatcher.useMemo = oUseMemo;
      ReactDispatcher.useMutableSource = oUseMutableSource;
      ReactDispatcher.useOpaqueIdentifier = oUseOpaqueIdentifier;
      ReactDispatcher.useReducer = oUseReducer;
      ReactDispatcher.useRef = oUseRef;
      ReactDispatcher.useState = oUseState;
      ReactDispatcher.useTransition = oUseTransition;

      return ret;
    }

    XenoLib.fakeRenderHook = fakeRenderHook;

    const deprecateFunction = (name, advice, ret = undefined) => () => (Logger.warn(`XenoLib.${name} is deprecated! ${advice}`), ret);

    XenoLib.patchContext = deprecateFunction('patchContext', 'Do manual patching of context menus instead.');

    const CTXMenu = WebpackModules.getByProps('default', 'MenuStyle');

    class ContextMenuWrapper extends React.PureComponent {
      constructor(props) {
        super(props);
        this.handleOnClose = this.handleOnClose.bind(this);
      }
      handleOnClose() {
        ContextMenuActions.closeContextMenu();
        if (this.props.target instanceof HTMLElement) this.props.target.focus();
      }
      render() {
        return React.createElement(CTXMenu.default, { onClose: this.handleOnClose, id: 'xenolib-context' }, this.props.menu);
      }
    }
    XenoLib.createSharedContext = (element, menuCreation) => {
      if (element.__XenoLib_ContextMenus) element.__XenoLib_ContextMenus.push(menuCreation);
      else {
        element.__XenoLib_ContextMenus = [menuCreation];
        const oOnContextMenu = element.props.onContextMenu;
        element.props.onContextMenu = e => (typeof oOnContextMenu === 'function' && oOnContextMenu(e), ContextMenuActions.openContextMenu(e, _ => React.createElement(XenoLib.ReactComponents.ErrorBoundary, { label: 'CTX Menu' }, React.createElement(ContextMenuWrapper, { menu: element.__XenoLib_ContextMenus.map(m => m()), ..._ }))));
      }
    };

    const contextMenuItems = WebpackModules.find(m => m.MenuRadioItem && !m.default);
    XenoLib.unpatchContext = deprecateFunction('unpatchContext', 'Manual patching needs manual unpatching');
    XenoLib.createContextMenuItem = (label, action, id, options = {}) => (!contextMenuItems ? null : React.createElement(contextMenuItems.MenuItem, { label, id, action: () => (!options.noClose && ContextMenuActions.closeContextMenu(), action()), ...options }));
    XenoLib.createContextMenuSubMenu = (label, children, id, options = {}) => (!contextMenuItems ? null : React.createElement(contextMenuItems.MenuItem, { label, children, id, ...options }));
    XenoLib.createContextMenuGroup = (children, options) => (!contextMenuItems ? null : React.createElement(contextMenuItems.MenuGroup, { children, ...options }));


    const lazyContextMenu = WebpackModules.getByProps('openContextMenuLazy');
    const ConnectedContextMenus = WebpackModules.getByDisplayName('ConnectedContextMenus');
    if (lazyContextMenu && ConnectedContextMenus) {
      try {
        const ContextMenus = fakeRenderHook(() => ConnectedContextMenus({}).type);
        Patcher.instead(ContextMenus.prototype, 'componentDidMount', (_this, _, orig) => {
          if (!_this.props.isOpen || !_this.props.renderLazy) return orig();
          const olRenderLazy = _this.props.renderLazy;
          _this.props.renderLazy = async () => {
            _this.props.renderLazy = olRenderLazy;
            const ret = await olRenderLazy();
            if (typeof ret === 'function') try {
              const ctxEl = ret();
              let { type } = ctxEl;
              let typeOverriden = false;
              const deepAnalyticsWrapper = type.toString().search(/\)\(\w\)\.AnalyticsLocationProvider,/) !== -1;
              const analyticsWrapper = deepAnalyticsWrapper || type.toString().includes('.CONTEXT_MENU).AnalyticsLocationProvider');
              if (type.toString().includes('objectType') || analyticsWrapper) fakeRenderHook(() => {
                const ret = type(ctxEl.props);
                if (ret.type.displayName !== 'AnalyticsContext' && !analyticsWrapper) return;
                ({ type } = ret.props.children);
                typeOverriden = true;
                if (deepAnalyticsWrapper) {
                  const deeperRet = type(ret.props.children.props);
                  if (deeperRet?.props?.children?.type) ({ type } = deeperRet.props.children);
                }
              }, {
                useState: () => [[], () => { }],
                useCallback: e => e
              });

              let changed = false;
              for (const { menuNameOrFilter, callback, multi, patchedModules } of [...XenoLib._lazyContextMenuListeners]) {
                if (typeof menuNameOrFilter === 'string' && menuNameOrFilter !== type.displayName && (!typeOverriden || menuNameOrFilter !== ctxEl.type.displayName)) continue;
                if (typeof menuNameOrFilter === 'function' && !menuNameOrFilter(type) && (!typeOverriden || !menuNameOrFilter(ctxEl.type))) continue;
                if (multi && patchedModules.indexOf(type) !== -1) continue;
                changed = callback(ctxEl.type) || changed;
                if (multi) {
                  patchedModules.push(type);
                  continue;
                }
                XenoLib._lazyContextMenuListeners = XenoLib._lazyContextMenuListeners.filter(l => l.callback !== callback);
              }
              if (changed) requestAnimationFrame(() => {
                olRenderLazy().then(r => _this.setState({ render: r }));
              });

            } catch (err) {
              Logger.error('Error rendering lazy context menu', err);
            }
            return ret;
          };
          orig();
          _this.props.renderLazy = olRenderLazy;
        });
      } catch (err) {
        Logger.err('Error patching ContextMenus', err);
      }
      XenoLib.listenLazyContextMenu = (menuNameOrFilter, callback, multi) => {
        XenoLib._lazyContextMenuListeners = XenoLib._lazyContextMenuListeners || [];
        if (!Array.isArray(XenoLib._lazyContextMenuListeners)) XenoLib._lazyContextMenuListeners = [];
        XenoLib._lazyContextMenuListeners.push({ menuNameOrFilter, callback, multi, patchedModules: [] });
        return () => {
          XenoLib._lazyContextMenuListeners = XenoLib._lazyContextMenuListeners.filter(l => l.callback !== callback);
        };
      };
    } else XenoLib.listenLazyContextMenu = (menuNameOrFilter, callback, multi) => {
      callback();
    };


    try {

      const ButtonOptionsRaw = ZLibrary.WebpackModules.getModule(e => {
        if (typeof e === 'function') return false;
        const possFuncs = Object.values(e);
        if (possFuncs.length < 3 || possFuncs.length > 8) return false;
        if (!possFuncs.some(e => typeof e === 'object' && e?.BRAND_INVERTED && typeof e.BRAND_INVERTED !== 'function')) return false;
        return true;
      })
      let ButtonOptions = {};
      for (let item of Object.values(ButtonOptionsRaw)) {
        if (item.OUTLINED) ButtonOptions.ButtonLooks = item;
        else if (item.BRAND) ButtonOptions.ButtonColors = item;
        else if (item.SMALL) ButtonOptions.ButtonSizes = item;
        else if (typeof item === 'function') {
          const funcString = item.toString();
          if (funcString.includes('.disabledButtonWrapper,')) ButtonOptions.Button = item;
          // else if (funcString.match(/to:\w,onClick:\w,onMouseUp:\w/)) ButtonOptions.ButtonLink = item;
          // else console.log('Unknown item!', item);
        }
        //else console.log('Unknown item!', item);
        // there is 1 more func called "getButtonStyle" but we don't care about it :v
      }
      if (ButtonOptions.Button.Link) ButtonOptions.ButtonLink = ButtonOptions.Button.Link;
      XenoLib.ReactComponents.ButtonOptions = ButtonOptions;
      XenoLib.ReactComponents.Button = ButtonOptions.Button;
    } catch (e) {
      Logger.stacktrace('Error getting Button component', e);
    }

    function patchAddonCardAnyway(manualPatch) {
      try {
        if (patchAddonCardAnyway.patched) return;
        patchAddonCardAnyway.patched = true;
        const LinkClassname = XenoLib.joinClassNames(XenoLib.getClass('anchorUnderlineOnHover anchor'), XenoLib.getClass('anchor anchorUnderlineOnHover'), 'bda-author');
        const handlePatch = (_this, _, ret) => {
          if (!_this.props.addon || !_this.props.addon.plugin || typeof _this.props.addon.plugin.getAuthor().indexOf('Lighty') === -1) return;
          const settingsProps = Utilities.findInReactTree(ret, e => e && e.className === 'plugin-settings');
          if (settingsProps) delete settingsProps.id;
          const author = Utilities.findInReactTree(ret, e => e && e.props && typeof e.props.className === 'string' && e.props.className.indexOf('bda-author') !== -1);
          if (!author || typeof author.props.children !== 'string' || author.props.children.indexOf('Lighty') === -1) return;
          const onClick = () => {
            if (XenoLib.DiscordAPI.userId === XenoLib.authorId) return;
            PrivateChannelActions.ensurePrivateChannel(XenoLib.DiscordAPI.userId, XenoLib.authorId).then(() => {
              PrivateChannelActions.openPrivateChannel(XenoLib.DiscordAPI.userId, XenoLib.authorId);
              LayerManager.popLayer();
            });
          };
          if (author.props.children === 'Lighty') {
            author.type = 'a';
            author.props.className = LinkClassname;
            author.props.onClick = onClick;
          } else {
            const idx = author.props.children.indexOf('Lighty');
            const pre = author.props.children.slice(0, idx);
            const post = author.props.children.slice(idx + 6);
            author.props.children = [
              pre,
              React.createElement(
                'a',
                {
                  className: LinkClassname,
                  onClick
                },
                'Lighty'
              ),
              post
            ];
            delete author.props.onClick;
            author.props.className = 'bda-author';
            author.type = 'span';
          }
          let footerProps = Utilities.findInReactTree(ret, e => e && e.props && typeof e.props.className === 'string' && e.props.className.indexOf('bda-links') !== -1);
          if (!footerProps) return;
          footerProps = footerProps.props;
          if (!Array.isArray(footerProps.children)) footerProps.children = [footerProps.children];
          const findLink = name => Utilities.findInReactTree(footerProps.children, e => e && e.props && e.props.children === name);
          const websiteLink = findLink('Website');
          const sourceLink = findLink('Source');
          const supportServerLink = findLink('Support Server');
          footerProps.children = [];
          if (websiteLink) {
            const { href } = websiteLink.props;
            delete websiteLink.props.href;
            delete websiteLink.props.target;
            websiteLink.props.onClick = () => window.open(href);
            footerProps.children.push(websiteLink);
          }
          if (sourceLink) {
            const { href } = sourceLink.props;
            delete sourceLink.props.href;
            delete sourceLink.props.target;
            sourceLink.props.onClick = () => window.open(href);
            footerProps.children.push(websiteLink ? ' | ' : null, sourceLink);
          }
          footerProps.children.push(websiteLink || sourceLink ? ' | ' : null, React.createElement('a', { className: 'bda-link bda-link-website', onClick: e => ContextMenuActions.openContextMenu(e, e => React.createElement(XenoLib.ReactComponents.ErrorBoundary, { label: 'Donate button CTX menu' }, React.createElement(ContextMenuWrapper, { menu: XenoLib.createContextMenuGroup([XenoLib.createContextMenuItem('Paypal', () => window.open('https://paypal.me/lighty13'), 'paypal'), XenoLib.createContextMenuItem('Ko-fi', () => window.open('https://ko-fi.com/lighty_'), 'kofi'), XenoLib.createContextMenuItem('Patreon', () => window.open('https://www.patreon.com/lightyp'), 'patreon')]), ...e }))) }, 'Donate'));
          footerProps.children.push(' | ', supportServerLink || React.createElement('a', { className: 'bda-link bda-link-website', onClick: () => BdApi.UI.showInviteModal('NYvWdN5') }, 'Support Server'));
          footerProps.children.push(' | ', React.createElement('a', { className: 'bda-link bda-link-website', onClick: () => (_this.props.addon.plugin.showChangelog ? _this.props.addon.plugin.showChangelog() : BdApi.UI.showChangelogModal(`${_this.props.addon.plugin.getName()} Changelog`, _this.props.addon.plugin.getVersion(), _this.props.addon.plugin.getChanges())) }, 'Changelog'));
          footerProps = null;
        };
        async function patchRewriteCard() {
          const component = [...ReactComponents.components.entries()].find(([_, e]) => e.component && e.component.prototype && e.component.prototype.reload && e.component.prototype.showSettings);
          const AddonCard = component ? component[1] : await ReactComponents.getComponent('AddonCard', '.bda-slist > .ui-switch-item', e => e.prototype && e.prototype.reload && e.prototype.showSettings);
          if (CancelledAsync) return;
          const ContentColumn = await ReactComponents.getComponent('ContentColumn', '.content-column');
          class PatchedAddonCard extends AddonCard.component {
            render() {
              const ret = super.render();
              try {
                /* did I mention I am Lighty? */
                handlePatch(this, undefined, ret);
              } catch (err) {
                Logger.stacktrace('AddonCard patch', err);
              }
              return ret;
            }
          }
          let firstRender = true;
          Patcher.after(ContentColumn.component.prototype, 'render', (_, __, ret) => {
            if (!LibrarySettings.addons.extra) return;
            const list = Utilities.findInReactTree(ret, e => e && typeof e.className === 'string' && e.className.indexOf('bd-addon-list') !== -1);
            if (Utilities.getNestedProp(list, 'children.0.props.children.type') !== AddonCard.component) return;
            for (const item of list.children) {
              const card = Utilities.getNestedProp(item, 'props.children');
              if (!card) continue;
              card.type = PatchedAddonCard;
            }
            if (!firstRender) return;
            ret.key = DiscordModules.KeyGenerator();
            firstRender = false;
          });
          if (manualPatch) return;
          ContentColumn.forceUpdateAll();
          AddonCard.forceUpdateAll();
        }
        patchRewriteCard();
      } catch (e) {
        Logger.stacktrace('Failed to patch V2C_*Card or AddonCard (BBD rewrite)', e);
      }
    }
    if (LibrarySettings.addons.extra) patchAddonCardAnyway();

    try {
      XenoLib.ReactComponents.PluginFooter = class XLPluginFooter extends React.PureComponent {
        render() {
          if (LibrarySettings.addons.extra) return null;
          return React.createElement(
            'div',
            {
              style: {
                display: 'flex'
              }
            },
            React.createElement(
              XenoLib.ReactComponents.Button,
              {
                style: {
                  flex: '2 1 auto'
                },
                onClick: this.props.showChangelog
              },
              'Changelog'
            ),
            React.createElement(
              XenoLib.ReactComponents.Button,
              {
                style: {
                  flex: '2 1 auto'
                },
                onClick: e => ContextMenuActions.openContextMenu(e, e => React.createElement(XenoLib.ReactComponents.ErrorBoundary, { label: 'Donate button CTX menu' }, React.createElement(ContextMenuWrapper, { menu: XenoLib.createContextMenuGroup([XenoLib.createContextMenuItem('Paypal', () => window.open('https://paypal.me/lighty13'), 'paypal'), XenoLib.createContextMenuItem('Ko-fi', () => window.open('https://ko-fi.com/lighty_'), 'kofi'), XenoLib.createContextMenuItem('Patreon', () => window.open('https://www.patreon.com/lightyp'), 'patreon')]), ...e })))
              },
              'Donate'
            ),
            React.createElement(
              XenoLib.ReactComponents.Button,
              {
                style: {
                  flex: '2 1 auto'
                },
                onClick: () => BdApi.UI.showInviteModal('NYvWdN5')
              },
              'Support server'
            )
          );
        }
      };
    } catch (err) {
      Logger.stacktrace('Error creating plugin footer');
      XenoLib.ReactComponents.PluginFooter = NOOP_NULL;
    }

    const TextElement = WebpackModules.getModule(e => (Object.keys(e).length === 2) && e.Colors && e.Sizes);

    /* shared between FilePicker and ColorPicker */
    const MultiInputClassname = 'xenoLib-multiInput';
    const MultiInputFirstClassname = 'xenoLib-multiInputFirst';
    const MultiInputFieldClassname = 'xenoLib-multiInputField';
    const ErrorMessageClassname = XenoLib.joinClassNames('xenoLib-error-text', XenoLib.getClass('errorMessage'), Utilities.getNestedProp(TextElement, 'Colors.ERROR'));
    const ErrorClassname = XenoLib.joinClassNames('xenoLib-multiInput-error', XenoLib.getClass('input error'));

    try {
      class DelayedCall {
        constructor(delay, callback) {
          this.delay = delay;
          this.callback = callback;
          this.timeout = null;
        }

        delay() {
          clearTimeout(this.timeout);
          this.timeout = setTimeout(this.callback, this.delay);
        }
      }
      const FsModule = require('fs');
      /**
       * @interface
       * @name module:FilePicker
       * @property {string} path
       * @property {string} placeholder
       * @property {Function} onChange
       * @property {object} properties
       * @property {bool} nullOnInvalid
       * @property {bool} saveOnEnter
       */
      XenoLib.ReactComponents.FilePicker = class FilePicker extends React.PureComponent {
        constructor(props) {
          super(props);
          this.state = {
            multiInputFocused: false,
            path: props.path,
            error: null
          };
          XenoLib._.bindAll(this, ['handleOnBrowse', 'handleChange', 'checkInvalidDir']);
          this.handleKeyDown = XenoLib._.throttle(this.handleKeyDown.bind(this), 500);
          this.delayedCallVerifyPath = new DelayedCall(500, () => this.checkInvalidDir());
        }
        checkInvalidDir(doSave) {
          FsModule.access(this.state.path, FsModule.constants.W_OK, error => {
            const invalid = (error && error.message.match(/.*: (.*), access '/)[1]) || null;
            this.setState({ error: invalid });
            if (this.props.saveOnEnter && !doSave) return;
            if (invalid) this.props.onChange(this.props.nullOnInvalid ? null : '');
            else this.props.onChange(this.state.path);
          });
        }
        handleOnBrowse() {
          DiscordNative.fileManager.showOpenDialog({ title: this.props.title, properties: this.props.properties }).then(({ filePaths: [path] }) => {
            if (path) this.handleChange(path);
          });
        }
        handleChange(path) {
          this.setState({ path });
          this.delayedCallVerifyPath.delay();
        }
        handleKeyDown(e) {
          if (!this.props.saveOnEnter || e.which !== DiscordConstants.KeyboardKeys.ENTER) return;
          this.checkInvalidDir(true);
        }
        render() {
          const n = {};
          n['xenoLib-multiInput-focused'] = this.state.multiInputFocused;
          n[ErrorClassname] = !!this.state.error;
          return React.createElement(
            'div',
            { className: DiscordClasses.BasicInputs.inputWrapper, style: { width: '100%' } },
            React.createElement(
              'div',
              { className: XenoLib.joinClassNames(MultiInputClassname, n) },
              React.createElement(DiscordModules.Textbox, {
                value: this.state.path,
                placeholder: this.props.placeholder,
                onChange: this.handleChange,
                onFocus: () => this.setState({ multiInputFocused: true }),
                onBlur: () => this.setState({ multiInputFocused: false }),
                onKeyDown: this.handleKeyDown,
                autoFocus: false,
                className: MultiInputFirstClassname,
                inputClassName: MultiInputFieldClassname
              }),
              React.createElement(XenoLib.ReactComponents.Button, { onClick: this.handleOnBrowse, color: (!!this.state.error && XenoLib.ReactComponents.ButtonOptions.ButtonColors.RED) || XenoLib.ReactComponents.ButtonOptions.ButtonColors.GREY, look: XenoLib.ReactComponents.ButtonOptions.ButtonLooks.GHOST, size: XenoLib.ReactComponents.Button.Sizes.MEDIUM }, 'Browse')
            ),
            !!this.state.error && React.createElement('div', { className: ErrorMessageClassname, style: { color: 'hsl(359,calc(var(--saturation-factor, 1)*82.6%),59.4%)' } }, 'Error: ', this.state.error)
          );
        }
      };
    } catch (e) {
      Logger.stacktrace('Failed to create FilePicker component', e);
    }

    /**
     * @param {string} name - name label of the setting
     * @param {string} note - help/note to show underneath or above the setting
     * @param {string} value - current hex color
     * @param {callable} onChange - callback to perform on setting change, callback receives hex string
     * @param {object} [options] - object of options to give to the setting
     * @param {boolean} [options.disabled=false] - should the setting be disabled
     * @param {Array<number>} [options.colors=presetColors] - preset list of colors
     * @author Zerebos, from his library ZLibrary
     */
    const FormItem = WebpackModules.getByDisplayName('FormItem');

    const ColorPickerComponent = (_ => {
      try {
        return null;
        return fakeRenderHook(() => {
          const GSRED = WebpackModules.getByDisplayName('GuildSettingsRolesEditDisplay');
          const ret = GSRED({ role: { id: '' }, guild: { id: '' } });
          const cpfi = Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'ColorPickerFormItem').type;
          const ret2 = cpfi({ role: { color: '' } });
          const ColorPicker = Utilities.findInReactTree(ret2, e => e && e.props && e.props.colors).type;
          return ColorPicker;
        });
      } catch (err) {
        Logger.stacktrace('Failed to get lazy colorpicker, unsurprisingly', err);
        return _ => null;
      }
    })();

    const ModalStuff = WebpackModules.getByProps('ModalRoot');

    class ColorPickerModal extends React.PureComponent {
      constructor(props) {
        super(props);
        this.state = { value: props.value };
        XenoLib._.bindAll(this, ['handleChange']);
      }
      handleChange(value) {
        this.setState({ value });
        this.props.onChange(ColorConverter.int2hex(value));
      }
      render() {
        return React.createElement(
          ModalStuff.ModalRoot,
          { tag: 'form', onSubmit: this.handleSubmit, size: '', transitionState: this.props.transitionState },
          React.createElement(
            ModalStuff.ModalContent,
            {},
            React.createElement(
              FormItem,
              { className: XenoLib.joinClassNames(DiscordClasses.Margins.marginTop20.value, DiscordClasses.Margins.marginBottom20.value) },
              React.createElement(ColorPickerComponent, {
                defaultColor: this.props.defaultColor,
                colors: [16711680, 16746496, 16763904, 13434624, 65314, 65484, 61183, 43775, 26367, 8913151, 16711918, 16711782, 11730944, 11755264, 11767552, 9417472, 45848, 45967, 42931, 30643, 18355, 6226099, 11731111, 11731015],
                value: this.state.value,
                onChange: this.handleChange
              })
            )
          )
        );
      }
    }
    const NewModalStack = BdApi.Webpack.getMangled(/\w=null!=\w\.modalKey\?\w\.modalKey:\w\(\)\(\)/, {
      openModalAsync: BdApi.Webpack.Filters.byRegex(/\w=null!=\w\.modalKey\?\w\.modalKey:\w\(\)\(\)/),
      openModal: BdApi.Webpack.Filters.byRegex(/Layer:\w,render:\w,onCloseRequest:null!=\w\?\w:\(\)=>\w\(\w,\w\),onCloseCallback:\w,/),
      closeModal: BdApi.Webpack.Filters.byRegex(/null!=\w&&null!=\w\.onCloseCallback&&\w\.onCloseCallback\(\)/),
      closeAllModals: BdApi.Webpack.Filters.byRegex(/getState\(\);for\(let \w in \w\)for\(let \w of \w\[\w\]\)\w\(\w\.key,\w\)/),
      hasModalOpen: BdApi.Webpack.Filters.byRegex(/return \w\(\w\.getState\(\),\w,\w\)/),
      modalStore: e => e.getState && e.setState && e.subscribe
    });

    XenoLib.ModalStack = NewModalStack;

    const ExtraButtonClassname = 'xenoLib-button';
    const TextClassname = 'xl-text-1SHFy0';
    const DropperIcon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16' }, React.createElement('path', { d: 'M14.994 1.006C13.858-.257 11.904-.3 10.72.89L8.637 2.975l-.696-.697-1.387 1.388 5.557 5.557 1.387-1.388-.697-.697 1.964-1.964c1.13-1.13 1.3-2.985.23-4.168zm-13.25 10.25c-.225.224-.408.48-.55.764L.02 14.37l1.39 1.39 2.35-1.174c.283-.14.54-.33.765-.55l4.808-4.808-2.776-2.776-4.813 4.803z', fill: 'currentColor' }));
    const ClockReverseIcon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24' }, React.createElement('path', { d: 'M13,3 C8.03,3 4,7.03 4,12 L1,12 L4.89,15.89 L4.96,16.03 L9,12 L6,12 C6,8.13 9.13,5 13,5 C16.87,5 20,8.13 20,12 C20,15.87 16.87,19 13,19 C11.07,19 9.32,18.21 8.06,16.94 L6.64,18.36 C8.27,19.99 10.51,21 13,21 C17.97,21 22,16.97 22,12 C22,7.03 17.97,3 13,3 L13,3 Z M12,8 L12,13 L16.28,15.54 L17,14.33 L13.5,12.25 L13.5,8 L12,8 L12,8 Z', fill: 'currentColor' }));
    class ColorPicker extends React.PureComponent {
      constructor(props) {
        super(props);
        this.state = {
          error: null,
          value: props.value,
          multiInputFocused: false
        };
        XenoLib._.bindAll(this, ['handleChange', 'handleColorPicker', 'handleReset']);
      }
      handleChange(value) {
        if (!value.length) this.state.error = 'You must input a hex string';
        else if (!ColorConverter.isValidHex(value)) this.state.error = 'Invalid hex string';
        else this.state.error = null;

        this.setState({ value });
        this.props.onChange(!value.length || !ColorConverter.isValidHex(value) ? this.props.defaultColor : value);
      }
      handleColorPicker() {
        const modalId = NewModalStack.openModal(e => React.createElement(XenoLib.ReactComponents.ErrorBoundary, { label: 'color picker modal', onError: () => NewModalStack.closeModal(modalId) }, React.createElement(ColorPickerModal, { ...e, defaultColor: ColorConverter.hex2int(this.props.defaultColor), value: ColorConverter.hex2int(this.props.value), onChange: this.handleChange })));
      }
      handleReset() {
        this.handleChange(this.props.defaultColor);
      }
      render() {
        const n = {};
        n['xenoLib-multiInput-focused'] = this.state.multiInputFocused;
        n[ErrorClassname] = !!this.state.error;
        return React.createElement(
          'div',
          { className: XenoLib.joinClassNames(DiscordClasses.BasicInputs.inputWrapper.value, 'xenoLib-color-picker'), style: { width: '100%' } },
          React.createElement(
            'div',
            { className: XenoLib.joinClassNames(MultiInputClassname, n) },
            React.createElement('div', {
              className: XenoLib.ReactComponents.Button.Sizes.SMALL,
              style: {
                backgroundColor: this.state.value,
                height: 38
              }
            }),
            React.createElement(DiscordModules.Textbox, {
              value: this.state.value,
              placeholder: 'Hex color',
              onChange: this.handleChange,
              onFocus: () => this.setState({ multiInputFocused: true }),
              onBlur: () => this.setState({ multiInputFocused: false }),
              autoFocus: false,
              className: MultiInputFirstClassname,
              inputClassName: MultiInputFieldClassname
            }),
            React.createElement(
              XenoLib.ReactComponents.Button,
              {
                onClick: this.handleColorPicker,
                color: (!!this.state.error && XenoLib.ReactComponents.ButtonOptions.ButtonColors.RED) || XenoLib.ReactComponents.ButtonOptions.ButtonColors.GREY,
                look: XenoLib.ReactComponents.ButtonOptions.ButtonLooks.GHOST,
                size: XenoLib.ReactComponents.Button.Sizes.MIN,
                className: ExtraButtonClassname
              },
              React.createElement('span', { className: TextClassname }, 'Color picker'),
              React.createElement(
                'span',
                {
                  className: 'xenoLib-button-icon'
                },
                DropperIcon
              )
            ),
            React.createElement(
              XenoLib.ReactComponents.Button,
              {
                onClick: this.handleReset,
                color: (!!this.state.error && XenoLib.ReactComponents.ButtonOptions.ButtonColors.RED) || XenoLib.ReactComponents.ButtonOptions.ButtonColors.GREY,
                look: XenoLib.ReactComponents.ButtonOptions.ButtonLooks.GHOST,
                size: XenoLib.ReactComponents.Button.Sizes.MIN,
                className: ExtraButtonClassname
              },
              React.createElement('span', { className: TextClassname }, 'Reset'),
              React.createElement(
                'span',
                {
                  className: 'xenoLib-button-icon xenoLib-revert'
                },
                ClockReverseIcon
              )
            )
          ),
          !!this.state.error && React.createElement('div', { className: ErrorMessageClassname, style: { color: 'hsl(359,calc(var(--saturation-factor, 1)*82.6%),59.4%)' } }, 'Error: ', this.state.error)
        );
      }
    }
    XenoLib.Settings = {};
    XenoLib.Settings.FilePicker = class FilePickerSettingField extends Settings.SettingField {
      constructor(name, note, value, onChange, options = { properties: ['openDirectory', 'createDirectory'], placeholder: 'Path to folder', defaultPath: '' }) {
        super(name, note, onChange, XenoLib.ReactComponents.FilePicker || class b { }, {
          onChange: reactElement => path => {
            this.onChange(path ? path : options.defaultPath);
          },
          path: value,
          nullOnInvalid: true,
          ...options
        });
      }
    };
    XenoLib.Settings.ColorPicker = class ColorPickerSettingField extends Settings.SettingField {
      constructor(name, note, value, onChange, options = {}) {
        super(name, note, onChange, ColorPicker, {
          disabled: !!options.disabled,
          onChange: reactElement => color => {
            this.onChange(color);
          },
          defaultColor: typeof options.defaultColor !== 'undefined' ? options.defaultColor : ColorConverter.int2hex(DiscordConstants.DEFAULT_ROLE_COLOR),
          value
        });
      }
    };

    XenoLib.Settings.PluginFooter = class PluginFooterField extends Settings.SettingField {
      constructor(showChangelog) {
        super('', '', NOOP, XenoLib.ReactComponents.PluginFooter, {
          showChangelog
        });
      }
    };

    XenoLib.changeName = (currentName, newName) => {
      try {
        const path = require('path');
        const fs = require('fs');
        const pluginsFolder = path.dirname(currentName);
        const pluginName = path.basename(currentName).match(/^[^\.]+/)[0];
        if (pluginName === newName) return true;
        const wasEnabled = BdApi.Plugins && BdApi.Plugins.isEnabled ? BdApi.Plugins.isEnabled(pluginName) : global.pluginCookie && pluginCookie[pluginName];
        fs.accessSync(currentName, fs.constants.W_OK | fs.constants.R_OK);
        const files = fs.readdirSync(pluginsFolder);
        files.forEach(file => {
          if (!file.startsWith(pluginName) || file.startsWith(newName) || file.indexOf('.plugin.js') !== -1) return;
          fs.renameSync(path.resolve(pluginsFolder, file), path.resolve(pluginsFolder, `${newName}${file.match(new RegExp(`^${pluginName}(.*)`))[1]}`));
        });
        fs.renameSync(currentName, path.resolve(pluginsFolder, `${newName}.plugin.js`));
        XenoLib.Notifications.success(`[**XenoLib**] \`${pluginName}\` file has been renamed to \`${newName}\``);
        if ((!BdApi.Plugins || !BdApi.Plugins.isEnabled || !BdApi.Plugins.enable) && (!global.pluginCookie || !global.pluginModule)) BdApi.showConfirmationModal('Plugin has been renamed', 'Plugin has been renamed, but your client mod has a missing feature, as such, the plugin could not be enabled (if it even was enabled).');
        else {
          if (!wasEnabled) return;
          setTimeout(() => (BdApi.Plugins && BdApi.Plugins.enable ? BdApi.Plugins.enable(newName) : pluginModule.enablePlugin(newName)), 1000); /* /shrug */
        }
      } catch (e) {
        Logger.stacktrace('There has been an issue renaming a plugin', e);
      }
    };

    const FancyParser = (() => {
      const Markdown = WebpackModules.getByProps('astParserFor', 'parse');
      try {
        const MentionRule = WebpackModules.find(e => e.react && e.react.toString().includes('className:"mention"'));
        const ReactParserRules = WebpackModules.find(m => typeof m === 'function' && (m = m.toString()) && (m.toString().replace(/\n/g, '').search(/^function \w\(\w\){return{\.\.\.\w,link:\(0,\w.\w\)\(\w\)/) !== -1));
        const { RULES } = WebpackModules.getByProps('RULES');

        function mergeRules(rules) {
          let mergedRules = {};
          for (let ruleSet of rules) {
            for (let ruleName in ruleSet) {
              if (ruleName in mergedRules) {
                mergedRules[ruleName] = {
                  ...mergedRules[ruleName],
                  ...ruleSet[ruleName]
                };
              } else {
                mergedRules[ruleName] = {
                  ...ruleSet[ruleName]
                };
              }
            }
          }
          return mergedRules;
        }
        const FANCY_PANTS_PARSER_RULES = mergeRules([RULES, ReactParserRules({ enableBuildOverrides: true }), { mention: MentionRule }]);
        const { defaultRules } = WebpackModules.getByProps('defaultParse');
        FANCY_PANTS_PARSER_RULES.image = defaultRules.image;
        FANCY_PANTS_PARSER_RULES.link = defaultRules.link;
        return Markdown.reactParserFor(FANCY_PANTS_PARSER_RULES);
      } catch (e) {
        Logger.stacktrace('Failed to create special parser', e);
        try {
          return Markdown.parse;
        } catch (e) {
          Logger.stacktrace('Failed to get even basic parser', e);
          return e => e;
        }
      }
    })();

    const AnchorClasses = WebpackModules.getByProps('anchor', 'anchorUnderlineOnHover') || {};
    const EmbedVideo = (() => {
      return NOOP_NULL;
      try {
        return WebpackModules.getByProps('EmbedVideo').EmbedVideo;
      } catch (e) {
        Logger.stacktrace('Failed to get EmbedVideo!', e);
        return NOOP_NULL;
      }
    })();
    const VideoComponent = (() => {
      return NOOP_NULL;
      try {
        const ret = new (WebpackModules.getByDisplayName('MediaPlayer'))({}).render();
        const vc = Utilities.findInReactTree(ret, e => e && e.props && typeof e.props.className === 'string' && e.props.className.indexOf('video-2HW4jD') !== -1);
        return vc.type;
      } catch (e) {
        Logger.stacktrace('Failed to get the video component', e);
        return NOOP_NULL;
      }
    })();
    const ComponentRenderers = WebpackModules.getByProps('renderVideoComponent') || {};
    const Heading = (() => Object.values(WebpackModules.getModule(e => {
      const possFuncs = Object.values(e);
      if (possFuncs.length !== 1) return false;
      return possFuncs[0]?.render?.toString().match(/case"currentColor":\w="currentColor";break;case"none":\w=void 0;break;case"always-white":\w="white";/);
    }))[0])() || 'span';
    /* MY CHANGELOG >:C */
    XenoLib.showChangelog = (title, version, changelog, footer, showDisclaimer) => {
      try {
        let modalId = null;
        const renderFooter = () => [
          React.createElement(TextElement || 'span',
            {
              size: TextElement?.Sizes?.SIZE_12,
              variant: 'text-xs/normal'
            }, 'Need support? ',
            React.createElement('a', {
              className: XenoLib.joinClassNames(AnchorClasses.anchor, AnchorClasses.anchorUnderlineOnHover),
              onClick: () => BdApi.UI.showInviteModal('NYvWdN5')
            },
              'Join my support server'
            ),
            '! Or consider donating via ',
            React.createElement('a', {
              className: XenoLib.joinClassNames(AnchorClasses.anchor, AnchorClasses.anchorUnderlineOnHover),
              onClick: () => window.open('https://paypal.me/lighty13')
            },
              'Paypal'
            ),
            ', ',
            React.createElement('a', {
              className: XenoLib.joinClassNames(AnchorClasses.anchor, AnchorClasses.anchorUnderlineOnHover),
              onClick: () => window.open('https://ko-fi.com/lighty_')
            },
              'Ko-fi'
            ),
            ', ',
            React.createElement('a', {
              className: XenoLib.joinClassNames(AnchorClasses.anchor, AnchorClasses.anchorUnderlineOnHover),
              onClick: () => window.open('https://www.patreon.com/lightyp')
            },
              'Patreon'
            ),
            '!',
            showDisclaimer ? '\nBy using these plugins, you agree to being part of the anonymous user counter, unless disabled in settings.' : ''
          )
        ];
        modalId = BdApi.UI.showChangelogModal({
          title,
          subtitle: `Version ${version}`,
          footer: footer || renderFooter(),
          changes: changelog
        });
        return;

        const ChangelogClasses = DiscordClasses.Changelog;
        const items = [];
        let isFistType = true;
        for (let i = 0; i < changelog.length; i++) {
          const item = changelog[i];
          switch (item.type) {
            case 'image':
              items.push(React.createElement('img', { alt: '', src: item.src, width: item.width || 451, height: item.height || 254 }));
              continue;
            case 'video':
              items.push(React.createElement(VideoComponent, { src: item.src, poster: item.thumbnail, width: item.width || 451, height: item.height || 254, loop: item.loop || !0, muted: item.muted || !0, autoPlay: item.autoplay || !0, className: ChangelogClasses.video }));
              continue;
            case 'youtube':
              items.push(React.createElement(EmbedVideo, { className: ChangelogClasses.video, allowFullScreen: !1, href: `https://youtu.be/${item.youtube_id}`, thumbnail: { url: `https://i.ytimg.com/vi/${item.youtube_id}/maxresdefault.jpg`, width: item.width || 451, height: item.height || 254 }, video: { url: `https://www.youtube.com/embed/${item.youtube_id}?vq=large&rel=0&controls=0&showinfo=0`, width: item.width || 451, height: item.height || 254 }, width: item.width || 451, height: item.height || 254, renderVideoComponent: ComponentRenderers.renderVideoComponent || NOOP_NULL, renderImageComponent: ComponentRenderers.renderImageComponent || NOOP_NULL, renderLinkComponent: ComponentRenderers.renderMaskedLinkComponent || NOOP_NULL }));
              continue;
            case 'description':
              items.push(React.createElement('p', {}, FancyParser(item.content)));
              continue;
            default:
              const logType = ChangelogClasses[item.type] || ChangelogClasses.added;
              items.push(React.createElement('h1', { className: XenoLib.joinClassNames(logType.value, { [ChangelogClasses.marginTop.value]: item.marginTop || isFistType }) }, item.title));
              items.push(React.createElement(
                'ul',
                { className: 'XL-chl-p' },
                item.items.map(e =>
                  React.createElement(
                    'li',
                    {},
                    React.createElement(
                      'p',
                      {},
                      Array.isArray(e)
                        ? e.map(e =>
                        (Array.isArray(e)
                          ? React.createElement(
                            'ul',
                            {},
                            e.map(e => React.createElement('li', {}, FancyParser(e)))
                          )
                          : FancyParser(e)))
                        : FancyParser(e)
                    )
                  ))
              ));
              isFistType = false;
          }
        }
        NewModalStack.openModal(props =>
          React.createElement(XenoLib.ReactComponents.ErrorBoundary,
            {
              label: 'Changelog',
              onError: () => props.onClose()
            },
            React.createElement(/* ChangelogModal */ WebpackModules.getByProps('ConfirmModal')?.ConfirmModal || (() => null),
              {
                className: WebpackModules.getModule(e => e?.content && e.modal && (Object.keys(e).length === 2))?.content || '',
                selectable: true,
                onScroll: _ => _,
                onClose: _ => _,
                ...props
              },
              React.createElement(FlexChild?.Child || 'div',
                {
                  grow: 1,
                  shrink: 1
                },
                React.createElement(Heading,
                  {
                    variant: 'heading-lg/semibold'
                  },
                  title),
                React.createElement(TextElement || 'span',
                  {
                    size: TextElement?.Sizes?.SIZE_12,
                    variant: 'text-xs/normal',
                    className: ChangelogClasses.date
                  },
                  `Version ${version}`
                )
              ),
              items,
              React.createElement(FlexChild?.Child || 'div',
                {
                  gro: 1,
                  shrink: 1
                }, React.createElement(TextElement || 'span',
                  {
                    size: TextElement?.Sizes?.SIZE_12,
                    variant: 'text-xs/normal'
                  },
                  footer ? (typeof footer === 'string' ? FancyParser(footer) : footer) : renderFooter()
                )
              )
            )));
      } catch (err) {
        Logger.stacktrace('Failed to show changelog', err);
      }
    };

    /* https://github.com/react-spring/zustand
     * MIT License
     *
     * Copyright (c) 2019 Paul Henschel
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all
     * copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
     * SOFTWARE.
     */
    XenoLib.zustand = createState => {
      let state;
      const listeners = new Set();
      const setState = partial => {
        const partialState = typeof partial === 'function' ? partial(state) : partial;
        if (partialState !== state) {
          state = { ...state, ...partialState };
          listeners.forEach(listener => listener());
        }
      };
      const getState = () => state;
      const getSubscriber = (listener, selector, equalityFn) => {
        if (selector === void 0) selector = getState;
        if (equalityFn === void 0) equalityFn = Object.is;
        return { currentSlice: selector(state), equalityFn, errored: false, listener, selector, unsubscribe: function unsubscribe() { } };
      };
      const subscribe = function subscribe(subscriber) {
        function listener() {
          // Selector or equality function could throw but we don't want to stop
          // the listener from being called.
          // https://github.com/react-spring/zustand/pull/37
          try {
            const newStateSlice = subscriber.selector(state);
            if (!subscriber.equalityFn(subscriber.currentSlice, newStateSlice)) subscriber.listener((subscriber.currentSlice = newStateSlice));
          } catch (error) {
            subscriber.errored = true;
            subscriber.listener(null, error);
          }
        }

        listeners.add(listener);
        return () => listeners.delete(listener);
      };
      const apiSubscribe = (listener, selector, equalityFn) => subscribe(getSubscriber(listener, selector, equalityFn));
      const destroy = () => listeners.clear();
      const useStore = (selector, equalityFn) => {
        if (selector === void 0) selector = getState;
        if (equalityFn === void 0) equalityFn = Object.is;
        const forceUpdate = React.useReducer(c => c + 1, 0)[1];
        const subscriberRef = React.useRef();
        if (!subscriberRef.current) {
          subscriberRef.current = getSubscriber(forceUpdate, selector, equalityFn);
          subscriberRef.current.unsubscribe = subscribe(subscriberRef.current);
        }
        const subscriber = subscriberRef.current;
        let newStateSlice;
        let hasNewStateSlice = false; // The selector or equalityFn need to be called during the render phase if
        // they change. We also want legitimate errors to be visible so we re-run
        // them if they errored in the subscriber.
        if (subscriber.selector !== selector || subscriber.equalityFn !== equalityFn || subscriber.errored) {
          // Using local variables to avoid mutations in the render phase.
          newStateSlice = selector(state);
          hasNewStateSlice = !equalityFn(subscriber.currentSlice, newStateSlice);
        } // Syncing changes in useEffect.
        React.useLayoutEffect(() => {
          if (hasNewStateSlice) subscriber.currentSlice = newStateSlice;
          subscriber.selector = selector;
          subscriber.equalityFn = equalityFn;
          subscriber.errored = false;
        });
        React.useLayoutEffect(() => subscriber.unsubscribe, []);
        return hasNewStateSlice ? newStateSlice : subscriber.currentSlice;
      };
      const api = { setState, getState, subscribe: apiSubscribe, destroy };
      state = createState(setState, getState, api);
      return [useStore, api];
    };
    /* NOTIFICATIONS START */
    let UPDATEKEY = {};
    const notificationEvents = canUseAstraNotifAPI ? null : new (require('events').EventEmitter)();
    if (!canUseAstraNotifAPI) notificationEvents.dispatch = data => notificationEvents.emit(data.type, data);
    try {
      if (canUseAstraNotifAPI) {
        const defaultOptions = {
          loading: false,
          progress: -1,
          channelId: undefined,
          timeout: 3500,
          color: '#2196f3',
          onLeave: NOOP
        };
        const utils = {
          success(content, options = {}) {
            return this.show(content, { color: '#43b581', ...options });
          },
          info(content, options = {}) {
            return this.show(content, { color: '#4a90e2', ...options });
          },
          warning(content, options = {}) {
            return this.show(content, { color: '#ffa600', ...options });
          },
          danger(content, options = {}) {
            return this.show(content, { color: '#f04747', ...options });
          },
          error(content, options = {}) {
            return this.danger(content, options);
          },
          /**
           * @param {string|HTMLElement|React} content - Content to display. If it's a string, it'll be formatted with markdown, including URL support [like this](https://google.com/)
           * @param {object} options
           * @param {string} [options.channelId] Channel ID if content is a string which gets formatted, and you want to mention a role for example.
           * @param {Number} [options.timeout] Set to 0 to keep it permanently until user closes it, or if you want a progress bar
           * @param {Boolean} [options.loading] Makes the bar animate differently instead of fading in and out slowly
           * @param {Number} [options.progress] 0-100, -1 sets it to 100%, setting it to 100% closes the notification automatically
           * @param {string} [options.color] Bar color
           * @param {string} [options.allowDuplicates] By default, notifications that are similar get grouped together, use true to disable that
           * @param {function} [options.onLeave] Callback when notification is leaving
           * @return {Number} - Notification ID. Store this if you plan on force closing it, changing its content or want to set the progress
           */
          show(content, options = {}) {
            const { timeout, loading, progress, color, allowDuplicates, onLeave, channelId, onClick, onContext, onMiddleClick } = Object.assign(Utilities.deepclone(defaultOptions), options);
            return Astra.n11s.show(content instanceof HTMLElement ? ReactTools.createWrappedElement(content) : content, {
              timeout,
              loading,
              progress,
              color,
              allowDuplicates,
              onClick,
              onContext,
              onMiddleClick,
              onClose: onLeave,
              markdownOptions: { channelId }
            });
          },
          remove(id) {
            Astra.n11s.remove(id);
          },
          /**
           * @param {Number} id Notification ID
           * @param {object} options
           * @param {string} [options.channelId] Channel ID if content is a string which gets formatted, and you want to mention a role for example.
           * @param {Boolean} [options.loading] Makes the bar animate differently instead of fading in and out slowly
           * @param {Number} [options.progress] 0-100, -1 sets it to 100%, setting it to 100% closes the notification automatically
           * @param {string} [options.color] Bar color
           * @param {function} [options.onLeave] Callback when notification is leaving
           */
          update(id, options) {
            const obj = {};
            for (const key of ['content', 'timeout', 'loading', 'progress', 'color', 'onClick', 'onContext', 'onMiddleClick']) if (typeof options[key] !== 'undefined') obj[key] = options[key];
            if (options.onLeave) obj.onClose = options.onLeave;
            if (options.channelId) obj.markdownOptions = { channelId: options.channelId };
            Astra.n11s.update(id, obj);
          },
          exists(id) {
            return Astra.n11s.exists(id);
          }
        };
        XenoLib.Notifications = utils;
      } else {
        const DeepEqualityCheck = (content1, content2) => {
          if (typeof content1 !== typeof content2) return false;
          const isCNT1HTML = content1 instanceof HTMLElement;
          const isCNT2HTML = content2 instanceof HTMLElement;
          if (isCNT1HTML !== isCNT2HTML) return false;
          else if (isCNT1HTML) return content1.isEqualNode(content2);
          if (content1 !== content2) if (Array.isArray(content1)) {
            if (content1.length !== content2.length) return false;
            for (const [index, item] of content1.entries()) if (!DeepEqualityCheck(item, content2[index])) return false;

          } else if (typeof content1 === 'object') {
            if (content1.type) {
              if (typeof content1.type !== typeof content2.type) return false;
              if (content1.type !== content2.type) return false;
            }
            if (typeof content1.props !== typeof content2.props) return false;
            if (content1.props) {
              if (Object.keys(content1.props).length !== Object.keys(content2.props).length) return false;
              for (const prop in content1.props) if (!DeepEqualityCheck(content1.props[prop], content2.props[prop])) return false;

            }
          } else return false;

          return true;
        };
        const [useStore, api] = XenoLib.zustand(e => ({ data: [] }));
        const defaultOptions = {
          loading: false,
          progress: -1,
          channelId: undefined,
          timeout: 3500,
          color: '#2196f3',
          onLeave: NOOP
        };
        const utils = {
          success(content, options = {}) {
            return this.show(content, { color: '#43b581', ...options });
          },
          info(content, options = {}) {
            return this.show(content, { color: '#4a90e2', ...options });
          },
          warning(content, options = {}) {
            return this.show(content, { color: '#ffa600', ...options });
          },
          danger(content, options = {}) {
            return this.show(content, { color: '#f04747', ...options });
          },
          error(content, options = {}) {
            return this.danger(content, options);
          },
          /**
           * @param {string|HTMLElement|React} content - Content to display. If it's a string, it'll be formatted with markdown, including URL support [like this](https://google.com/)
           * @param {object} options
           * @param {string} [options.channelId] Channel ID if content is a string which gets formatted, and you want to mention a role for example.
           * @param {Number} [options.timeout] Set to 0 to keep it permanently until user closes it, or if you want a progress bar
           * @param {Boolean} [options.loading] Makes the bar animate differently instead of fading in and out slowly
           * @param {Number} [options.progress] 0-100, -1 sets it to 100%, setting it to 100% closes the notification automatically
           * @param {string} [options.color] Bar color
           * @param {string} [options.allowDuplicates] By default, notifications that are similar get grouped together, use true to disable that
           * @param {function} [options.onLeave] Callback when notification is leaving
           * @return {Number} - Notification ID. Store this if you plan on force closing it, changing its content or want to set the progress
           */
          show(content, options = {}) {
            let id = null;
            options = Object.assign(Utilities.deepclone(defaultOptions), options);
            api.setState(state => {
              if (!options.allowDuplicates) {
                const notif = state.data.find(n => DeepEqualityCheck(n.content, content) && n.timeout === options.timeout && !n.leaving);
                if (notif) {
                  id = notif.id;
                  notificationEvents.dispatch({ type: 'XL_NOTIFS_DUPLICATE', id: notif.id });
                  return state;
                }
              }
              if (state.data.length >= 100) return state;
              do id = Math.floor(4294967296 * Math.random());
              while (state.data.findIndex(n => n.id === id) !== -1);
              return { data: [].concat(state.data, [{ content, ...options, id }]) };
            });
            return id;
          },
          remove(id) {
            notificationEvents.dispatch({ type: 'XL_NOTIFS_REMOVE', id });
          },
          /**
           * @param {Number} id Notification ID
           * @param {object} options
           * @param {string} [options.channelId] Channel ID if content is a string which gets formatted, and you want to mention a role for example.
           * @param {Boolean} [options.loading] Makes the bar animate differently instead of fading in and out slowly
           * @param {Number} [options.progress] 0-100, -1 sets it to 100%, setting it to 100% closes the notification automatically
           * @param {string} [options.color] Bar color
           * @param {function} [options.onLeave] Callback when notification is leaving
           */
          update(id, options) {
            delete options.id;
            api.setState(state => {
              const idx = state.data.findIndex(n => n.id === id);
              if (idx === -1) return state;
              state.data[idx] = Object.assign(state.data[idx], options);
              return state;
            });
            notificationEvents.dispatch({ type: 'XL_NOTIFS_UPDATE', id, ...options });
          },
          exists(id) {
            return api.getState().data.findIndex(e => e.id === id && !e.leaving) !== -1;
          }
        };
        XenoLib.Notifications = utils;
        const ReactSpring = WebpackModules.getByProps('useTransition', 'animated');

        function hex2int(hex) {
          return parseInt(hex, 16);
        }

        function int2rgba(int, alpha) {
          const r = int >> 16 & 255;
          const g = int >> 8 & 255;
          const b = int & 255;
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        const NumberBadge = (() => {
          let ret = null;
          ZeresPluginLibrary.WebpackModules.getModule(e => {
            for (const val of Object.values(e)) {
              if (typeof val !== 'function') continue;
              try {
                const cont = val.toString();
                if (!cont.includes('.STATUS_DANGER') || !cont.includes('.numberBadge')) continue;
              } catch (err) {
                console.log(err, val);
                continue;
              }
              ret = val;
              return true;
            }
            return false;
          });
          return ret;
        })();
        const CloseButton = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24' }, React.createElement('path', { d: 'M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z', fill: 'currentColor' }));
        class Notification extends React.PureComponent {
          constructor(props) {
            super(props);
            this.state = {
              closeFast: false /* close button pressed, XL_NOTIFS_REMOVE dispatch */,
              offscreen: false /* don't do anything special if offscreen, not timeout */,
              counter: 1 /* how many times this notification was shown */,
              resetBar: false /* reset bar to 0 in the event counter goes up */,
              hovered: false,
              leaving: true /* prevent hover events from messing up things */,
              loading: props.loading /* loading animation, enable progress */,
              progress: props.progress /* -1 means undetermined */,
              content: props.content,
              contentParsed: this.parseContent(props.content, props.channelId),
              color: props.color
            };
            this._contentRef = null;
            this._ref = null;
            this._animationCancel = NOOP;
            this._oldOffsetHeight = 0;
            this._initialProgress = !this.props.timeout ? (this.state.loading && this.state.progress !== -1 ? this.state.progress : 100) : 0;
            XenoLib._.bindAll(this, ['closeNow', 'handleDispatch', '_setContentRef', 'onMouseEnter', 'onMouseLeave']);
            this.handleResizeEvent = XenoLib._.throttle(this.handleResizeEvent.bind(this), 100);
            this.resizeObserver = new ResizeObserver(this.handleResizeEvent);
            this._timeout = props.timeout;
          }
          componentDidMount() {
            this._unsubscribe = api.subscribe(_ => this.checkOffScreen());
            window.addEventListener('resize', this.handleResizeEvent);
            notificationEvents.on('XL_NOTIFS_DUPLICATE', this.handleDispatch);
            notificationEvents.on('XL_NOTIFS_REMOVE', this.handleDispatch);
            notificationEvents.on('XL_NOTIFS_UPDATE', this.handleDispatch);
            notificationEvents.on('XL_NOTIFS_ANIMATED', this.handleDispatch);
            notificationEvents.on('XL_NOTIFS_SETTINGS_UPDATE', this.handleDispatch);
          }
          componentWillUnmount() {
            this._unsubscribe();
            window.window.removeEventListener('resize', this.handleResizeEvent);
            notificationEvents.off('XL_NOTIFS_DUPLICATE', this.handleDispatch);
            notificationEvents.off('XL_NOTIFS_REMOVE', this.handleDispatch);
            notificationEvents.off('XL_NOTIFS_UPDATE', this.handleDispatch);
            notificationEvents.off('XL_NOTIFS_ANIMATED', this.handleDispatch);
            notificationEvents.off('XL_NOTIFS_SETTINGS_UPDATE', this.handleDispatch);
            this.resizeObserver.disconnect();
            this.resizeObserver = null; /* no mem leaks plz */
            this._ref = null;
            this._contentRef = null;
          }
          handleDispatch(e) {
            if (this.state.leaving || this.state.closeFast) return;
            if (e.type === 'XL_NOTIFS_SETTINGS_UPDATE') {
              if (e.key !== UPDATEKEY) return;
              this._animationCancel();
              this.forceUpdate();
              return;
            }
            if (e.type === 'XL_NOTIFS_ANIMATED') this.checkOffScreen();
            if (e.id !== this.props.id) return;
            const { content, channelId, loading, progress, color } = e;
            const { content: curContent, channelId: curChannelId, loading: curLoading, progress: curProgress, color: curColor } = this.state;
            switch (e.type) {
              case 'XL_NOTIFS_REMOVE':
                this.closeNow();
                break;
              case 'XL_NOTIFS_DUPLICATE':
                this._animationCancel();
                this.setState({ counter: this.state.counter + 1, resetBar: !!this.props.timeout, closeFast: false });
                break;
              case 'XL_NOTIFS_UPDATE':
                /* if (!this.state.initialAnimDone) {
                  this.state.content = content || curContent;
                  this.state.channelId = channelId || curChannelId;
                  this.state.contentParsed = this.parseContent(content || curContent, channelId || curChannelId);
                  if (typeof loading !== 'undefined') this.state.loading = loading;
                  if (typeof progress !== 'undefined') this.state.progress = progress;
                  this.state.color = color || curColor;
                  return;
                }*/
                if (this.state.initialAnimDone) this._animationCancel();
                this.setState({
                  content: content || curContent,
                  channelId: channelId || curChannelId,
                  contentParsed: this.parseContent(content || curContent, channelId || curChannelId),
                  loading: typeof loading !== 'undefined' ? loading : curLoading,
                  progress: typeof progress !== 'undefined' ? progress : curProgress,
                  color: color || curColor
                });
                break;
            }
          }
          parseContent(content, channelId) {
            if (typeof content === 'string') return FancyParser(content, true, { channelId });
            else if (content instanceof Element) return ReactTools.createWrappedElement(content);
            return content;
          }
          checkOffScreen() {
            if (this.state.leaving || !this._contentRef) return;
            const bcr = this._contentRef.getBoundingClientRect();
            if (Math.floor(bcr.bottom) - 1 > Structs.Screen.height || Math.ceil(bcr.top) + 1 < 0) {
              if (!this.state.offscreen) {
                this._animationCancel();
                this.setState({ offscreen: true });
              }
            } else if (this.state.offscreen) {
              this._animationCancel();
              this.setState({ offscreen: false });
            }
          }
          closeNow() {
            if (this.state.closeFast) return;
            this.resizeObserver.disconnect();
            this._animationCancel();
            api.setState(state => {
              const dt = state.data.find(m => m.id === this.props.id);
              if (dt) dt.leaving = true;
              return { data: state.data };
            });
            this.setState({ closeFast: true });
          }
          handleResizeEvent() {
            if (this._oldOffsetHeight !== this._contentRef.offsetHeight) {
              this._animationCancel();
              this.forceUpdate();
            }
          }
          _setContentRef(ref) {
            if (this._contentRef) {
              this._contentRef.removeEventListener('mouseenter', this.onMouseEnter);
              this._contentRef.removeEventListener('mouseleave', this.onMouseLeave);
            }
            if (!ref) return;
            ref.addEventListener('mouseenter', this.onMouseEnter);
            ref.addEventListener('mouseleave', this.onMouseLeave);
            this._contentRef = ref;
            this.resizeObserver.observe(ref);
          }
          onMouseEnter(e) {
            if (this.state.leaving || !this.props.timeout || this.state.closeFast) return;
            this._animationCancel();
            if (this._startProgressing) this._timeout -= Date.now() - this._startProgressing;
            this.setState({ hovered: true });
          }
          onMouseLeave(e) {
            if (this.state.leaving || !this.props.timeout || this.state.closeFast) return;
            this._animationCancel();
            this.setState({ hovered: false });
          }
          render() {
            const config = { duration: 200 };
            if (this._contentRef) this._oldOffsetHeight = this._contentRef.offsetHeight;
            return React.createElement(
              ReactSpring.Spring,
              {
                native: true,
                from: { opacity: 0, height: 0, progress: this._initialProgress, loadbrightness: 1 },
                to: async (next, cancel) => {
                  this.state.leaving = false;
                  this._animationCancel = cancel;
                  if (this.state.offscreen) {
                    if (this.state.closeFast) {
                      this.state.leaving = true;
                      await next({ opacity: 0, height: 0 });
                      api.setState(state => ({ data: state.data.filter(n => n.id !== this.props.id) }));
                      return;
                    }
                    await next({ opacity: 1, height: this._contentRef.offsetHeight, loadbrightness: 1 });
                    if (this.props.timeout) await next({ progress: 0 });
                    else
                      if (this.state.loading && this.state.progress !== -1) await next({ progress: 0 });
                      else await next({ progress: 100 });


                    return;
                  }
                  const isSettingHeight = this._ref.offsetHeight !== this._contentRef.offsetHeight;
                  await next({ opacity: 1, height: this._contentRef.offsetHeight });
                  if (isSettingHeight) notificationEvents.dispatch({ type: 'XL_NOTIFS_ANIMATED' });
                  this.state.initialAnimDone = true;
                  if (this.state.resetBar || (this.state.hovered && LibrarySettings.notifications.timeoutReset)) {
                    await next({ progress: 0 }); /* shit gets reset */
                    this.state.resetBar = false;
                  }

                  if (!this.props.timeout && !this.state.closeFast) {
                    if (!this.state.loading) await next({ progress: 100 });
                    else {
                      await next({ loadbrightness: 1 });
                      if (this.state.progress === -1) await next({ progress: 100 });
                      else await next({ progress: this.state.progress });
                    }
                    if (this.state.progress < 100 || !this.state.loading) return;
                  }
                  if (this.state.hovered && !this.state.closeFast) return;
                  if (!this.state.closeFast && !LibrarySettings.notifications.timeoutReset) this._startProgressing = Date.now();
                  await next({ progress: 100 });
                  if (this.state.hovered && !this.state.closeFast) return; /* race condition: notif is hovered, but it continues and closes! */
                  this.state.leaving = true;
                  if (!this.state.closeFast) api.setState(state => {
                    const dt = state.data.find(m => m.id === this.props.id);
                    if (dt) dt.leaving = true;
                    return { data: state.data };
                  });

                  this.props.onLeave();
                  await next({ opacity: 0, height: 0 });
                  api.setState(state => ({ data: state.data.filter(n => n.id !== this.props.id) }));
                },
                config: key => {
                  if (key === 'progress') {
                    let duration = this._timeout;
                    if (this.state.closeFast || !this.props.timeout || this.state.resetBar || this.state.hovered) duration = 150;
                    if (this.state.offscreen) duration = 0; /* don't animate at all */
                    return { duration };
                  }
                  if (key === 'loadbrightness') return { duration: 750 };
                  return config;
                }
              },
              e => React.createElement(
                ReactSpring.animated.div,
                {
                  style: {
                    height: e.height,
                    opacity: e.opacity
                  },
                  className: 'xenoLib-notification',
                  ref: e => e && (this._ref = e)
                },
                React.createElement(
                  'div',
                  {
                    className: 'xenoLib-notification-content-wrapper',
                    ref: this._setContentRef,
                    style: {
                      '--grad-one': this.state.color,
                      '--grad-two': ColorConverter.lightenColor(this.state.color, 20),
                      '--bar-color': ColorConverter.darkenColor(this.state.color, 30)
                    },
                    onClick: e => {
                      if (!this.props.onClick) return;
                      if (e.target && e.target.getAttribute('role') === 'button') return;
                      this.props.onClick(e);
                      this.closeNow();
                    },
                    onContextMenu: e => {
                      if (!this.props.onContext) return;
                      this.props.onContext(e);
                      this.closeNow();
                    },
                    onMouseUp: e => {
                      if (!this.props.onMiddleClick || e.button !== 1) return;
                      if (e.target && e.target.getAttribute('role') === 'button') return;
                      this.props.onMiddleClick(e);
                      this.closeNow();
                    }
                  },
                  React.createElement(
                    'div',
                    {
                      className: 'xenoLib-notification-content',
                      style: {
                        backdropFilter: LibrarySettings.notifications.backdrop ? 'blur(5px)' : undefined,
                        background: int2rgba(hex2int(LibrarySettings.notifications.backdropColor), LibrarySettings.notifications.backdrop ? 0.3 : 1.0),
                        border: LibrarySettings.notifications.backdrop ? 'none' : undefined
                      },
                      ref: e => {
                        if (!LibrarySettings.notifications.backdrop || !e) return;
                        e.style.setProperty('backdrop-filter', e.style.backdropFilter, 'important');
                        e.style.setProperty('background', e.style.background, 'important');
                        e.style.setProperty('border', e.style.border, 'important');
                      }
                    },
                    React.createElement(ReactSpring.animated.div, {
                      className: XenoLib.joinClassNames('xenoLib-notification-loadbar', { 'xenoLib-notification-loadbar-striped': !this.props.timeout && this.state.loading, 'xenoLib-notification-loadbar-user': !this.props.timeout && !this.state.loading }),
                      style: { right: e.progress.to(e => `${100 - e}%`), filter: e.loadbrightness.to(e => `brightness(${e * 100}%)`) }
                    }),
                    React.createElement(
                      XenoLib.ReactComponents.Button,
                      {
                        look: XenoLib.ReactComponents.Button.Looks.BLANK,
                        size: XenoLib.ReactComponents.Button.Sizes.NONE,
                        onClick: e => {
                          e.preventDefault();
                          e.stopPropagation();
                          this.closeNow();
                        },
                        onContextMenu: e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const state = api.getState();
                          state.data.forEach(notif => utils.remove(notif.id));
                        },
                        className: 'xenoLib-notification-close'
                      },
                      CloseButton
                    ),
                    this.state.counter > 1 && NumberBadge({ count: this.state.counter, className: 'xenLib-notification-counter', color: '#2196f3' }),
                    this.state.contentParsed
                  )
                )
              )
            );
          }
        }
        function NotificationsWrapper(e) {
          const notifications = useStore(e => e.data);
          return notifications.map(item => React.createElement(XenoLib.ReactComponents.ErrorBoundary, { label: `Notification ${item.id}`, onError: () => api.setState(state => ({ data: state.data.filter(n => n.id !== item.id) })), key: item.id.toString() }, React.createElement(Notification, { ...item, leaving: false }))).reverse();
        }
        NotificationsWrapper.displayName = 'XenoLibNotifications';
        const DOMElement = document.createElement('div');
        document.querySelector('#app-mount').appendChild(DOMElement); // fucking incompetent powercord needs me to append it first
        DOMElement.className = XenoLib.joinClassNames('xenoLib-notifications', `xenoLib-centering-${LibrarySettings.notifications.position}`);
        const root = ReactDOM.createRoot(DOMElement);
        root.render(React.createElement(NotificationsWrapper, {}));
        DOMElement._XL_rootNode = root;
      }
    } catch (e) {
      Logger.stacktrace('There has been an error loading the Notifications system, fallback object has been put in place to prevent errors', e);
      XenoLib.Notifications = {
        success(content, options = {}) { },
        info(content, options = {}) { },
        warning(content, options = {}) { },
        danger(content, options = {}) { },
        error(content, options = {}) { },
        show(content, options = {}) { },
        remove(id) { },
        update(id, options) { }
      };
    }
    /* NOTIFICATIONS END */

    global.XenoLib = XenoLib;

    const notifLocations = ['topLeft', 'topMiddle', 'topRight', 'bottomLeft', 'bottomMiddle', 'bottomRight'];
    const notifLocationClasses = [
      'topLeft-xenoLib option-xenoLib',
      'topMiddle-xenoLib option-xenoLib',
      'topRight-xenoLib option-xenoLib',
      'bottomLeft-xenoLib option-xenoLib',
      'bottomMiddle-xenoLib option-xenoLib',
      'bottomRight-xenoLib option-xenoLib'
    ];
    const PositionSelectorWrapperClassname = 'xenoLib-position-wrapper';
    const PositionSelectorSelectedClassname = 'selected-xenoLib';
    const PositionSelectorHiddenInputClassname = 'xenoLib-position-hidden-input';
    const FormText = Object.values(BdApi.Webpack.getBySource(/return \w\?\w=\w\.DISABLED:\w&&\(\w=\w\.SELECTABLE\),/) || {}).find(e => typeof e === 'function');
    class NotificationPosition extends React.PureComponent {
      constructor(props) {
        super(props);
        this.state = {
          position: props.position
        };
      }
      componentDidMount() {
        this._notificationId = XenoLib.Notifications.show('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacinia justo eget libero ultrices mollis.', { timeout: 0 });
      }
      componentWillUnmount() {
        XenoLib.Notifications.remove(this._notificationId);
      }
      getSelected() {
        switch (this.state.position) {
          case 'topLeft':
            return 'Top Left';
          case 'topMiddle':
            return 'Top Middle';
          case 'topRight':
            return 'Top Right';
          case 'bottomLeft':
            return 'Bottom Left';
          case 'bottomMiddle':
            return 'Bottom Middle';
          case 'bottomRight':
            return 'Bottom Right';
          default:
            return 'Unknown';
        }
      }
      render() {
        return React.createElement(
          'div',
          {},
          React.createElement(
            'div',
            {
              className: PositionSelectorWrapperClassname
            },
            notifLocations.map((e, i) => React.createElement(
              'label',
              {
                className: XenoLib.joinClassNames(notifLocationClasses[i], { [PositionSelectorSelectedClassname]: this.state.position === e })
              },
              React.createElement('input', {
                type: 'radio',
                name: 'xenolib-notif-position-selector',
                value: e,
                onChange: () => {
                  this.props.onChange(e);
                  this.setState({ position: e });
                },
                className: PositionSelectorHiddenInputClassname
              })
            ))
          ),
          React.createElement(
            FormText,
            {
              type: FormText.Types.DESCRIPTION,
              className: DiscordClasses.Margins.marginTop8
            },
            this.getSelected()
          )
        );
      }
    }

    class NotificationPositionField extends Settings.SettingField {
      constructor(name, note, onChange, value) {
        super(name, note, onChange, NotificationPosition, {
          position: value,
          onChange: reactElement => position => {
            this.onChange(position);
          }
        });
      }
    }

    class RadioGroupWrapper extends React.PureComponent {
      constructor(...args) {
        super(...args);
        this.state = {
          value: this.props.value
        };
        this.onChange = this.onChange.bind(this);
      }
      onChange(value) {
        this.setState({ value: value.value });
        this.props.onChange(value);
      }

      render() {
        return React.createElement(DiscordModules.RadioGroup, { ...this.props, value: this.state.value, onChange: this.onChange });
      }
    }

    class RadioGroup extends Settings.SettingField {
      constructor(name, note, defaultValue, values, onChange, options = {}) {
        super(name, note, onChange, RadioGroupWrapper, {
          noteOnTop: true,
          disabled: !!options.disabled,
          options: values,
          onChange: reactElement => option => {
            reactElement.props.value = option.value;
            reactElement.forceUpdate();
            this.onChange(option.value);
          },
          value: defaultValue
        });
      }
    }

    const ThemeProvider = (() => {
      let RootThemeContextProvider = null;
      WebpackModules.getModule(e => {
        const possFuncs = Object.values(e);
        if (possFuncs.length < 3 || possFuncs.length > 10) return false;
        if (!possFuncs.some(e => typeof e === 'function' && e.toString().includes('useThemeContext must be used within a ThemeContext.Provider'))) return false;
        RootThemeContextProvider = possFuncs.find(e => e.toString().match(/theme:\w,primaryColor:\w,secondaryColor:\w,/));
        return true;
      })
      return RootThemeContextProvider;
    })() || (props => props.children);
    // const useSyncExternalStore = WebpackModules.getByProps('useSyncExternalStore').useSyncExternalStore;
    const ThemeStore = WebpackModules.getModule(m => m.theme);

    function DiscordThemeProviderWrapper(props) {
      const theme = /* React.useSyncExternalStore([ThemeStore], () => ThemeStore.theme) */ ThemeStore.theme;
      return React.createElement(ThemeProvider, { theme }, props.children);
    }

    function DiscordThemeProviderWrapperWrapper(props) {
      return React.createElement(DiscordThemeProviderWrapper, {}, props.children);
    }

    class SwitchItemWrapper extends React.PureComponent {
      constructor(...args) {
        super(...args);
        this.state = {
          value: this.props.value
        };

        this.onChange = this.onChange.bind(this);
      }

      onChange(value) {
        this.setState({ value });
        this.props.onChange(value);
      }

      render() {
        return React.createElement(DiscordThemeProviderWrapperWrapper, {}, React.createElement(DiscordModules.SwitchRow, { ...this.props, value: this.state.value, onChange: this.onChange }));
      }
    }

    class Switch extends Settings.SettingField {
      constructor(name, note, isChecked, onChange, options = {}) {
        super(name, note, onChange);
        this.disabled = !!options.disabled;
        this.value = !!isChecked;
      }

      onAdded() {
        const root = ReactDOM.createRoot(this.getElement());
        root.render(React.createElement(SwitchItemWrapper, {
          children: this.name,
          note: this.note,
          disabled: this.disabled,
          hideBorder: false,
          value: this.value,
          onChange: e => {
            this.onChange(e);
          }
        }));

        this.root = root;
      }

      onRemoved() {
        this.root.unmount();
      }
    }

    class TimerWrapper extends React.PureComponent {
      constructor(...args) {
        super(...args);
        this.moment = Moment(this.props.value + this.props.time);
      }
      componentDidUpdate() {
        this.moment = Moment(this.props.value + this.props.time);
      }
      componentDidMount() {
        const { moment } = this;
        const vv = moment.clone().seconds(0).add(1, 'm').diff(moment);
        this.timer = setInterval(() => {
          clearInterval(this.timer);
          this.timer = setInterval(() => this.forceUpdate(), 60 * 1000);
          this.forceUpdate();
        }, vv);
      }
      componentWillUnmount() {
        if (this.timer) clearInterval(this.timer);
      }
      render() {
        const { value, after, active, inactive, time } = this.props;
        const future = (value + time);
        return React.createElement(TextElement, {}, value ? Date.now() > future ? active : `${after}${this.moment.fromNow()}` : inactive);
      }
    }

    class Timer extends Settings.SettingField {
      constructor(name, note, value, onChange, after, active, inactive, time) {
        super(name, note, onChange, TimerWrapper, { after, active, inactive, time, value });
      }
    }

    XenoLib.buildSetting = function buildSetting(data) {
      const { name, note, type, value, onChange, id } = data;
      let setting = null;
      if (type == 'color') setting = new XenoLib.Settings.ColorPicker(name, note, value, onChange, { disabled: data.disabled, defaultColor: value });
      else if (type == 'dropdown') setting = new Settings.Dropdown(name, note, value, data.options, onChange);
      else if (type == 'file') setting = new Settings.FilePicker(name, note, onChange);
      else if (type == 'keybind') setting = new Settings.Keybind(name, note, value, onChange);
      else if (type == 'radio') setting = new RadioGroup(name, note, value, data.options, onChange, { disabled: data.disabled });
      else if (type == 'slider') setting = new Settings.Slider(name, note, data.min, data.max, value, onChange, data);
      else if (type == 'switch') setting = new Switch(name, note, value, onChange, { disabled: data.disabled });
      else if (type == 'textbox') setting = new Settings.Textbox(name, note, value, onChange, { placeholder: data.placeholder || '' });
      if (id) setting.id = id;
      return setting;
    };

    /*
     * Function versionComparator from 0PluginLibrary as defaultComparator, required copyright notice:
     *
     * Copyright 2018 Zachary Rauen
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    */
    XenoLib.versionComparator = (currentVersion, remoteVersion) => {
      currentVersion = currentVersion.split(".").map((e) => { return parseInt(e); });
      remoteVersion = remoteVersion.split(".").map((e) => { return parseInt(e); });

      if (remoteVersion[0] > currentVersion[0]) return true;
      else if (remoteVersion[0] == currentVersion[0] && remoteVersion[1] > currentVersion[1]) return true;
      else if (remoteVersion[0] == currentVersion[0] && remoteVersion[1] == currentVersion[1] && remoteVersion[2] > currentVersion[2]) return true;
      return false;
    }

    /*
     * Function extractVersion from 0PluginLibrary as defaultVersioner, required copyright notice:
     *
     * Copyright 2018 Zachary Rauen
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    */
    XenoLib.extractVersion = (content) => {
      const remoteVersion = content.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i);
      if (!remoteVersion) return "0.0.0";
      return remoteVersion.toString().replace(/['"]/g, "");
    }

    return class CXenoLib extends Plugin {
      constructor() {
        super();
        this.settings = LibrarySettings;
        const _zerecantcode_path = require('path');
        const theActualFileNameZere = _zerecantcode_path.join(__dirname, _zerecantcode_path.basename(__filename));
        XenoLib.changeName(theActualFileNameZere, '1XenoLib'); /* prevent user from changing libs filename */
        try {
          NewModalStack.closeModal(`${this.name}_DEP_MODAL`);
        } catch (e) { }
      }
      load() {
        if (super.load) super.load();
        try {
          if (!BdApi.Plugins) return; /* well shit what now */
          if (!BdApi.isSettingEnabled) return;
          const list = BdApi.Plugins.getAll().filter(k => k._XL_PLUGIN || (k.instance && k.instance._XL_PLUGIN)).map(k => k.instance || k);
          for (let p = 0; p < list.length; p++) try {
            BdApi.Plugins.reload(list[p].getName());
          } catch (e) {
            try {
              Logger.stacktrace(`Failed to reload plugin ${list[p].getName()}`, e);
            } catch (e) {
              Logger.error('Failed telling you about failing to reload a plugin', list[p], e);
            }
          }

          const pluginsDir = (BdApi.Plugins && BdApi.Plugins.folder) || (window.ContentManager && window.ContentManager.pluginsFolder);
          const PLUGINS_LIST = ['BetterImageViewer', 'BetterTypingUsers', 'BetterUnavailableGuilds', 'CrashRecovery', 'InAppNotifications', 'MessageLoggerV2', 'MultiUploads', 'SaveToRedux', 'UnreadBadgesRedux'];
          const fs = require('fs');
          const path = require('path');

          const pluginsToCheck = [];

          let alreadyFoundZLib = false;

          for (const file of fs.readdirSync(pluginsDir)) {
            if (file.indexOf('.js') !== file.length - 3) continue;

            try {
              const { name } = _extractMeta(fs.readFileSync(path.join(pluginsDir, file), 'utf8'));
              if (PLUGINS_LIST.indexOf(name) === -1) {
                switch (name) {
                  case 'XenoLib': {
                    if (file !== path.basename(__filename)) fs.unlinkSync(path.join(pluginsDir, file));
                    break;
                  }
                  case 'ZeresPluginLibrary': {
                    if (alreadyFoundZLib) fs.unlinkSync(path.join(pluginsDir, file));
                    else alreadyFoundZLib = true;
                  }
                }
                continue;
              }
              if (~pluginsToCheck.findIndex(e => e.name === name)) {
                fs.unlinkSync(path.join(pluginsDir, file));
                continue;
              }
              pluginsToCheck.push({ name, file });
            } catch (e) { }
          }
          setTimeout(() => {
            try {
              const https = require('https');
              for (const { name, file } of pluginsToCheck) {
                // eslint-disable-next-line no-undef
                const isPluginEnabled = BdApi.Plugins.isEnabled(name);
                let plugin = BdApi.Plugins.get(name);
                if (plugin && plugin.instance) plugin = plugin.instance;
                // eslint-disable-next-line no-loop-func
                const req = https.request(`https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/${name}/${name}.plugin.js`, { headers: { origin: 'discord.com' } }, res => {
                  let body = '';
                  // eslint-disable-next-line no-void
                  res.on('data', chunk => ((body += chunk), void 0));
                  res.on('end', () => {
                    try {
                      if (res.statusCode !== 200) return /* XenoLib.Notifications.error(`Failed to check for updates for ${name}`, { timeout: 0 }) */;
                      if (plugin && (name === 'MessageLoggerV2' || Utilities.getNestedProp(plugin, '_config.info.version')) && !XenoLib.versionComparator(name === 'MessageLoggerV2' ? plugin.getVersion() : plugin._config.info.version, XenoLib.extractVersion(body))) return;
                      const newFile = `${name}.plugin.js`;
                      fs.unlinkSync(path.join(pluginsDir, file));
                      // avoid BDs watcher being shit as per usual
                      setTimeout(() => {
                        try {
                          fs.writeFileSync(path.join(pluginsDir, newFile), body);
                          if (window.pluginModule && window.pluginModule.loadPlugin) {
                            BdApi.Plugins.reload(name);
                            if (newFile !== file) window.pluginModule.loadPlugin(name);
                            // eslint-disable-next-line curly
                          } else if (BdApi.version ? !BdApi.isSettingEnabled('settings', 'addons', 'autoReload') : !BdApi.isSettingEnabled('fork-ps-5')) {
                            // eslint-disable-next-line no-negated-condition
                            if (newFile !== file) {
                              // eslint-disable-next-line no-undef
                              BdApi.showConfirmationModal('Hmm', 'You must reload in order to finish plugin installation', { onConfirm: () => location.reload() });
                              isPluginEnabled = false;
                            } else BdApi.Plugins.reload(name);
                          }
                          if (isPluginEnabled) setTimeout(() => BdApi.Plugins.enable(name), 3000);
                        } catch (e) { }
                      }, 1000);
                    } catch (e) { }
                  });
                });
                req.on('error', _ => XenoLib.Notifications.error(`Failed to check for updates for ${name}`, { timeout: 0 }));
              }
            } catch (e) { }
          }, 3000);
        } catch (err) {
          Logger.log('Failed to execute load', err);
        }
        const end = performance.now();
        Logger.log(`Loaded in ${Math.round(end - start)}ms`);
      }
      buildSetting(data) {
        if (data.type === 'position') {
          const setting = new NotificationPositionField(data.name, data.note, data.onChange, data.value);
          if (data.id) setting.id = data.id;
          return setting;
        } else if (data.type === 'color') {
          const setting = new XenoLib.Settings.ColorPicker(data.name, data.note, data.value, data.onChange, data.options);
          if (data.id) setting.id = data.id;
          return setting;
        } else if (data.type === 'timeStatus') {
          const setting = new Timer(data.name, data.note, data.value, data.onChange, data.after, data.active, data.inactive, data.time);
          if (data.id) setting.id = data.id;
          return setting;
        }
        return XenoLib.buildSetting(data);
      }
      getSettingsPanel() {
        return this.buildSettingsPanel()
          .append(new XenoLib.Settings.PluginFooter(() => this.showChangelog()))
          .getElement();
      }
      saveSettings(category, setting, value) {
        this.settings[category][setting] = value;
        LibrarySettings[category][setting] = value;
        PluginUtilities.saveSettings(this.name, LibrarySettings);
        if (category === 'notifications') {
          if (setting === 'position') {
            const DOMElement = document.querySelector('.xenoLib-notifications');
            if (DOMElement) {
              DOMElement.className = XenoLib.joinClassNames('xenoLib-notifications', `xenoLib-centering-${LibrarySettings.notifications.position}`);
              notificationEvents.dispatch({ type: 'XL_NOTIFS_ANIMATED' });
            }
          } else if (setting === 'backdrop' || setting === 'backdropColor') {
            notificationEvents.dispatch({ type: 'XL_NOTIFS_SETTINGS_UPDATE', key: UPDATEKEY });
            UPDATEKEY = {};
          }

        } else if (category === 'addons') if (setting === 'extra') {
          if (value && !patchAddonCardAnyway.patched) patchAddonCardAnyway(true);
          XenoLib.Notifications.warning('Reopen plugins section for immediate effect');
        } else if (category === 'userCounter') if (setting === 'enabled') {
          if (value) {
            LibrarySettings.userCounter.enableTime = Date.now();
            LibrarySettings.userCounter.lastSubmission = Date.now();
          } else {
            LibrarySettings.userCounter.enableTime = 0;
            LibrarySettings.userCounter.lastSubmission = 0;
          }
          PluginUtilities.saveSettings(this.name, LibrarySettings);
        }


      }
      showChangelog(footer) {
        XenoLib.showChangelog(`${this.name} has been updated!`, this.version, this._config.changelog, void 0, true);
      }
      get name() {
        return config.info.name;
      }
      get short() {
        let string = '';

        for (let i = 0, len = config.info.name.length; i < len; i++) {
          const char = config.info.name[i];
          if (char === char.toUpperCase()) string += char;
        }

        return string;
      }
      get author() {
        return config.info.authors.map(author => author.name).join(', ');
      }
      get version() {
        return config.info.version;
      }
      get description() {
        return config.info.description;
      }
    };
  };

  /* Finalize */

  let ZeresPluginLibraryOutdated = false;
  try {
    const a = (c, a) => ((c = c.split('.').map(b => parseInt(b))), (a = a.split('.').map(b => parseInt(b))), !!(a[0] > c[0])) || !!(a[0] == c[0] && a[1] > c[1]) || !!(a[0] == c[0] && a[1] == c[1] && a[2] > c[2]);
    let b = BdApi.Plugins.get('ZeresPluginLibrary');
    ((b, c) => b && b.version && a(b.version, c))(b, '2.0.23') && (ZeresPluginLibraryOutdated = !0);
  } catch (e) {
    console.error('Error checking if ZeresPluginLibrary is out of date', e);
  }

  return !global.ZeresPluginLibrary || ZeresPluginLibraryOutdated || window.__XL_requireRenamePls
    ? class {
      constructor() {
        this._config = config;
      }
      getName() {
        return this.name.replace(/\s+/g, '');
      }
      getAuthor() {
        return this.author;
      }
      getVersion() {
        return this.version;
      }
      getDescription() {
        return `${this.description} You are missing ZeresPluginLibrary for this plugin, please enable the plugin to download it.`;
      }
      start() { }
      load() {
        try {
          // asking people to do simple tasks is stupid, relying on stupid modals that are *supposed* to help them is unreliable
          // forcing the download on enable is good enough
          const fs = require('fs');
          const path = require('path');
          const pluginsDir = (BdApi.Plugins && BdApi.Plugins.folder) || (window.ContentManager && window.ContentManager.pluginsFolder);
          const zeresLibDir = path.join(pluginsDir, '0PluginLibrary.plugin.js');

          if (window.__XL_requireRenamePls) {
            try {
              delete window.__XL_requireRenamePls;
              const oldSelfPath = path.join(pluginsDir, path.basename(__filename));
              const selfContent = fs.readFileSync(oldSelfPath);
              // avoid windows blocking the file
              fs.unlinkSync(oldSelfPath);
              // avoid BDs watcher being shit as per usual
              setTimeout(() => {
                try {
                  fs.writeFileSync(path.join(pluginsDir, '1XenoLib.plugin.js'), selfContent);
                  window.__XL_waitingForWatcherTimeout = setTimeout(() => {
                    // what the fuck?
                    BdApi.Plugins.reload(this.getName());
                  }, 3000);
                } catch (e) { }
              }, 1000);
            } catch (e) { }
            return;
          }

          if (window.__XL_assumingZLibLoaded) return;

          for (const file of fs.readdirSync(pluginsDir)) {
            if (file.indexOf('.js') !== file.length - 3) continue;
            try {
              switch (_extractMeta(fs.readFileSync(path.join(pluginsDir, file), 'utf8')).name) {
                case 'XenoLib': {
                  if (file !== '1XenoLib.plugin.js') if (file === path.basename(__filename)) window.__XL_requireRenamePls = true;
                  else fs.unlinkSync(path.join(pluginsDir, file));

                  continue;
                }
                case 'ZeresPluginLibrary': {
                  fs.unlinkSync(path.join(pluginsDir, file));
                  continue;
                }
                default: continue;
              }
            } catch (e) { }
          }

          const https = require('https');

          const onFail = () => BdApi.showConfirmationModal('Well shit', 'Failed to download Zeres Plugin Library, join this server for further assistance:https://discord.gg/NYvWdN5');

          const req = https.get('https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js', { headers: { origin: 'discord.com' } }, res => {
            let body = '';
            // eslint-disable-next-line no-void
            res.on('data', chunk => ((body += new TextDecoder("utf-8").decode(chunk)), void 0));
            res.on('end', (rez) => {
              try {
                if (rez.statusCode !== 200) return onFail();
                fs.writeFileSync(zeresLibDir, body);
                // eslint-disable-next-line no-undef
                window.__XL_waitingForWatcherTimeout = setTimeout(() => {
                  try {
                    if (!window.pluginModule || !window.pluginModule.loadPlugin) {
                      window.__XL_assumingZLibLoaded = true;
                      const didRename = window.__XL_requireRenamePls;
                      window.__XL_waitingForWatcherTimeout = setTimeout(() => {
                        try {
                          window.__XL_waitingForWatcherTimeout = setTimeout(() => {
                            try {
                              location.reload();
                            } catch (e) { }
                          }, 3000);
                          BdApi.Plugins.reload(this.getName());
                        } catch (e) { }
                      }, window.__XL_requireRenamePls ? 3000 : 0);
                      if (window.__XL_requireRenamePls) {
                        delete window.__XL_requireRenamePls;
                        const oldSelfPath = path.join(pluginsDir, path.basename(__filename));
                        const selfContent = fs.readFileSync(oldSelfPath);
                        // avoid windows blocking the file
                        fs.unlinkSync(oldSelfPath);
                        fs.writeFileSync(path.join(pluginsDir, '1XenoLib.plugin.js'), selfContent);
                      }
                      return;
                    }
                    window.__XL_assumingZLibLoaded = true;
                    window.pluginModule.loadPlugin('0PluginLibrary');
                    window.__XL_waitingForWatcherTimeout = setTimeout(() => {
                      try {
                        const didRename = window.__XL_requireRenamePls;
                        window.__XL_waitingForWatcherTimeout = setTimeout(() => {
                          try {
                            window.__XL_waitingForWatcherTimeout = setTimeout(onFail, 3000);
                            BdApi.Plugins.reload(this.getName());
                            if (!BdApi.Plugins.get('XenoLib')) window.pluginModule.loadPlugin('1XenoLib');
                          } catch (e) { }
                        }, window.__XL_requireRenamePls ? 3000 : 0);
                        if (window.__XL_requireRenamePls) {
                          delete window.__XL_requireRenamePls;
                          const oldSelfPath = path.join(pluginsDir, path.basename(__filename));
                          const selfContent = fs.readFileSync(oldSelfPath);
                          // avoid windows blocking the file
                          fs.unlinkSync(oldSelfPath);
                          fs.writeFileSync(path.join(pluginsDir, '1XenoLib.plugin.js'), selfContent);
                        }
                      } catch (e) { }
                    }, 3000);
                  } catch (e) { }
                }, 3000);
              } catch (e) { }
            });
          });
          req.on('error', _ => {
            onFail();
          });
        } catch (e) { }
      }
      stop() { }
      get name() {
        return config.info.name;
      }
      get short() {
        let string = '';
        for (let i = 0, len = config.info.name.length; i < len; i++) {
          const char = config.info.name[i];
          if (char === char.toUpperCase()) string += char;
        }
        return string;
      }
      get author() {
        return config.info.authors.map(author => author.name).join(', ');
      }
      get version() {
        return config.info.version;
      }
      get description() {
        return config.info.description;
      }
    }
    : buildPlugin(global.ZeresPluginLibrary.buildPlugin(config));
})();

/*@end@*/
