
chrome.webNavigation.onHistoryStateUpdated.addListener((e) => {
  chrome.tabs.get(e.tabId, (t) => {
    const background = chrome.extension.getBackgroundPage()
    if (background.historic === undefined) return
    const visit = background.historic.buildVisit({title: t.title, url: e.url})
    if (visit !== null) {
      background.historic.addVisit(background.historic.orgs, visit)
      background.dispatchEvent(new Event('onHistoryLoaded'))
    }
  })
})
