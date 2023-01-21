# [[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)

相关脚本：**[[DEBUG] 对象观察器](https://greasyfork.org/zh-CN/scripts/430945)**、**[[DEBUG] 异常诱因日志](https://greasyfork.org/zh-CN/scripts/432924)**、**[[DEBUG] 网页内容编辑模式 (DesignMode)](https://greasyfork.org/zh-CN/scripts/430949)**

其他脚本：**[B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)**、**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)**、**[B站点赞批量取消](https://greasyfork.org/zh-CN/scripts/445754)**、**[S1战斗力屏蔽](https://greasyfork.org/zh-CN/scripts/394407)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

用 `alert()` 提示符合匹配规则的日志或未捕获异常，帮助开发者在日常使用网页时发现潜藏问题。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/ExplicitMessage/changelog.md)。

## 使用说明

* 正则匹配

  * 区分大小写。
  * 不必考虑转义。

* 日志

  * 可用 `LOG` / `DEBUG` / `INFO` / `WARN` / `ERROR` 作为匹配目标，匹配对应方法打印出来的日志。

    如用 `^LOG$` 作为排除过滤器排除所有用 `console.log()` 打印出来的日志，用 `^(LOG|DEBUG|INFO|WARN|ERROR)$` 作为排除过滤器排除所有日志。

  * 无法捕获到非直接通过全局控制台对象 `console` 打印出来的日志。

    **非 `@grant none` 脚本获取到的控制台对象（至少）是脚本管理器提供的代理对象，其打印出来的日志须结合 [[DEBUG] 信息显式化（注入版）](https://greasyfork.org/zh-CN/scripts/429525) 使用才能捕获。`@grant none` 脚本则没有必要也无法使用注入版。**

    **注意：注入版基于主脚本的设置及代码工作，只有安装并开启主脚本时，注入版才会开始工作！**

* 未捕获异常（常规）

  * 可用 `Uncaught Exception (Normal)` 作为匹配目标。

    如简单地用 `cau` 来过滤出所有未捕获异常，但可能混杂带 `cau` 信息的日志。

  * 可用抛出异常的脚本文件的文件名作为匹配目标。

    此处「脚本文件」为浏览器实际访问的最终文件。例如用 webpack 将 `a.js`、`b.js` 打包为 `example.js`。若在 `a.js` 中抛出异常，且 sourcemap 可用，则浏览器会在控制台中提示异常位置为 `a.js`。但是在脚本捕获到的 `ErrorEvent` 中，错误位置只能是 `example.js`，在配置脚本时应该用 `example\.js` 来匹配或排除这样的异常。

* 未捕获异常（Promise）

  * 可用 `Uncaught Exception (in Promise)` 作为匹配目标。

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 85，Firefox 版本不小于 90。
* 脚本管理器可对特定脚本的匹配规则进行自定义。若要保持该脚本常开，建议关闭「原始包括」并添加需要的「用户包括」（以 Tampermonkey 为例）。

  ![匹配设置](https://gitee.com/liangjiancang/userscript/raw/master/script/ExplicitMessage/screenshot/匹配设置-p)

## 截图

* 脚本设置

    ![脚本设置](https://gitee.com/liangjiancang/userscript/raw/master/script/ExplicitMessage/screenshot/脚本设置-p)

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitMessage) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/ExplicitMessage)** - *by Laster2800*
