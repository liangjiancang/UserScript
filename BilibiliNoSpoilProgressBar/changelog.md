# [B站防剧透进度条](https://greasyfork.org/zh-CN/scripts/411092) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/BilibiliNoSpoilProgressBar/BilibiliNoSpoilProgressBar.js)。

## V1.1

1. 脚本：修复打开播放页面后长时间放置而没有切换过去，导致脚本逻辑注入失败的问题。
2. 防剧透机制：修改进度条偏移与播放进度的耦合关系，现在播放进度不再直接影响偏移量的大小。
3. 功能实现：延后进度条偏移的时间点，用于防止用户从视觉上直观推测出偏移方向与偏移量。
4. 防剧透进度条：调整默认参数，加强默认的防剧透强度。

## V1.0

1. 功能实现：视频播放页、番剧播放页实现防剧透进度条。
2. 功能实现：防剧透 UP 主名单。
3. 功能实现：番剧自动启用防剧透进度条。