
var historyLoadedEvent = new Event('onHistoryLoaded')

export default class HistoryLoader {
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
    const parts = v.url.split('/')
    if (parts[2] !== 'github.com' || v.title === "" || parts.length < 5) return null
    if (parts[3] === 'orgs') return null

    return {
      title: this.cleanTitle(v.title, parts[5]),
      url: v.url,
      org: parts[3],
      repo: parts[4],
      section: parts[5]
    }
  }

  cleanTitle(title, section) {
    switch(section) {
      case 'issues':
        const titleParts = title.split(' · ')
        if (titleParts.length < 3) return title
        return titleParts[1].replace('Issue #','') + ' ' + titleParts[2]
      default:
        return title;
    }
  }

  addVisit(v) {
    let org = null
    if (v.org in this.orgs) {
      org = this.orgs[v.org]
    } else {
      org = { name: v.org, repos: [ ] }
      this.orgs[v.org] = org
    }

    if (v.repo in org) {
      org.repos[v.repo].push(v)
    } else {
      org.repos[v.repo] = [ v ]
    }

    this.visits.push(v)
  }

  loadData() {
    chrome.history.search(this.getSearchCriteria(), (v) => {
      v.map(v => this.buildVisit(v)).forEach(v => { if (v !== null) this.addVisit(v) })
      this.isLoaded = true
      historyLoadedEvent.data = this
      window.dispatchEvent(historyLoadedEvent)
    })
  }
}
