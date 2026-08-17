const app = document.getElementById('app')
let compact = false

app.style.cssText = 'padding:18px;line-height:1.55;color:#35312d'

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

async function render() {
  const chapters = await txxt.workspace.listChapters()
  const body = chapters.filter((chapter) => chapter.wordCount > 0)
  const total = body.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  const longest = body.slice().sort((a, b) => b.wordCount - a.wordCount)[0]
  const average = body.length ? Math.round(total / body.length) : 0
  const rows = compact ? body.slice(0, 5) : body
  app.innerHTML = `<h2 style="margin:0 0 4px;font-size:18px">章节洞察</h2><p style="margin:0 0 16px;color:#716b63">当前作品的章节节奏概览</p><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:16px"><div style="padding:10px;background:#f3eee7"><strong>${body.length}</strong><br><small>已写章节</small></div><div style="padding:10px;background:#f3eee7"><strong>${total.toLocaleString()}</strong><br><small>总字数</small></div><div style="padding:10px;background:#f3eee7"><strong>${average.toLocaleString()}</strong><br><small>平均字数</small></div></div><p style="margin:0 0 10px;color:#716b63">${longest ? `最长章节：${escapeHtml(longest.title)}（${longest.wordCount.toLocaleString()} 字）` : '还没有可统计的章节'}</p><div>${rows.map((chapter) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid #e5ddd3"><span>${escapeHtml(chapter.title)}</span><strong>${chapter.wordCount.toLocaleString()}</strong></div>`).join('')}</div>`
}

async function initialize() {
  const settings = await txxt.plugin.getSettings()
  compact = settings && settings.compact === true
  await txxt.ui.registerPanel({ id: 'insights' })
  await txxt.commands.register({ id: 'refresh', title: '刷新统计' })
  await txxt.commands.register({ id: 'toggle-compact', title: '切换精简列表' })
  await render()
}

txxt.events.on('panel.show', () => render().catch((error) => txxt.ui.notify(error.message)))
txxt.events.on('command.execute', ({ id }) => {
  if (id === 'refresh') render().catch((error) => txxt.ui.notify(error.message))
  if (id === 'toggle-compact') { compact = !compact; txxt.plugin.setSettings({ compact }).then(render).catch((error) => txxt.ui.notify(error.message)) }
})
initialize().catch((error) => { app.textContent = `插件启动失败：${error.message}` })
