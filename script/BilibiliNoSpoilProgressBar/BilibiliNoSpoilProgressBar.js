// ==UserScript==
// @name            B站防剧透进度条
// @version         1.5.4.20210626
// @namespace       laster2800
// @author          Laster2800
// @description     看比赛、看番总是被进度条剧透？装上这个脚本再也不用担心这些问题了
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/411092
// @supportURL      https://greasyfork.org/zh-CN/scripts/411092/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/video/*
// @include         *://www.bilibili.com/medialist/play/watchlater
// @include         *://www.bilibili.com/medialist/play/watchlater/*
// @include         *://www.bilibili.com/bangumi/play/*
// @exclude         /.*:\/\/.*:\/\/.*/
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=944165
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @connect         api.bilibili.com
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

(function() {
  'use strict'

  // 脚本兼容
  if (GM_info.scriptHandler != 'Tampermonkey') {
    const script = GM_info.script
    if (!script.author) {
      script.author = 'Laster2800'
    }
    if (!script.homepage) {
      script.homepage = 'https://greasyfork.org/zh-CN/scripts/411092'
    }
    if (!script.supportURL) {
      script.supportURL = 'https://greasyfork.org/zh-CN/scripts/411092/feedback'
    }
  }

  /**
   * 脚本内用到的枚举定义
   */
  const Enums = {}

  /**
   * 全局对象
   * @typedef GMObject
   * @property {string} id 脚本标识
   * @property {number} configVersion 配置版本，为最后一次执行初始化设置或功能性更新设置时脚本对应的配置版本号
   * @property {number} configUpdate 当前版本对应的配置版本号，只要涉及到配置的修改都要更新；若同一天修改多次，可以追加小数来区分
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_configMap} configMap 用户配置属性
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {GMObject_const} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {{[s: string]: HTMLElement}} el HTML 元素
   * @property {GMObject_error} error 错误信息
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} bangumiEnabled 番剧自动启用功能
   * @property {boolean} simpleScriptControl 是否简化进度条上方的脚本控制
   * @property {boolean} disableCurrentPoint 隐藏当前播放时间
   * @property {boolean} disableDuration 隐藏视频时长
   * @property {boolean} disablePbp 隐藏「热度」曲线
   * @property {boolean} disablePreview 隐藏进度条预览
   * @property {boolean} disablePartInformation 隐藏分P信息
   * @property {number} offsetTransformFactor 进度条极端偏移因子
   * @property {number} offsetLeft 进度条偏移极左值
   * @property {number} offsetRight 进度条偏移极右值
   * @property {number} reservedLeft 进度条左侧预留区
   * @property {number} reservedRight 进度条右侧预留区
   * @property {boolean} postponeOffset 延后进度条偏移的时间点
   * @property {boolean} openSettingAfterConfigUpdate 功能性更新后打开设置页面
   * @property {boolean} reloadAfterSetting 设置生效后刷新页面
   */
  /**
   * @typedef {{[config: string]: GMObject_configMap_item}} GMObject_configMap
   */
  /**
   * @typedef GMObject_configMap_item
   * @property {*} default 默认值
   * @property {'checked'|'value'} attr 对应 `DOM` 节点上的属性
   * @property {boolean} [manual] 配置保存时是否需要手动处理
   * @property {boolean} [needNotReload] 配置改变后是否不需要重新加载就能生效
   * @property {number} [min] 最小值
   * @property {number} [max] 最大值
   * @property {number} [configVersion] 涉及配置更改的最后配置版本
   */
  /**
   * @callback uploaderList 不传入/传入参数时获取/修改防剧透 UP 主名单
   * @param {string} [updateData] 更新数据
   * @returns {string} 防剧透 UP 主名单
   */
  /**
   * @callback uploaderListSet 通过懒加载方式获取格式化的防剧透 UP 主名单
   * @param {boolean} [reload] 是否重新加载数据
   * @returns {Set<String>} 防剧透 UP 主名单
   */
  /**
   * @typedef GMObject_data
   * @property {uploaderList} uploaderList 防剧透 UP 主名单
   * @property {uploaderListSet} uploaderListSet 防剧透 UP 主名单集合
   */
  /**
   * @callback api_videoInfo
   * @param {string} id `aid` 或 `bvid`
   * @param {'aid'|'bvid'} type `id` 类型
   * @returns {string} 查询视频信息的 URL
   */
  /**
   * @typedef GMObject_url
   * @property {api_videoInfo} api_videoInfo 视频信息
   * @property {string} gm_readme 说明文档
   * @property {string} gm_changelog 更新日志
   * @property {string} noop 无操作
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_videoNormalMode 匹配正常模式播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看模式播放页
   * @property {RegExp} page_bangumi 匹配番剧播放页
   */
  /**
   * @typedef GMObject_const
   * @property {number} fadeTime UI 渐变时间（单位：ms）
   */
  /**
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
   * @property {GMObject_menu_item} uploaderList 防剧透 UP 主名单
   */
  /**
   * @typedef GMObject_menu_item
   * @property {boolean} state 打开状态
   * @property {HTMLElement} el 菜单元素
   * @property {() => void} [openHandler] 打开菜单的回调函数
   * @property {() => void} [closeHandler] 关闭菜单的回调函数
   */
  /**
   * @typedef GMObject_error
   * @property {string} DOM_PARSE 进度条解析错误
   * @property {string} NETWORK 网络错误
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: 'gm411092',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210302,
    config: {
      bangumiEnabled: false,
      simpleScriptControl: false,
      disableCurrentPoint: true,
      disableDuration: true,
      disablePbp: true,
      disablePreview: false,
      disablePartInformation: true,
      offsetTransformFactor: null,
      offsetLeft: null,
      offsetRight: null,
      reservedLeft: null,
      reservedRight: null,
      postponeOffset: true,
      openSettingAfterConfigUpdate: true,
      reloadAfterSetting: true,
    },
    configMap: {
      bangumiEnabled: { default: false, attr: 'checked', needNotReload: true },
      simpleScriptControl: { default: false, attr: 'checked' },
      disableCurrentPoint: { default: true, attr: 'checked', configVersion: 20200912 },
      disableDuration: { default: true, attr: 'checked' },
      disablePbp: { default: true, attr: 'checked' },
      disablePreview: { default: false, attr: 'checked' },
      disablePartInformation: { default: true, attr: 'checked', configVersion: 20210302 },
      offsetTransformFactor: { default: 0.65, attr: 'value', manual: true, needNotReload: true, max: 5.0, configVersion: 20200911.1 },
      offsetLeft: { default: 40, attr: 'value', manual: true, needNotReload: true, configVersion: 20200911 },
      offsetRight: { default: 40, attr: 'value', manual: true, needNotReload: true, configVersion: 20200911 },
      reservedLeft: { default: 10, attr: 'value', manual: true, needNotReload: true },
      reservedRight: { default: 10, attr: 'value', manual: true, needNotReload: true },
      postponeOffset: { default: true, attr: 'checked', needNotReload: true, configVersion: 20200911 },
      openSettingAfterConfigUpdate: { default: true, attr: 'checked' },
      reloadAfterSetting: { default: true, attr: 'checked', needNotReload: true },
    },
    data: {
      uploaderList: null,
      uploaderListSet: null,
    },
    url: {
      api_videoInfo: (id, type) => `https://api.bilibili.com/x/web-interface/view?${type}=${id}`,
      gm_readme: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliNoSpoilProgressBar/README.md',
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliNoSpoilProgressBar/changelog.md',
      noop: 'javascript:void(0)',
    },
    regex: {
      page_videoNormalMode: /\.com\/video(?=[/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=[/?#]|$)/,
      page_bangumi: /\.com\/bangumi\/play(?=[/?#]|$)/,
    },
    const: {
      fadeTime: 400,
    },
    menu: {
      setting: { state: false, el: null },
      uploaderList: { state: false, el: null },
    },
    el: {
      gmRoot: null,
      setting: null,
      uploaderList: null,
    },
    error: {
      DOM_PARSE: `DOM解析错误。大部分情况下是由于网络加载速度不足造成的，不影响脚本工作；否则就是B站网页改版，请联系脚本作者进行修改：${GM_info.script.supportURL}`,
      NETWORK: `网络连接错误，出现这个问题有可能是因为网络加载速度不足或者B站后台API被改动。也不排除是脚本内部数据出错造成的，初始化脚本也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`,
    }
  }

  /* global API */
  const api = new API({
    id: gm.id,
    label: GM_info.script.name,
    waitTimeout: 8000, // 相关元素加载较慢，等待时间可以稍长
    fadeTime: gm.const.fadeTime,
  })

  /**
   * 脚本运行的抽象，脚本独立于网站、为脚本本身服务的部分
   */
  class Script {
    constructor() {
      /**
       * 通用方法
       */
      this.method = {
        /**
         * GM 读取流程
         *
         * 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
         *
         * @param {string} gmKey 键名
         * @param {*} defaultValue 默认值
         * @param {boolean} [writeback=true] 配置出错时是否将默认值回写入配置中
         * @returns {*} 通过校验时是配置值，不能通过校验时是默认值
         */
        gmValidate(gmKey, defaultValue, writeback = true) {
          const value = GM_getValue(gmKey)
          if (Enums && gmKey in Enums) {
            if (Enums[gmKey][value]) {
              return value
            }
          } else if (typeof value == typeof defaultValue) { // typeof null == 'object'，对象默认值赋 null 无需额外处理
            return value
          }

          if (writeback) {
            GM_setValue(gmKey, defaultValue)
          }
          return defaultValue
        },
      }
    }

    /**
     * 初始化
     */
    init() {
      this.initGMObject()
      this.updateVersion()
      this.readConfig()
    }

    /**
     * 初始化全局对象
     */
    initGMObject() {
      for (const name in gm.configMap) {
        gm.config[name] = gm.configMap[name].default
      }

      gm.data = {
        ...gm.data,
        uploaderList: updateData => {
          const _ = gm.data._
          if (updateData) {
            GM_setValue('uploaderList', updateData)
            _.uploaderListSet = null
            return updateData
          } else {
            let uploaderList = GM_getValue('uploaderList')
            if (typeof uploaderList != 'string') {
              uploaderList = ''
              GM_setValue('uploaderList', uploaderList)
            }
            return uploaderList
          }
        },
        uploaderListSet: reload => {
          const _ = gm.data._
          if (!_.uploaderListSet || reload) {
            const set = new Set()
            const content = gm.data.uploaderList()
            if (content.startsWith('*')) {
              set.add('*')
            } else {
              const rows = content.split('\n')
              for (const row of rows) {
                const m = row.match(/^\d+/)
                if (m && m.length > 0) {
                  set.add(m[0])
                }
              }
            }
            _.uploaderListSet = set
          }
          return _.uploaderListSet
        },
        _: {}, // 用于存储内部数据，不公开访问
      }

      gm.el = {
        ...gm.el,
        gmRoot: document.body.appendChild(document.createElement('div')),
      }
      gm.el.gmRoot.id = gm.id
    }

    /**
     * 版本更新处理
     */
    updateVersion() {
      const _self = this
      // 该项与更新相关，在此处处理
      gm.config.openSettingAfterConfigUpdate = _self.method.gmValidate('openSettingAfterConfigUpdate', gm.config.openSettingAfterConfigUpdate)
      if (gm.configVersion > 0) {
        if (gm.configVersion < gm.configUpdate) {
          if (gm.config.openSettingAfterConfigUpdate) {
            _self.openUserSetting(2)
          }

          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.cofigUpdate，必须手写更新后的配置版本号！

          // 1.1.0.20200911
          if (gm.configVersion < 20200911) {
            GM_setValue('offsetLeft', 40)
            GM_setValue('offsetRight', 40)
          }

          // 1.2.4.20200912
          if (gm.configVersion < 20200912) {
            GM_setValue('disableCurrentPoint', true)
          }
        }
      }
    }

    /**
     * 用户配置读取
     */
    readConfig() {
      const _self = this
      if (gm.configVersion > 0) {
        // 对配置进行校验
        const cfgManual = { openSettingAfterConfigUpdate: true } // 手动处理的配置
        const cfgNoWriteback = {} // 不进行回写的配置
        for (const name in gm.config) {
          if (!cfgManual[name]) {
            gm.config[name] = _self.method.gmValidate(name, gm.config[name], !cfgNoWriteback[name])
          }
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        const cfgManual = {}
        for (const name in gm.config) {
          if (!cfgManual[name]) {
            GM_setValue(name, gm.config[name])
          }
        }
        _self.openUserSetting(1)
        setTimeout(() => {
          const result = confirm(`【${GM_info.script.name}】\n\n脚本有一定使用门槛，如果不理解防剧透机制效果将会剧减，这种情况下用户甚至完全不明白脚本在「干什么」，建议在阅读说明后使用。是否立即打开防剧透机制说明？`)
          if (result) {
            window.open(`${gm.url.gm_readme}#防剧透机制说明`)
          }
        }, 2000)
      }
    }

    /**
     * 添加脚本菜单
     */
    addScriptMenu() {
      const _self = this
      // 用户配置设置
      GM_registerMenuCommand('用户设置', () => _self.openUserSetting())
      // 防剧透 UP 主名单
      GM_registerMenuCommand('防剧透UP主名单', () => _self.openUploaderList())
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', () => _self.resetScript())
    }

    /**
     * 打开用户设置
     * @param {number} [type=0] 普通 `0` | 初始化 `1` | 功能性更新 `2`
     */
    openUserSetting(type = 0) {
      const _self = this
      if (gm.el.setting) {
        _self.openMenuItem('setting')
      } else {
        const el = {}
        setTimeout(() => {
          initSetting()
          processConfigItem()
          processSettingItem()
          _self.openMenuItem('setting')
        })

        /**
         * 设置页面初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          gm.el.setting.className = 'gm-setting'
          gm.el.setting.innerHTML = `
            <div id="gm-setting-page">
              <div class="gm-title">
                <div id="gm-maintitle" title="${GM_info.script.homepage}">
                  <a href="${GM_info.script.homepage}" target="_blank">${GM_info.script.name}</a>
                </div>
                <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
              </div>
              <div class="gm-items">
                <table>
                  <tr class="gm-item">
                    <td><div>说明</div></td>
                    <td>
                      <div>
                        <span>防剧透机制说明</span>
                        <a class="gm-hint-option" title="查看脚本防剧透机制的实现原理。" href="${gm.url.gm_readme}#防剧透机制说明" target="_blank" style="color:var(--hint-text-color)">点击查看</a>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="加入防剧透名单UP主的视频，会在打开视自动开启防剧透进度条。">
                    <td><div>自动化</div></td>
                    <td>
                      <span>防剧透UP主名单</span>
                      <span id="gm-uploaderList" class="gm-hint-option">点击编辑</span>
                    </td>
                  </tr>

                  <tr class="gm-item" title="番剧是否自动打开防剧透进度条？">
                    <td><div>自动化</div></td>
                    <td>
                      <label>
                        <span>番剧自动启用防剧透进度条</span>
                        <input id="gm-bangumiEnabled" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="是否简化进度条上方的脚本控制？">
                    <td><div>用户接口</div></td>
                    <td>
                      <label>
                        <span>简化进度条上方的脚本控制</span>
                        <input id="gm-simpleScriptControl" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这些功能可能会造成剧透，根据需要在防剧透进度条中进行隐藏。">
                    <td rowspan="6"><div>用户接口</div></td>
                    <td>
                      <div>
                        <span>启用功能时</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏当前播放时间？该功能可能会造成剧透。">
                    <td>
                      <label>
                        <span>隐藏当前播放时间</span>
                        <input id="gm-disableCurrentPoint" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏视频时长？该功能可能会造成剧透。">
                    <td>
                      <label>
                        <span>隐藏视频时长</span>
                        <input id="gm-disableDuration" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏「热度」曲线？该功能可能会造成剧透。（pakku 扩展的弹幕频率图也会被禁用）">
                    <td>
                      <label>
                        <span>隐藏「热度」曲线</span>
                        <input id="gm-disablePbp" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否在防剧透进度条中隐藏进度条预览？该功能可能会造成剧透。">
                    <td>
                      <label>
                        <span>隐藏进度条预览</span>
                        <input id="gm-disablePreview" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否隐藏视频分P信息？它们可能会造成剧透。该功能对番剧无效。">
                    <td>
                      <label>
                        <span>隐藏分P信息</span>
                        <input id="gm-disablePartInformation" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="防剧透参数设置，请务必在理解参数作用的前提下修改！">
                    <td rowspan="7"><div>高级设置</div></td>
                    <td>
                      <div>
                        <span>防剧透参数</span>
                        <span id="gm-resetParam" class="gm-hint-option" title="重置防剧透参数。">重置</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条极端偏移因子设置。">
                    <td>
                      <div>
                        <span>进度条极端偏移因子</span>
                        <span id="gm-offsetTransformFactorInformation" class="gm-information" title="">💬</span>
                        <input id="gm-offsetTransformFactor" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条偏移极左值设置。">
                    <td>
                      <div>
                        <span>进度条偏移极左值</span>
                        <span id="gm-offsetLeftInformation" class="gm-information" title="">💬</span>
                        <input id="gm-offsetLeft" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条偏移极右值设置。">
                    <td>
                      <div>
                        <span>进度条偏移极右值</span>
                        <span id="gm-offsetRightInformation" class="gm-information" title="">💬</span>
                        <input id="gm-offsetRight" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条左侧预留区设置。">
                    <td>
                      <div>
                        <span>进度条左侧预留区</span>
                        <span id="gm-reservedLeftInformation" class="gm-information" title="">💬</span>
                        <input id="gm-reservedLeft" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="进度条右侧预留区设置。">
                    <td>
                      <div>
                        <span>进度条右侧预留区</span>
                        <span id="gm-reservedRightInformation" class="gm-information" title="">💬</span>
                        <input id="gm-reservedRight" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="是否延后进度条偏移的时间点，使得在启用功能或改变播放进度后立即进行进度条偏移？">
                    <td>
                      <label>
                        <span>延后进度条偏移的时间点</span>
                        <span id="gm-postponeOffsetInformation" class="gm-information" title="">💬</span>
                        <input id="gm-postponeOffset" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="功能性更新后，是否打开用户设置？">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>功能性更新后打开用户设置</span>
                        <input id="gm-openSettingAfterConfigUpdate" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="勾选后，如果更改的配置需要重新加载才能生效，那么会在设置完成后重新加载页面。">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>必要时在设置完成后重新加载页面</span>
                        <input id="gm-reloadAfterSetting" type="checkbox">
                      </label>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="gm-bottom">
                <button id="gm-save">保存</button>
                <button id="gm-cancel">取消</button>
              </div>
              <div id="gm-reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
              <a id="gm-changelog" title="显示更新日志" href="${gm.url.gm_changelog}" target="_blank">更新日志</a>
            </div>
            <div class="gm-shadow"></div>
          `

          // 找出配置对应的元素
          for (const name in gm.config) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('#gm-setting-page')
          el.maintitle = gm.el.setting.querySelector('#gm-maintitle')
          el.changelog = gm.el.setting.querySelector('#gm-changelog')
          switch (type) {
            case 1:
              el.settingPage.setAttribute('setting-type', 'init')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(初始化设置)</span>'
              break
            case 2:
              el.settingPage.setAttribute('setting-type', 'updated')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(功能性更新设置)</span>'
              for (const name in gm.configMap) {
                const configVersion = gm.configMap[name].configVersion
                if (configVersion && configVersion > gm.configVersion) {
                  let node = el[name]
                  while (node.nodeName != 'TD') {
                    node = node.parentNode
                    if (!node) {
                      api.logger.error(gm.error.DOM_PARSE)
                      break
                    }
                  }
                  if (node && node.firstElementChild) {
                    api.dom.addClass(node.firstElementChild, 'gm-updated')
                  }
                }
              }
              break
          }
          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')
          el.resetParam = gm.el.setting.querySelector('#gm-resetParam')
          el.uploaderList = gm.el.setting.querySelector('#gm-uploaderList')

          // 提示信息
          el.offsetTransformFactorInformation = gm.el.setting.querySelector('#gm-offsetTransformFactorInformation')
          api.message.advanced(el.offsetTransformFactorInformation, `
            <style>
              .${gm.id}-msgbox ul > li {
                list-style: disc;
                margin-left: 1em;
              }
            </style>
            <div style="line-height:1.6em">
              <div>进度条极端偏移因子（范围：0.00 ~ 5.00），用于控制进度条偏移量的概率分布。更多信息请阅读说明文档。</div>
              <ul>
                <li>因子的值越小，则出现极限偏移的概率越高。最小可取值为 <b>0</b>，此时偏移值必定为极左值或极右值。</li>
                <li>因子的值越大，则出现极限偏移的概率越低，偏移值趋向于 0。无理论上限，但实际取值达到 3 效果就已经非常明显，限制最大值为 5。</li>
                <li>因子取值为 <b>1</b> 时，偏移量的概率会在整个区间平滑分布。</li>
              </ul>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.offsetLeftInformation = gm.el.setting.querySelector('#gm-offsetLeftInformation')
          api.message.advanced(el.offsetLeftInformation, `
            <div style="line-height:1.6em">
              极限情况下进度条向左偏移的距离（百分比），该选项用于解决进度条后向剧透问题。设置为 <b>0</b> 可以禁止进度条左偏。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.offsetRightInformation = gm.el.setting.querySelector('#gm-offsetRightInformation')
          api.message.advanced(el.offsetRightInformation, `
            <div style="line-height:1.6em">
              极限情况下进度条向右偏移的距离（百分比），该选项用于解决进度条前向剧透问题。设置为 <b>0</b> 可以禁止进度条右偏。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.reservedLeftInformation = gm.el.setting.querySelector('#gm-reservedLeftInformation')
          api.message.advanced(el.reservedLeftInformation, `
            <div style="line-height:1.6em">
              进度条左侧预留区间大小（百分比）。若进度条向左偏移后导致滑块进入区间，则调整偏移量使得滑块位于区间最右侧（特别地，若播放进度比偏移量小则不偏移）。该选项是为了保证在任何情况下都能通过点击滑块左侧区域向前调整进度。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.reservedRightInformation = gm.el.setting.querySelector('#gm-reservedRightInformation')
          api.message.advanced(el.reservedRightInformation, `
            <div style="line-height:1.6em">
              进度条右侧预留区间大小（百分比）。若进度条向右偏移后导致滑块进入区间，则调整偏移量使得滑块位于区间最左侧。该选项是为了保证在任何情况下都能通过点击滑块右侧区域向后调整进度。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.postponeOffsetInformation = gm.el.setting.querySelector('#gm-postponeOffsetInformation')
          api.message.advanced(el.postponeOffsetInformation, `
            <div style="line-height:1.6em">
              在启用功能或改变播放进度后，不要立即对进度条进行偏移，而是在下次进度条显示出来时偏移。这样可以避免用户观察到处理过程，从而防止用户推测出偏移方向与偏移量。更多信息请阅读说明文档。
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
        }

        /**
         * 维护与设置项相关的数据和元素
         */
        const processConfigItem = () => {
          el.offsetTransformFactor.oninput = function() {
            const v0 = this.value.replace(/[^\d.]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value
              if (/^\d+\./.test(v0)) {
                if (!/^\d+\.\d+$/.test(v0)) {
                  value = v0.replace(/(?<=^\d+\.\d*).*/, '')
                } else {
                  value = v0
                }
                if (parseFloat(value) >= gm.configMap.offsetTransformFactor.max) {
                  if (value.endsWith('.')) {
                    value = `${gm.configMap.offsetTransformFactor.max.toFixed(0)}.`
                  } else {
                    value = gm.configMap.offsetTransformFactor.max.toFixed(2)
                  }
                }
              } else {
                value = parseFloat(v0)
                if (value > gm.configMap.offsetTransformFactor.max) {
                  value = gm.configMap.offsetTransformFactor.max // 此处不要设置小数点
                }
                value = String(value)
              }
              if (/\.\d{3,}$/.test(value)) {
                value = value.replace(/(?<=\.\d{2}).*/, '')
              }
              this.value = value
            }
          }
          el.offsetTransformFactor.onblur = function() {
            let value = this.value
            if (value === '') {
              value = gm.configMap.offsetTransformFactor.default
            }
            this.value = parseFloat(value).toFixed(2)
          }
          el.offsetLeft.oninput = el.offsetRight.oninput = el.reservedLeft.oninput = el.reservedRight.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > 100) { // 不能大于 100%
                value = 100
              }
              this.value = value
            }
          }
          el.offsetLeft.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.offsetLeft.default
            }
          }
          el.offsetRight.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.offsetRight.default
            }
          }
          el.reservedLeft.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.reservedLeft.default
            }
          }
          el.reservedRight.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.reservedRight.default
            }
          }
        }

        /**
         * 处理与设置页面相关的数据和元素
         */
        const processSettingItem = () => {
          const _self = this
          gm.menu.setting.openHandler = onOpen
          el.save.onclick = onSave
          el.cancel.onclick = () => _self.closeMenuItem('setting')
          el.shadow.onclick = function() {
            if (!this.hasAttribute('disabled')) {
              _self.closeMenuItem('setting')
            }
          }
          el.reset.onclick = () => _self.resetScript()
          el.resetParam.onclick = () => {
            el.offsetTransformFactor.value = gm.configMap.offsetTransformFactor.default
            el.offsetLeft.value = gm.configMap.offsetLeft.default
            el.offsetRight.value = gm.configMap.offsetRight.default
            el.reservedLeft.value = gm.configMap.reservedLeft.default
            el.reservedRight.value = gm.configMap.reservedRight.default
            el.postponeOffset.checked = gm.configMap.postponeOffset.default
          }
          el.uploaderList.onclick = () => {
            _self.openUploaderList()
          }
          if (type > 0) {
            el.cancel.disabled = true
            el.shadow.setAttribute('disabled', '')
          }
        }

        let needReload = false
        /**
         * 设置保存时执行
         */
        const onSave = () => {
          // 通用处理
          for (const name in gm.configMap) {
            const cfg = gm.configMap[name]
            if (!cfg.manual) {
              const change = saveConfig(name, cfg.attr)
              if (!cfg.needNotReload) {
                needReload = needReload || change
              }
            }
          }

          // 特殊处理
          let offsetTransformFactor = parseFloat(el.offsetTransformFactor.value)
          let offsetLeft = parseInt(el.offsetLeft.value)
          let offsetRight = parseInt(el.offsetRight.value)
          let reservedLeft = parseInt(el.reservedLeft.value)
          let reservedRight = parseInt(el.reservedRight.value)
          if (isNaN(offsetTransformFactor)) {
            offsetTransformFactor = gm.configMap.offsetTransformFactor.default
          }
          if (isNaN(offsetLeft)) {
            offsetLeft = gm.configMap.offsetLeft.default
          }
          if (isNaN(offsetRight)) {
            offsetRight = gm.configMap.offsetRight.default
          }
          if (isNaN(reservedLeft)) {
            reservedLeft = gm.configMap.reservedLeft.default
          }
          if (isNaN(reservedRight)) {
            reservedRight = gm.configMap.reservedRight.default
          }
          if (offsetTransformFactor != gm.config.offsetTransformFactor) {
            gm.config.offsetTransformFactor = offsetTransformFactor
            GM_setValue('offsetTransformFactor', gm.config.offsetTransformFactor)
          }
          if (offsetLeft != gm.config.offsetLeft) {
            gm.config.offsetLeft = offsetLeft
            GM_setValue('offsetLeft', gm.config.offsetLeft)
          }
          if (offsetRight != gm.config.offsetRight) {
            gm.config.offsetRight = offsetRight
            GM_setValue('offsetRight', gm.config.offsetRight)
          }
          if (reservedLeft != gm.config.reservedLeft) {
            gm.config.reservedLeft = reservedLeft
            GM_setValue('reservedLeft', gm.config.reservedLeft)
          }
          if (reservedRight != gm.config.reservedRight) {
            gm.config.reservedRight = reservedRight
            GM_setValue('reservedRight', gm.config.reservedRight)
          }

          _self.closeMenuItem('setting')
          if (type > 0) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭特殊状态
            setTimeout(() => {
              el.settingPage.removeAttribute('setting-type')
              el.maintitle.innerText = GM_info.script.name
              el.cancel.disabled = false
              el.shadow.removeAttribute('disabled')
            }, gm.const.fadeTime)
          }

          if (gm.config.reloadAfterSetting && needReload) {
            needReload = false
            location.reload()
          }
        }

        /**
         * 设置打开时执行
         */
        const onOpen = () => {
          for (const name in gm.configMap) {
            const attr = gm.configMap[name].attr
            el[name][attr] = gm.config[name]
          }
          for (const name in gm.configMap) {
            // 需要等所有配置读取完成后再进行选项初始化
            el[name].init && el[name].init()
          }

          el.settingPage.parentNode.style.display = 'block'
          setTimeout(() => {
            api.dom.setAbsoluteCenter(el.settingPage)
          }, 10)
        }

        /**
         * 保存配置
         * @param {string} name 配置名称
         * @param {string} attr 从对应元素的什么属性读取
         * @returns {boolean} 是否有实际更新
         */
        const saveConfig = (name, attr) => {
          const elValue = el[name][attr]
          if (gm.config[name] != elValue) {
            gm.config[name] = elValue
            GM_setValue(name, gm.config[name])
            return true
          }
          return false
        }
      }
    }

    /**
     * 打开防剧透 UP 主名单
     */
    openUploaderList() {
      const _self = this
      const el = {}
      if (gm.el.uploaderList) {
        _self.openMenuItem('uploaderList', null, true)
      } else {
        setTimeout(() => {
          initEditor()
          processItem()
          _self.openMenuItem('uploaderList', null, true)
        })

        /**
         * 初始化防剧透 UP 主名单编辑器
         */
        const initEditor = () => {
          gm.el.uploaderList = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.uploaderList.el = gm.el.uploaderList
          gm.el.uploaderList.className = 'gm-uploaderList'
          gm.el.uploaderList.innerHTML = `
            <div class="gm-uploaderList-page">
              <div class="gm-title">防剧透UP主名单</div>
              <div class="gm-comment">
                <div>当打开名单内UP主的视频时，会自动启用防剧透进度条。在下方文本框内填入UP主的UID，其中UID可在UP主的个人空间中找到。每行必须以UID开头，UID后可以用空格隔开进行注释。<b>第一行以&nbsp;&nbsp;*&nbsp;&nbsp;开头</b>时，匹配所有UP主。<span id="gm-uploader-list-example" class="gm-hint-option">点击填充示例。</span></div>
              </div>
              <div class="gm-list-editor">
                <textarea id="gm-uploaderList"></textarea>
              </div>
              <div class="gm-bottom">
                <button id="gm-save">保存</button>
                <button id="gm-cancel">取消</button>
              </div>
            </div>
            <div class="gm-shadow"></div>
          `
          el.uploaderListPage = gm.el.uploaderList.querySelector('.gm-uploaderList-page')
          el.uploaderList = gm.el.uploaderList.querySelector('#gm-uploaderList')
          el.uploaderListExample = gm.el.uploaderList.querySelector('#gm-uploader-list-example')
          el.save = gm.el.uploaderList.querySelector('#gm-save')
          el.cancel = gm.el.uploaderList.querySelector('#gm-cancel')
          el.shadow = gm.el.uploaderList.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          gm.menu.uploaderList.openHandler = onOpen
          el.uploaderListExample.onclick = () => {
            el.uploaderList.value = '# 非UID起始的行不会影响名单读取\n204335848 # 皇室战争电竞频道\n50329118 # 哔哩哔哩英雄联盟赛事'
          }
          el.save.onclick = onSave
          el.cancel.onclick = el.shadow.onclick = () => _self.closeMenuItem('uploaderList')
        }

        /**
         * 防剧透 UP 主名单保存时执行
         */
        const onSave = () => {
          gm.data.uploaderList(el.uploaderList.value)
          _self.closeMenuItem('uploaderList')
        }

        /**
         * 防剧透 UP 主名单打开时执行
         */
        const onOpen = () => {
          el.uploaderList.value = gm.data.uploaderList()
          api.dom.setAbsoluteCenter(el.uploaderListPage)
        }
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = confirm(`【${GM_info.script.name}】\n\n是否要初始化脚本？`)
      if (result) {
        const keyNoReset = {}
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
          if (!keyNoReset[gmKey]) {
            GM_deleteValue(gmKey)
          }
        }
        gm.configVersion = 0
        GM_setValue('configVersion', gm.configVersion)
        location.reload()
      }
    }


    /**
     * 对「打开菜单项」这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 打开菜单项后的回调函数
     * @param {boolean} [keepOthers] 打开时保留其他菜单项
     */
    openMenuItem(name, callback, keepOthers) {
      const _self = this
      if (!gm.menu[name].state) {
        for (const key in gm.menu) {
          /** @type {GMObject_menu_item} */
          const menu = gm.menu[key]
          if (key == name) {
            menu.state = true
            menu.openHandler && menu.openHandler.call(menu)
            api.dom.fade(true, menu.el, callback)
            if (document.fullscreenElement) {
              document.exitFullscreen()
            }
          } else if (!keepOthers) {
            if (menu.state) {
              _self.closeMenuItem(key)
            }
          }
        }
      }
    }

    /**
     * 对「关闭菜单项」这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 关闭菜单项后的回调函数
     */
    closeMenuItem(name, callback) {
      /** @type {GMObject_menu_item} */
      const menu = gm.menu[name]
      if (menu.state) {
        menu.state = false
        api.dom.fade(false, menu.el, () => {
          menu.closeHandler && menu.closeHandler.call(menu)
          callback && callback.call(menu)
        })
      }
    }
  }

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    constructor() {
      this.script = new Script()

      /**
       * 播放控制
       * @type {HTMLElement}
       */
      this.control = {}
      /**
       * 进度条
       * @typedef ProgressBar
       * @property {HTMLElement} root 进度条根元素
       * @property {HTMLElement} bar 进度条主体
       * @property {HTMLElement} slider 进度条滑槽块
       * @property {HTMLElement} thumb 进度条滑块
       * @property {HTMLElement} track 进度条滑槽
       * @property {HTMLElement} buffer 进度条缓冲显示
       * @property {HTMLElement} played 进度条已播放显示
       * @property {HTMLElement} preview 进度条预览
       */
      /**
       * 进度条
       * @type {ProgressBar}
       */
      this.progress = {}
      /**
       * 视频最底下的影子进度条
       * @type {HTMLElement}
       */
      this.shadowProgress = null
      /**
       * 用于模仿被隐藏的进度条滑槽
       * @type {HTMLElement}
       */
      this.fakeTrack = null
      /**
       * 用于模仿被隐藏的进度条滑槽中的已播放显示
       * @type {HTMLElement}
       */
      this.fakePlayed = null

      /**
       * 脚本控制条
       * @type {HTMLElement}
       */
      this.scriptControl = null

      /**
       * 是否开启防剧透功能
       * @type {boolean}
       */
      this.enabled = false
      /**
       * 当前 UP 主是否在防剧透名单中
       */
      this.uploaderEnabled = false

      /**
       * 通用方法
       */
      this.method = {
        /**
         * 获取 `aid`
         * @async
         * @returns {Promise<string>} `aid`
         */
        async getAid() {
          let aid
          try {
            if (unsafeWindow.aid) {
              aid = unsafeWindow.aid
            } else {
              aid = await api.wait.waitForConditionPassed({
                condition: async () => {
                  const message = await this.getVideoMessage()
                  return message && message.aid
                },
              })
            }
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
          return String(aid || '')
        },

        /**
         * 获取 `cid`
         * @async
         * @returns {Promise<string>} `cid`
         */
        async getCid() {
          let cid
          try {
            cid = await api.wait.waitForConditionPassed({
              condition: async () => {
                const message = await this.getVideoMessage()
                return message && message.cid
              },
            })
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
          return String(cid || '')
        },

        /**
         * 获取页面上的视频信息
         * @async
         * @returns {Object} `window.player.getVideoMessage()`
         */
        async getVideoMessage() {
          try {
            return await api.wait.waitForConditionPassed({
              condition: () => {
                const player = unsafeWindow.player
                return player && player.getVideoMessage && player.getVideoMessage()
              },
            })
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
        },

        /**
         * 获取视频信息
         * @async
         * @param {string} id `aid` 或 `bvid`
         * @param {'aid'|'bvid'} [type='bvid'] `id` 类型
         * @returns {Promise<JSON>} 视频信息
         */
        async getVideoInfo(id, type = 'bvid') {
          try {
            const resp = await api.web.request({
              method: 'GET',
              url: gm.url.api_videoInfo(id, type),
            })
            return JSON.parse(resp.responseText).data
          } catch (e) {
            api.logger.error(gm.error.NETWORK)
            api.logger.error(e)
          }
        },
      }
    }

    /**
     * 初始化页面内容
     * @async
     * @throws DOM 解析错误时抛出
     */
    async initWebpage() {
      const _self = this
      _self.uploaderEnabled = false
      _self.enabled = await _self.detectEnabled()

      const selector = {
        control: '.bilibili-player-video-control',
        progress: {
          root: '.bilibili-player-video-progress',
          bar: '.bilibili-player-video-progress-slider',
          slider: '.bui-track',
          thumb: '.bui-thumb',
          track: '.bui-bar-wrap, .bui-schedule-wrap',
          buffer: '.bui-bar-buffer, .bui-schedule-buffer',
          played: '.bui-bar-normal, .bui-schedule-current',
          preview: '.bilibili-player-video-progress-detail',
        },
        shadowProgress: '.bilibili-player-video-progress-shadow',
      }

      const initCore = async () => {
        _self.control = await api.wait.waitForElementLoaded(selector.control)
        _self.progress.root = await api.wait.waitForElementLoaded(selector.progress.root, _self.control)
        _self.progress.bar = await api.wait.waitForElementLoaded(selector.progress.bar, _self.progress.root)
        _self.progress.slider = await api.wait.waitForElementLoaded(selector.progress.slider, _self.progress.bar)
        // slider 在某些情况下被重新生成，监听到就重新处理
        // ob 一定要加在这个地方，放其他地方可能会错过时机！
        new MutationObserver((records, ob) => {
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (api.dom.containsClass(addedNode, selector.progress.slider)) {
                initCore()
                ob.disconnect()
                break
              }
            }
          }
        }).observe(_self.progress.bar, { childList: true })
        _self.progress.thumb = await api.wait.waitForElementLoaded(selector.progress.thumb, _self.progress.slider)
        _self.progress.track = await api.wait.waitForElementLoaded(selector.progress.track, _self.progress.slider)
        _self.progress.buffer = await api.wait.waitForElementLoaded(selector.progress.buffer, _self.progress.track)
        _self.progress.played = await api.wait.waitForElementLoaded(selector.progress.played, _self.progress.track)
        _self.progress.preview = await api.wait.waitForElementLoaded(selector.progress.preview, _self.progress.root)
        _self.shadowProgress = await api.wait.waitForElementLoaded(selector.shadowProgress, this.control)
  
        _self.fakeTrack = _self.progress.track.insertAdjacentElement('afterend', _self.progress.track.cloneNode(true)) // 必须在 thumb 前，否则 z 轴层次错误
        _self.fakeTrack.style.visibility = 'hidden'
        _self.fakeTrack.querySelector(selector.progress.buffer).style.visibility = 'hidden'
        _self.fakePlayed = _self.fakeTrack.querySelector(selector.progress.played)

        api.wait.waitForConditionPassed({
          condition: () => {
            // 不知道为什么，反正有时候原来的 thumb 被会替换成新的，而且用 MutationObserver 监听不到？！
            // 似乎最多只会变一次，暂时就只处理一次；如果后续发现会变多次，就在每次处理伪进度条时实时更新一次 thumb
            return _self.progress.thumb != _self.progress.bar.querySelector(selector.progress.thumb)
          },
        }).then(() => {
          _self.progress.thumb = _self.progress.bar.querySelector(selector.progress.thumb)
        }).catch(() => {})
      }

      await initCore()
      _self.initScriptControl()

      // 卡住，等条件通过才结束函数执行
      await api.wait.waitForConditionPassed({
        condition: () => {
          const player = unsafeWindow.player
          return player.getCurrentTime && player.getDuration
        },
      })
    }

    /**
     * 判断当前页面时是否自动启用功能
     * @async
     * @returns {boolean} 当前页面时是否自动启用功能
     */
    async detectEnabled() {
      const _self = this
      if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
        try {
          const ulSet = gm.data.uploaderListSet()
          if (ulSet.has('*')) {
            return true
          }
          const aid = await _self.method.getAid()
          const videoInfo = await _self.method.getVideoInfo(aid, 'aid')
          const uid = String(videoInfo.owner.mid)
          if (ulSet.has(uid)) {
            _self.uploaderEnabled = true
            return true
          }
        } catch (e) {
          api.logger.error(gm.error.NETWORK)
          api.logger.error(e)
        }
      } else if (api.web.urlMatch(gm.regex.page_bangumi)) {
        if (gm.config.bangumiEnabled) {
          return true
        }
      }
      return false
    }

    /**
     * 防剧透功能处理流程
     */
    processNoSpoil() {
      const _self = this
      setTimeout(() => {
        hideElementStatic()
        processContrlShow()
        core()
      })

      /**
       * 隐藏必要元素（相关设置修改后需刷新页面）
       */
      const hideElementStatic = () => {
        // 隐藏进度条预览
        if (_self.enabled) {
          _self.progress.preview.style.visibility = gm.config.disablePreview ? 'hidden' : 'visible'
        } else {
          _self.progress.preview.style.visibility = 'visible'
        }

        // 隐藏当前播放时间
        api.wait.waitForElementLoaded('.bilibili-player-video-time-now:not(.fake)').then(currentPoint => {
          if (_self.enabled && gm.config.disableCurrentPoint) {
            if (!currentPoint._fake) {
              currentPoint._fake = currentPoint.insertAdjacentElement('afterend', currentPoint.cloneNode(true))
              currentPoint._fake.innerText = '???'
              api.dom.addClass(currentPoint._fake, 'fake')
            }
            currentPoint.style.display = 'none'
            currentPoint._fake.style.display = 'unset'
          } else {
            currentPoint.style.display = 'unset'
            if (currentPoint._fake) {
              currentPoint._fake.style.display = 'none'
            }
          }
        }).catch(e => {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        })
        // 隐藏视频预览上的当前播放时间（鼠标移至进度条上显示）
        api.wait.waitForElementLoaded('.bilibili-player-video-progress-detail-time').then(currentPoint => {
          if (_self.enabled && gm.config.disableCurrentPoint) {
            currentPoint.style.visibility = 'hidden'
          } else {
            currentPoint.style.visibility = 'visible'
          }
        }).catch(e => {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        })

        // 隐藏视频时长
        api.wait.waitForElementLoaded('.bilibili-player-video-time-total:not(.fake)').then(duration => {
          if (_self.enabled && gm.config.disableDuration) {
            if (!duration._fake) {
              duration._fake = duration.insertAdjacentElement('afterend', duration.cloneNode(true))
              duration._fake.innerText = '???'
              api.dom.addClass(duration._fake, 'fake')
            }
            duration.style.display = 'none'
            duration._fake.style.display = 'unset'
          } else {
            duration.style.display = 'unset'
            if (duration._fake) {
              duration._fake.style.display = 'none'
            }
          }
        }).catch(e => {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        })
        // 隐藏「上次看到XX:XX 跳转播放」中的时间（可能存在）
        if (_self.enabled) {
          api.wait.waitForElementLoaded('.bilibili-player-video-toast-item-text').then(toast => {
            if (toast.innerText.indexOf('上次看到') >= 0 && toast.innerText.indexOf('???') < 0) {
              toast.innerHTML = toast.innerHTML.replace(/(?<=<span>)\d+:\d+(?=<\/span>)/, '???')
            }
          }).catch(() => {})
        }

        // 隐藏高能进度条的「热度」曲线（可能存在）
        api.wait.waitForElementLoaded('#bilibili_pbp', _self.control).then(pbp => {
          const hide = _self.enabled && gm.config.disablePbp
          pbp.style.visibility = hide ? 'hidden' : ''
        }).catch(() => {})

        // 隐藏 pakku 扩展引入的弹幕密度显示（可能存在）
        api.wait.waitForElementLoaded('canvas.pakku-fluctlight', _self.control).then(pakku => {
          const hide = _self.enabled && gm.config.disablePbp
          pakku.style.visibility = hide ? 'hidden' : ''
        }).catch(() => {})

        // 隐藏分P信息（番剧没有必要隐藏）
        if (gm.config.disablePartInformation && !api.web.urlMatch(gm.regex.page_bangumi)) {
          // 全屏播放时的分P选择
          if (_self.enabled) {
            api.wait.waitForElementLoaded('.bilibili-player-video-btn-menu').then(menu => {
              /** @type HTMLElement[] */
              const items = menu.querySelectorAll('.bilibili-player-video-btn-menu-list')
              for (let i = 0; i < items.length; i++) {
                items[i].innerText = 'P' + (i + 1)
              }
            }).catch(e => {
              api.logger.error(gm.error.DOM_PARSE)
              api.logger.error(e)
            })
          }
          // 全屏播放时显示的分P标题
          api.wait.waitForElementLoaded('.bilibili-player-video-top-title').then(el => {
            el.style.visibility = _self.enabled ? 'hidden' : 'visible'
          }).catch(e => {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          })
          // 播放页右侧分P选择
          if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
            api.wait.waitForElementLoaded('#multi_page').then(multiPage => {
              const hideTypes = [multiPage.querySelectorAll('.clickitem .part'), multiPage.querySelectorAll('.clickitem .duration')]
              for (const hideType of hideTypes) {
                for (const hideElement of hideType) {
                  hideElement.style.visibility = _self.enabled ? 'hidden' : 'visible'
                }
              }
              if (_self.enabled) {
                const links = multiPage.querySelectorAll('a')
                for (const link of links) {
                  link.title = '' // 隐藏提示信息
                }
              }
            }).catch(() => {})
          } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
            if (_self.enabled) {
              api.wait.waitForElementLoaded('.player-auxiliary-playlist-list').then(list => {
                const exec = () => {
                  /** @type HTMLElement[] */
                  const items = list.querySelectorAll('.player-auxiliary-playlist-item-p-item')
                  for (const item of items) {
                    if (/^P\d+\D/.test(item.innerText)) {
                      item.innerText = item.innerText.replace(/(?<=^P\d+)\D.*/, '')
                    }
                  }
                  // 如果 list 中发生修改，则重新处理
                  const obList = new MutationObserver((records, observer) => {
                    observer.disconnect()
                    exec()
                  })
                  obList.observe(list, { childList: true })
                }
                exec()
              }).catch(e => {
                api.logger.error(gm.error.DOM_PARSE)
                api.logger.error(e)
              })
            }
          }
        }
      }

      /**
       * 处理视频控制的显隐
       */
      const processContrlShow = () => {
        const addObserver = target => {
          if (!target._obPlayRate) {
            target._obPlayRate = new MutationObserver(records => {
              for (const record of records) {
                if (record.attributeName == 'style') {
                  _self.processFakePlayed()
                  break
                }
              }
            })
            target._obPlayRate.observe(_self.progress.thumb, { attributes: true })
          }
        }

        const clzControlShow = 'video-control-show'
        const playerArea = document.querySelector('.bilibili-player-area')
        if (!playerArea._obControlShow) {
          // 切换视频控制显隐时，添加或删除 ob 以控制伪进度条
          playerArea._obControlShow = new MutationObserver(records => {
            for (const record of records) {
              if (record.attributeName == 'class') {
                const before = api.dom.containsClass({ className: record.oldValue }, clzControlShow)
                const current = api.dom.containsClass(playerArea, clzControlShow)
                if (before != current) {
                  if (current) {
                    if (_self.enabled) {
                      core(true)
                      addObserver(playerArea)
                    }
                  } else if (playerArea._obPlayRate) {
                    playerArea._obPlayRate.disconnect()
                    playerArea._obPlayRate = null
                  }
                  break
                }
              }
            }
          })
          playerArea._obControlShow.observe(playerArea, {
            attributes: true,
            attributeOldValue: true,
          })
        }

        // 执行到此处时，若视频控制已处于显示状态，则直接添加 ob
        if (_self.enabled && api.dom.containsClass(playerArea, clzControlShow)) {
          addObserver(playerArea)
        }
      }

      /**
       * 防剧透处理核心流程
       * @param {boolean} [noPostpone] 不延后执行
       */
      const core = noPostpone => {
        try {
          let offset = 'offset'
          let playRate = 0
          if (_self.enabled) {
            const player = unsafeWindow.player
            playRate = player.getCurrentTime() / player.getDuration()
            offset = getEndPoint() - 100
            const reservedLeft = gm.config.reservedLeft
            const reservedRight = 100 - gm.config.reservedRight
            if (playRate * 100 < reservedLeft) {
              offset = 0
            } else {
              const offsetRate = playRate * 100 + offset
              if (offsetRate < reservedLeft) {
                offset = reservedLeft - playRate * 100
              } else if (offsetRate > reservedRight) {
                offset = reservedRight - playRate * 100
              }
            }
          } else if (_self.progress._noSpoil) {
            offset = 0
          }

          if (typeof offset == 'number') {
            const handler = () => {
              _self.progress.root.style.transform = `translateX(${offset}%)`
              _self.scriptControl.transform = `translateX(${-offset}%)`
              if (_self.enabled) {
                _self.fakeTrack.style.transform = `translateX(${-offset}%)`
              }
            }

            if (_self.enabled) {
              _self.progress.buffer.style.visibility = 'hidden'
              _self.progress.track.style.visibility = 'hidden'
              _self.shadowProgress.style.visibility = 'hidden'
              _self.fakeTrack.style.visibility = 'visible'

              if (noPostpone || !gm.config.postponeOffset) {
                handler()
              } else if (!_self.progress._noSpoil) { // 首次打开
                _self.progress.root.style.transform = 'translateX(0)'
                _self.scriptControl.transform = 'translateX(0)'
                _self.fakeTrack.style.transform = 'translateX(0)'
              }
              _self.processFakePlayed()

              _self.progress._noSpoil = true
            } else {
              _self.progress.track.style.visibility = 'visible'
              _self.progress.buffer.style.visibility = 'visible'
              _self.shadowProgress.style.visibility = 'visible'
              _self.fakeTrack.style.visibility = 'hidden'
              handler()

              _self.progress._noSpoil = false
            }
          }

          if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
            if (_self.uploaderEnabled) {
              _self.scriptControl.uploaderEnabled.setAttribute('enabled', '')
            } else {
              _self.scriptControl.uploaderEnabled.removeAttribute('enabled')
            }
          }
          if (api.web.urlMatch(gm.regex.page_bangumi)) {
            if (gm.config.bangumiEnabled) {
              _self.scriptControl.bangumiEnabled.setAttribute('enabled', '')
            } else {
              _self.scriptControl.bangumiEnabled.removeAttribute('enabled')
            }
          }
        } catch (e) {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        }
      }

      /**
       * 获取偏移后进度条尾部位置
       * @returns {number} 偏移后进度条尾部位置
       */
      const getEndPoint = () => {
        if (!_self.progress._noSpoil) {
          _self.progress._fakeRandom = Math.random()
        }
        let r = _self.progress._fakeRandom
        const origin = 100 // 左右分界点
        const left = gm.config.offsetLeft
        const right = gm.config.offsetRight
        const factor = gm.config.offsetTransformFactor
        const mid = left / (left + right) // 概率中点
        if (r <= mid) { // 向左偏移
          r = 1 - r / mid
          r **= factor
          return origin - r * left
        } else { // 向右偏移
          r = (r - mid) / (1 - mid)
          r **= factor
          return origin + r * right
        }
      }
    }

    /**
     * 初始化防剧透功能
     * @async
     * @param {boolean} [selfCall] 自调用
     */
    async initNoSpoil(selfCall) {
      const _self = this
      try {
        await _self.initWebpage()
        await _self.processNoSpoil()

        // 加载完页面后，有时候视频会莫名其妙地重新刷新，原因不明
        // 总之，先等一下看注入的内容还在，如果不再则重新初始化
        // 若没有发生刷新，则不必处理
        api.wait.executeAfterConditionPassed({
          condition: () => {
            const scriptControl = document.querySelector(`.${gm.id}-scriptControl`)
            return !scriptControl
          },
          callback: () => {
            _self.initNoSpoil()
          },
          interval: 250,
          timePadding: 1000,
        })
      } catch (e) {
        // 抛出异常，有可能确实是 B 站改版导致，但更多情况下，是因为网页还未加载完成导致的
        // 出现这种情况，往往是因为用户一次性打开多个页面，过了非常久之后才切换过去导致的
        try {
          if (selfCall) {
            throw e
          } else {
            const control = await api.wait.waitForElementLoaded('.bilibili-player-video-control')
            const ob = new MutationObserver((records, observer) => {
              observer.disconnect()
              _self.initNoSpoil(true)
            })
            ob.observe(control, {
              childList: true,
              subtree: true,
            })
          }
        } catch (e) {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        }
      }
    }

    /**
     * 初始化页面切换处理
     * @async
     */
    async initLocationChangeProcess() {
      const _self = this
      let currentPathname = location.pathname
      let currentCid = await _self.method.getCid()
      api.dom.createLocationchangeEvent()
      window.addEventListener('locationchange', function() {
        api.wait.waitForConditionPassed({
          condition: async () => {
            if (location.pathname == currentPathname) {
              // 并非切换视频（如切分 P）
              return currentCid
            } else {
              const cid = await _self.method.getCid()
              if (cid != currentCid) { // cid 改变才能说明页面真正切换过去
                currentPathname = location.pathname
                return cid
              }
            }
          },
        }).then(cid => {
          currentCid = cid
          _self.initNoSpoil()
          if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
            _self.initSwitchingPartProcess()
          }
        }).catch(e => {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        })
      })
    }

    /**
     * 初始化稍后再看模式播放页切换分 P 的处理
     * @async
     * @param {boolean} [selfCall] 自调用
     */
    async initSwitchingPartProcess(selfCall) {
      const _self = this
      try {
        let obActiveP, obList
        const list = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-list')
        try {
          const activeVideo = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-active', list)
          const pList = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-p-list', activeVideo)
          if (pList) {
            const activeP = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-p-item-active', pList)
            obActiveP = new MutationObserver(async (records, observer) => {
              for (const record of records) {
                if (record.attributeName == 'class') {
                  observer.disconnect()
                  obList && obList.disconnect()
                  const currentActive = await api.wait.waitForElementLoaded('.player-auxiliary-playlist-item-active')
                  if (currentActive === activeVideo) {
                    _self.initNoSpoil()
                    _self.initSwitchingPartProcess()
                  }
                  break
                }
              }
            })
            obActiveP.observe(activeP, { attributes: true })
          }
        } catch (e) {
          // 只是因为 list 已经变化，导致在原 list 下找不到对应的元素而已，实际并无错误
        }

        // 如果 list 中发生修改，则前面的监听无效，应当重新处理
        obList = new MutationObserver((records, observer) => {
          observer.disconnect()
          obActiveP && obActiveP.disconnect()
          _self.initSwitchingPartProcess(true)
        })
        obList.observe(list, { childList: true })
      } catch (e) {
        try {
          if (selfCall) {
            throw e
          } else {
            const rightContainer = await api.wait.waitForElementLoaded('.right-container')
            const ob = new MutationObserver((records, observer) => {
              observer.disconnect()
              _self.initSwitchingPartProcess(true)
            })
            ob.observe(rightContainer, {
              childList: true,
              subtree: true,
            })
          }
        } catch (e) {
          api.logger.error(gm.error.DOM_PARSE)
          api.logger.error(e)
        }
      }
    }

    /**
     * 初始化脚本控制条
     */
    initScriptControl() {
      const _self = this
      if (!_self.control._scriptControl) {
        _self.scriptControl = _self.progress.root.parentNode.appendChild(document.createElement('div'))
        _self.control._scriptControl = _self.scriptControl
        _self.scriptControl.className = `${gm.id}-scriptControl`
        _self.scriptControl.innerHTML = `
          <span id="${gm.id}-enabled">防剧透</span>
          <span id="${gm.id}-uploaderEnabled" style="display:none">将UP主加入防剧透名单</span>
          <span id="${gm.id}-bangumiEnabled" style="display:none">番剧自动启用防剧透</span>
          <span id="${gm.id}-setting" style="display:none">设置</span>
        `
      }

      _self.scriptControl.enabled = _self.scriptControl.querySelector(`#${gm.id}-enabled`)
      _self.scriptControl.uploaderEnabled = _self.scriptControl.querySelector(`#${gm.id}-uploaderEnabled`)
      _self.scriptControl.bangumiEnabled = _self.scriptControl.querySelector(`#${gm.id}-bangumiEnabled`)
      _self.scriptControl.setting = _self.scriptControl.querySelector(`#${gm.id}-setting`)

      // 临时将 z-index 调至底层，不要影响信息的显示
      // 不通过样式直接将 z-index 设为最底层，是因为会被 pbp 遮盖导致点击不了
      // 问题的关键在于，B 站已经给进度条和 pbp 内所有元素都设定好 z-index，只能用这种奇技淫巧来解决
      _self.progress.bar.addEventListener('mouseenter', function() {
        _self.scriptControl.style.zIndex = '-1'
      })
      _self.progress.bar.addEventListener('mouseleave', function() {
        _self.scriptControl.style.zIndex = ''
      })

      _self.scriptControl.enabled.handler = function() {
        if (_self.enabled) {
          this.setAttribute('enabled', '')
        } else {
          this.removeAttribute('enabled')
        }
        _self.processNoSpoil()
      }
      _self.scriptControl.enabled.onclick = function() {
        _self.enabled = !_self.enabled
        this.handler()
      }
      if (this.enabled) {
        _self.scriptControl.enabled.handler()
      }

      if (!gm.config.simpleScriptControl) {
        if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
          if (!gm.data.uploaderListSet().has('*')) { // * 匹配所有 UP 主不显示该按钮
            _self.scriptControl.uploaderEnabled.style.display = 'unset'
            _self.scriptControl.uploaderEnabled.onclick = async function() {
              try {
                const ulSet = gm.data.uploaderListSet() // 必须每次读取
                const aid = await _self.method.getAid()
                const videoInfo = await _self.method.getVideoInfo(aid, 'aid')
                const uid = String(videoInfo.owner.mid)

                _self.uploaderEnabled = !_self.uploaderEnabled
                if (_self.uploaderEnabled) {
                  this.setAttribute('enabled', '')
                  if (!ulSet.has(uid)) {
                    const ul = gm.data.uploaderList()
                    gm.data.uploaderList(`${ul}\n${uid}`)
                  }
                } else {
                  this.removeAttribute('enabled')
                  if (ulSet.has(uid)) {
                    let ul = gm.data.uploaderList()
                    ul = ul.replaceAll(new RegExp(`^${uid}(?=\\D|$).*\n?`, 'gm'), '')
                    gm.data.uploaderList(ul)
                  }
                }
              } catch (e) {
                api.logger.error(gm.error.NETWORK)
                api.logger.error(e)
              }
            }
          }
        }

        if (api.web.urlMatch(gm.regex.page_bangumi)) {
          _self.scriptControl.bangumiEnabled.style.display = 'unset'
          _self.scriptControl.bangumiEnabled.onclick = function() {
            gm.config.bangumiEnabled = !gm.config.bangumiEnabled
            if (gm.config.bangumiEnabled) {
              this.setAttribute('enabled', '')
            } else {
              this.removeAttribute('enabled')
            }
            GM_setValue('bangumiEnabled', gm.config.bangumiEnabled)
          }
        }

        _self.scriptControl.setting.style.display = 'unset'
        _self.scriptControl.setting.onclick = function() {
          _self.script.openUserSetting()
        }
      }
    }

    /**
     * 更新用于模拟已播放进度的伪已播放条
     */
    processFakePlayed() {
      const _self = this
      if (!_self.enabled) {
        return
      }
      try {
        const player = unsafeWindow.player
        const playRate = player.getCurrentTime() / player.getDuration()
        let offset
        const m = _self.progress.root.style.transform.match(/(?<=translateX\()[^)]+(?=\))/)
        if (m && m.length > 0) {
          offset = m[0]
        } else {
          offset = 0
        }
        offset = parseFloat(offset)
        // 若处于播放进度小于左侧预留区的特殊情况，不要进行处理
        // 注意，一旦离开这种特殊状态，就再也不可能进度该特殊状态了，因为这样反而会暴露信息
        if (offset !== 0) {
          let reservedZone = false
          let offsetPlayRate = offset + playRate * 100
          const reservedLeft = gm.config.reservedLeft
          const reservedRight = 100 - gm.config.reservedRight
          // 当实际播放进度小于左侧保留区时，不作特殊处理，因为这样反而会暴露信息
          if (offsetPlayRate < reservedLeft) {
            offset += reservedLeft - offsetPlayRate
            reservedZone = true
          } else if (offsetPlayRate > reservedRight) {
            offset -= offsetPlayRate - reservedRight
            reservedZone = true
          }
          if (reservedZone) {
            _self.progress.root.style.transform = `translateX(${offset}%)`
            _self.scriptControl.transform = `translateX(${-offset}%)`
            _self.fakeTrack.style.transform = `translateX(${-offset}%)`
          }
        }
        _self.fakePlayed.style.transform = `scaleX(${playRate + offset / 100})`
      } catch (e) {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
      }
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      GM_addStyle(`
        :root {
          --control-item-selected-color: #00c7ff;
          --control-item-shadow-color: #00000050;
          --text-color: black;
          --text-bold-color: #3a3a3a;
          --light-text-color: white;
          --hint-text-color: gray;
          --hint-text-hightlight-color: #555555;
          --background-color: white;
          --background-hightlight-color: #ebebeb;
          --update-hightlight-color: #c2ffc2;
          --update-hightlight-hover-color: #a90000;
          --border-color: black;
          --shadow-color: #000000bf;
          --hightlight-color: #0075FF;
          --important-color: red;
          --warn-color: #e37100;
          --disabled-color: gray;
          --link-visited-color: #551a8b;
          --opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
        }

        .${gm.id}-scriptControl {
          position: absolute;
          left: 0;
          bottom: 0;
          color: var(--light-text-color);
          margin-bottom: 1em;
          font-size: 13px;
          z-index: 10000;
        }

        .${gm.id}-scriptControl > * {
          cursor: pointer;
          border: 1px solid;
          border-radius: 0.4em;
          padding: 0.1em 0.3em;
          margin: 0 0.1em;
          background-color: var(--control-item-shadow-color);
        }
        .${gm.id}-scriptControl > *[enabled] {
          color: var(--control-item-selected-color);
        }

        #${gm.id} {
          color: var(--text-color);
        }

        #${gm.id} .gm-setting {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 10000;
          user-select: none;
        }

        #${gm.id} .gm-setting #gm-setting-page {
          background-color: var(--background-color);
          border-radius: 10px;
          z-index: 65535;
          min-width: 42em;
          padding: 1em 1.4em;
          transition: top 100ms, left 100ms;
        }

        #${gm.id} .gm-setting #gm-maintitle * {
          cursor: pointer;
          color: var(--text-color);
        }
        #${gm.id} .gm-setting #gm-maintitle:hover * {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting .gm-items {
          margin: 0 0.2em;
          padding: 0 1.8em 0 2.2em;
          font-size: 1.2em;
          max-height: 66vh;
          overflow-y: auto;
        }

        #${gm.id} .gm-setting table {
          width: 100%;
          border-collapse: separate;
        }
        #${gm.id} .gm-setting td {
          position: relative;
        }
        #${gm.id} .gm-setting .gm-item td:first-child {
          vertical-align: top;
          padding-right: 0.6em;
          font-weight: bold;
          color: var(--text-bold-color);
        }
        #${gm.id} .gm-setting .gm-item:not(:first-child) td {
          padding-top: 0.5em;
        }
        #${gm.id} .gm-setting td > * {
          padding: 0.2em;
          border-radius: 0.2em;
        }

        #${gm.id} .gm-setting .gm-item:hover {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting .gm-subitem[disabled] {
          color: var(--disabled-color);
        }
        #${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting label {
          display: flex;
          align-items: center;
        }
        #${gm.id} .gm-setting input[type=checkbox] {
          margin-left: auto;
        }
        #${gm.id} .gm-setting input[type=text] {
          float: right;
          border-width: 0 0 1px 0;
          width: 2.4em;
          text-align: right;
          padding: 0 0.2em;
          margin: 0 -0.2em;
        }
        #${gm.id} .gm-setting select {
          border-width: 0 0 1px 0;
          cursor: pointer;
          margin: 0 -0.2em;
        }

        #${gm.id} .gm-setting .gm-information {
          margin: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-setting [disabled] .gm-information {
          cursor: not-allowed;
        }

        #${gm.id} .gm-setting .gm-warning {
          position: absolute;
          right: -1.1em;
          color: var(--warn-color);
          font-size: 1.4em;
          line-height: 1em;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          cursor: pointer;
        }

        #${gm.id} .gm-uploaderList {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 12000;
          user-select: none;
        }

        #${gm.id} .gm-uploaderList .gm-uploaderList-page {
          background-color: var(--background-color);
          border-radius: 10px;
          z-index: 65535;
          width: 36em;
          height: 40em;
          transition: top 100ms, left 100ms;
        }

        #${gm.id} .gm-uploaderList .gm-comment {
          margin: 0 2em;
          color: var(--hint-text-color);
          text-indent: 2em;
        }

        #${gm.id} .gm-uploaderList .gm-list-editor {
          margin: 1em 2em 1em 2em;
        }

        #${gm.id} .gm-uploaderList .gm-list-editor textarea {
          font-size: 1.3em;
          width: calc(100% - 2em);
          height: 15.2em;
          padding: 1em;
          resize: none;
          outline: none;
        }

        #${gm.id} .gm-bottom {
          margin: 1.4em 2em 1em 2em;
          text-align: center;
        }

        #${gm.id} .gm-bottom button {
          font-size: 1em;
          padding: 0.3em 1em;
          margin: 0 0.8em;
          cursor: pointer;
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 2px;
        }
        #${gm.id} .gm-bottom button:hover {
          background-color: var(--background-hightlight-color);
        }
        #${gm.id} .gm-bottom button[disabled] {
          cursor: not-allowed;
          border-color: var(--disabled-color);
          background-color: var(--background-color);
        }

        #${gm.id} .gm-hint-option {
          font-size: 0.8em;
          color: var(--hint-text-color);
          text-decoration: underline;
          padding: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-hint-option:hover {
          color: var(--important-color);
        }
        #${gm.id} [disabled] .gm-hint-option {
          color: var(--disabled-color);
          cursor: not-allowed;
        }

        #${gm.id} #gm-reset {
          position: absolute;
          right: 0;
          bottom: 0;
          margin: 1em 1.6em;
          color: var(--hint-text-color);
          cursor: pointer;
        }

        #${gm.id} #gm-changelog {
          position: absolute;
          right: 0;
          bottom: 1.8em;
          margin: 1em 1.6em;
          color: var(--hint-text-color);
          cursor: pointer;
        }
        #${gm.id} [setting-type=updated] #gm-changelog {
          font-weight: bold;
          color: var(--important-color);
        }
        #${gm.id} [setting-type=updated] #gm-changelog:hover {
          color: var(--important-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated,
        #${gm.id} [setting-type=updated] .gm-updated input,
        #${gm.id} [setting-type=updated] .gm-updated select {
          background-color: var(--update-hightlight-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated option {
          background-color: var(--background-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated:hover {
          color: var(--update-hightlight-hover-color);
        }

        #${gm.id} #gm-reset:hover,
        #${gm.id} #gm-changelog:hover {
          color: var(--hint-text-hightlight-color);
          text-decoration: underline;
        }

        #${gm.id} .gm-title {
          font-size: 1.6em;
          margin: 1.6em 0.8em 0.8em 0.8em;
          text-align: center;
        }

        #${gm.id} .gm-subtitle {
          font-size: 0.4em;
          margin-top: 0.4em;
        }

        #${gm.id} .gm-shadow {
          background-color: var(--shadow-color);
          position: fixed;
          top: 0%;
          left: 0%;
          z-index: 10000;
          width: 100%;
          height: 100%;
        }
        #${gm.id} .gm-shadow[disabled] {
          cursor: auto;
        }

        #${gm.id} label {
          cursor: pointer;
        }

        #${gm.id} input,
        #${gm.id} select,
        #${gm.id} button {
          color: var(--text-color);
          outline: none;
          border-radius: 0;
          appearance: auto; /* 番剧播放页该项被覆盖 */
        }

        #${gm.id} a {
        color: var(--hightlight-color)
        }
        #${gm.id} a:visited {
        color: var(--link-visited-color)
        }

        #${gm.id} [disabled],
        #${gm.id} [disabled] input,
        #${gm.id} [disabled] select {
          cursor: not-allowed;
          color: var(--disabled-color);
        }

        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar,
        #${gm.id} .gm-uploaderList .gm-list-editor textarea::-webkit-scrollbar {
          width: 6px;
          height: 6px;
          background-color: var(--scrollbar-background-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-thumb,
        #${gm.id} .gm-uploaderList .gm-list-editor textarea::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background-color: var(--scrollbar-thumb-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-corner,
        #${gm.id} .gm-uploaderList .gm-list-editor textarea::-webkit-scrollbar-corner {
          background-color: var(--scrollbar-background-color);
        }
      `)
    }
  }

  (function() {
    const script = new Script()
    const webpage = new Webpage()

    script.init()
    script.addScriptMenu()

    webpage.initNoSpoil()
    webpage.initLocationChangeProcess()
    if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      webpage.initSwitchingPartProcess()
    }
    webpage.addStyle()
  })()
})()
