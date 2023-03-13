// ==UserScript==
// @name            S1战斗力屏蔽
// @version         3.9.5.20230314
// @namespace       laster2800
// @author          Laster2800
// @description     屏蔽S1的战斗力系统，眼不见为净
// @icon            https://www.saraba1st.com/favicon.ico
// @noframes
// @homepageURL     https://greasyfork.org/zh-CN/scripts/394407
// @supportURL      https://greasyfork.org/zh-CN/scripts/394407/feedback
// @license         LGPL-3.0
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=1161014
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=1161015
// @include         *.saraba1st.com/*
// @exclude         *.saraba1st.com/2b/search*
// @grant           none
// @run-at          document-start
// @compatible      edge 版本不小于 93
// @compatible      chrome 版本不小于 93
// @compatible      firefox 版本不小于 92
// ==/UserScript==

(function() {
  'use strict'

  const gmId = 'gm394407'
  const enabledAttr = `${gmId}-enabled`
  const enabledSelector = `body[${enabledAttr}]`

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gmId,
    label: GM_info.script.name,
  })

  function replaceTitle() {
    // eslint-disable-next-line no-irregular-whitespace
    const reg = /^(【新提醒】|【　　　】)/
    if (reg.test(document.title)) {
      document.title = document.title.replace(reg, '')
    }
  }

  (function() {
    api.wait.$('body').then(body => {
      body.setAttribute(enabledAttr, '')
    })

    // 在导航栏中加入脚本开关
    api.wait.$('#nv').then(nv => {
      const sw = document.createElement('label')
      sw.innerHTML = `
        <span>战斗力系统</span>
        <input type="checkbox" style="vertical-align:middle">
      `
      sw.style = 'float:right;padding:0 15px;height:33px;line-height:33px;font-weight:bold;font-size:1.2em;user-select:none'
      nv.append(sw)

      sw.enabled = true
      sw.lastElementChild.addEventListener('click', () => {
        const enabled = !sw.enabled
        const { body } = document
        if (enabled) {
          body.setAttribute(enabledAttr, '')
        } else {
          body.removeAttribute(enabledAttr)
        }
        sw.enabled = enabled
      })
    })

    // 系统提醒
    // 在正式处理之前，通过样式将该隐藏的隐藏住，避免被用户观察到
    api.base.addStyle(`
      #myprompt.new {
        background: url(https://static.saraba1st.com/image/s1/arrwd.gif) no-repeat 100% 50%;
        background-position: 3px 50%;
        color: #444;
        font-weight: unset;
      }
      #myprompt_menu {
        visibility: hidden;
      }
    `)
    api.wait.$('#myprompt_menu').then(menu => {
      // 有系统提醒时，每次打开页面时都会弹出一个通知面板
      // 点击网页提供的关闭按键后，此面板在有新提醒前不会再次弹出
      // 注意，需在 menu.initialized 为 true 后点击关闭按键
      const p1 = api.wait.$('.ignore_notice', document, true).then(ignore_notice => api.wait.waitForConditionPassed({
        condition: () => menu.getAttribute('initialized') === 'true' && ignore_notice,
        interval: 25,
      })).then(ignore_notice => ignore_notice.click()).catch(() => {}) // 没有通知时，没有捕获到是正常的

      // 有系统提醒处于未读状态时，相关位置会有高亮显示，网页标题也会有所不同
      // 将这些差异化显示，在用户没有反应出来之前去除
      const p2 = api.wait.$('#myprompt').then(menu_button => {
        const menu_mypost = menu.querySelector('.notice_mypost') // 右上角面板「我的帖子」
        const menu_system = menu.querySelector('.notice_system') // 右上角面板「系统提醒」
        if (menu_mypost || menu_system) {
          menu_button.textContent = '提醒'
          menu_button.className = 'a showmenu'
          api.wait.$('title', document.head).then(title => {
            // 常规情况下，此时 title 仍未被改变，添加一个 ob 来跟踪变化
            const ob = new MutationObserver(replaceTitle)
            ob.observe(title, { childList: true })
            // 若在后台打开新页面后很长时间都不切换过去，则切换过去时 title 可能已发生变化需立即处理
            replaceTitle()
          })
        }
        menu_system?.parentElement.parentElement.remove()
      })

      // 无意关心 p1 和 p2 死活，只要都处理完就还原为可见状态（要留点缓冲时间）
      Promise.allSettled([p1, p2]).then(() => setTimeout(() => {
        menu.style.visibility = 'visible'
      }, 50))
    })

    api.base.addStyle(`
      /* 右上角「积分」的弹出面板移除 */
      #extcreditmenu {
        background: none;
        padding-right: 1em;
      }
      /* 帖子列表中，加分或减分帖子后的大拇指标志 */
      ${enabledSelector} img[alt=agree],
      ${enabledSelector} img[alt=disagree] {
        display: none;
      }
    `)
    // 右上角「积分」的弹出面板移除
    api.wait.$('#extcreditmenu').then(extcreditmenu => {
      extcreditmenu.className = ''
      extcreditmenu.onmouseover = null
    })

    if (api.base.urlMatch(/thread-|mod=viewthread/)) {
      api.base.addStyle(`
        /* 层主头像下方的战斗力显示 */
        ${enabledSelector} .favatar > .tns.xg2 > table tr > th:nth-child(2) {
          display: none;
        }
        /* 鼠标悬浮在层主头像时，浮动面板中包含战斗力显示的一栏 */
        ${enabledSelector} .favatar > .p_pop > .i.y > .cl > p:nth-child(2) {
          display: none;
        }
        /* 楼层评分 */
        ${enabledSelector} .plhin tr:first-child > .plc > .pct > .pcb > .psth,
        ${enabledSelector} .plhin tr:first-child > .plc > .pct > .pcb > .rate {
          display: none;
        }
      `)
    } else if (api.base.urlMatch(/ac=credit/)) {
      // [设置 > 积分] 页面中的相关项屏蔽
      api.base.addStyle(`
        /* [我的积分] 页中战斗力显示 */
        ${enabledSelector} #ct .creditl > li:nth-child(2),
        /* [我的积分] 页中的 [积分显示] */
        ${enabledSelector} #ct .dt.mtm,
        /* [积分记录] */
        ${enabledSelector} #ct li:nth-child(4) {
          display: none;
        }
      `)
    } else if (api.base.urlMatch(/mod=space(&|$)/)) { // 「个人主页」或「通知」页面
      // 屏蔽个人资料中的战斗力显示
      if (api.base.urlMatch(/do=profile/)) {
        api.base.addStyle(`
          ${enabledSelector} #psts > ul > li:nth-child(3) {
            display: none;
          }
        `)
      }

      // 如果当前在 [通知 > 系统提醒]，重定向
      if (api.base.urlMatch(/view=system/)) {
        location.replace('https://bbs.saraba1st.com/2b/home.php?mod=space&do=pm')
      }
      // [通知 > 系统提醒] 整项屏蔽
      api.base.addStyle(`
        ${enabledSelector} #ct > .appl > .tbn > ul > li:nth-child(4) {
          display: none;
        }
      `)
    } else if (api.base.urlMatch(/space-uid-/)) {
      // 屏蔽用户主页中的战斗力显示
      api.base.addStyle(`
        ${enabledSelector} #psts > ul > li:nth-child(3) {
          display: none;
        }
      `)
    }
  })()
})()
