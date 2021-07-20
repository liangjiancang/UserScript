// ==UserScript==
// @name            [DEBUG] 信息显式化
// @version         2.2.0.20210720
// @namespace       laster2800
// @author          Laster2800
// @description     用 alert() 提示符合匹配规则的日志或未捕获异常，帮助开发者在日常使用网页时发现潜藏问题
// @homepage        https://greasyfork.org/zh-CN/scripts/429521
// @supportURL      https://greasyfork.org/zh-CN/scripts/429521/feedback
// @license         LGPL-3.0
// @include         *
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           unsafeWindow
// @run-at          document-start
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    config: {},
    fn: {
      /**
       * 获取封装日志函数
       * @param {Object} console 控制台对象
       * @param {Function} log 日志函数
       * @param {string} type 类型
       * @param {string} [source] 源
       * @returns 封装日志函数
       */
      wrappedLog(console, log, type, source) {
        const config = gm.config
        const fn = gm.fn
        return function() {
          log.apply(console, arguments)
          if (config.enabled) {
            const m = [arguments, type]
            if (fn.match(m, config.include) && !fn.match(m, config.exclude)) {
              let msg = null
              if (arguments.length == 1) {
                if (typeof arguments[0] == 'object') {
                  msg = JSON.stringify(arguments[0], null, 2)
                } else {
                  msg = arguments[0]
                }
              } else {
                msg = JSON.stringify(arguments, null, 2)
              }
              fn.explicit(msg, type, source)
            }
          }
        }
      },
      /**
       * 显式地显示信息
       * @param {*} msg 信息
       * @param {string} [type] 类型
       * @param {string} [source] 源
       */
      explicit(msg, type, source) {
        alert(`【${GM_info.script.name}】${type ? `\nTYPE: ${type}` : ''}${source ? `\nSOURCE: ${source}` : ''}\n\n${msg}`)
      },
      /**
       * @param {*} obj 匹配对象
       * @param {RegExp} regex 匹配正则表达式
       * @param {number} [depth=5] 匹配查找深度
       * @returns {boolean} 是否匹配成功
       */
      match(obj, regex, depth = 5) {
        if (obj && regex && depth > 0) {
          return _inner(obj, depth, new Set())
        } else {
          return false
        }

        function _inner(obj, depth, objSet) {
          if (!obj) return false
          for (const key in obj) {
            if (regex.test(key)) {
              return true
            } else {
              try {
                const value = obj[key]
                if (value && (typeof value == 'object' || typeof value == 'function')) {
                  if (regex.test(value.toString())) {
                    return true
                  } else if (depth > 1) {
                    if (!objSet.has(value)) {
                      objSet.add(value)
                      if (_inner(value, depth - 1)) {
                        return true
                      }
                    }
                  }
                } else if (regex.test(String(value))) {
                  return true
                }
              } catch (e) {
                // value that cannot be accessed
              }
            }
          }
          return false
        }
      },
    },
  }
  unsafeWindow.gm429521 = gm

  try {
    const df = { include: '.*', exclude: '^LOG$' }
    const gmInclude = GM_getValue('include') ?? df.include
    const gmExclude = GM_getValue('exclude') ?? df.exclude
    gm.config.enabled = GM_getValue('enabled') ?? true
    gm.config.include = gmInclude ? new RegExp(gmInclude) : null
    gm.config.exclude = gmExclude ? new RegExp(gmExclude) : null
    // 日志
    const console = unsafeWindow.console
    for (const n of ['log', 'warn', 'error']) {
      console[n] = gm.fn.wrappedLog(console, console[n], n.toUpperCase())
    }
    // 未捕获异常
    unsafeWindow.addEventListener('error', function(event) { // 正常
      if (!gm.config.enabled) return
      const m = [event.message, event.filename, 'Uncaught Exception (Normal)']
      if (gm.fn.match(m, gm.config.include) && !gm.fn.match(m, gm.config.exclude)) {
        gm.fn.explicit(event.message, 'Uncaught Exception (Normal)')
      }
    })
    unsafeWindow.addEventListener('unhandledrejection', function(event) { // from Promise
      if (!gm.config.enabled) return
      const m = [event.reason, 'Uncaught Exception (in Promise)']
      if (gm.fn.match(m, gm.config.include) && !gm.fn.match(m, gm.config.exclude)) {
        gm.fn.explicit(event.reason, 'Uncaught Exception (in Promise)')
      }
    })

    // 菜单
    if (self == top) { // frame 中不要执行
      const initScriptMenu = () => {
        const menuId = {}
        menuId.enabled = GM_registerMenuCommand(`当前${gm.config.enabled ? '开启' : '关闭'}`, () => {
          try {
            gm.config.enabled = confirm(`【${GM_info.script.name}】\n\n「确定」以开启功能，「取消」以关闭功能。`)
            GM_setValue('enabled', gm.config.enabled)
            for (const id in menuId) {
              GM_unregisterMenuCommand(menuId[id])
            }
            initScriptMenu()
          } catch (e) {
            gm.fn.explicit(e)
          }
        })
        menuId.filter = GM_registerMenuCommand('设置过滤器', () => {
          try {
            const sInclude = prompt(`【${GM_info.script.name}】\n\n设置匹配过滤器：`, gm.config.include?.source ?? df.include)
            if (typeof sInclude == 'string') {
              gm.config.include = sInclude ? new RegExp(sInclude) : null
              GM_setValue('include', sInclude)
            }
            const sExclude = prompt(`【${GM_info.script.name}】\n\n设置排除过滤器：`, gm.config.exclude?.source ?? df.exclude)
            if (typeof sExclude == 'string') {
              gm.config.exclude = sExclude ? new RegExp(sExclude) : null
              GM_setValue('exclude', sExclude)
            }
          } catch (e) {
            gm.fn.explicit(e)
          }
        })
        menuId.help = GM_registerMenuCommand('使用说明', () => window.open('https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitMessage#使用说明'))
      }
      initScriptMenu()
    }
  } catch (e) {
    gm.fn.explicit(e)
  }
})()