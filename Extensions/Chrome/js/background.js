
var historyLoadedEvent = new Event('onHistoryLoaded')

class HistoryLoader {
  constructor() {
    this.visits = [ ]
    this.orgs = { }
    this.isLoaded = false
    this.loadData()
  }

  getSearchCriteria() {
    const now = new Date().getTime()
    const rangeDays = 7
    const millisPerDay = 24 * 60 * 60 * 1000
    return {
      text: 'https://github.com',
      maxResults: 10000,
      startTime: now - (rangeDays * millisPerDay),
      endTime: now
    }
  }

  buildVisit(v) {
    return {
      title: v.title,
      url: v.url,
      parts: v.url.split('/')
    }
  }

  loadData() {
    chrome.history.search(this.getSearchCriteria(), (v) => {
      v.map(this.buildVisit)
       .filter(v => v.title && v.url && v.parts[2] === 'github.com')
       .forEach(v => { this.visits.push(v) })
      console.log('dispatching ' + historyLoadedEvent)
      this.isLoaded = true
      window.dispatchEvent(historyLoadedEvent)
    })
  }
}

data = new HistoryLoader()
