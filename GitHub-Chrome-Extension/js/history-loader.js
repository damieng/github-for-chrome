var historyLoadedEvent = new Event('onHistoryLoaded')

var atFullHash = /( at )([a-f0-9]{10})([a-f0-9]{30})/

const ignoreTops = [ 'orgs', 'settings', 'login' ]

export default class HistoryLoader {
  constructor() {
    this.background = chrome.extension.getBackgroundPage()
    this.orgs = { }
    this.isLoaded = false
    this.loadData()
    console.log(this.orgs)
  }

  getSearchCriteria() {
    const now = new Date().getTime()
    const rangeDays = 10
    const millisPerDay = 24 * 60 * 60 * 1000
    return {
      text: 'https://github.com',
      maxResults: 10000,
      startTime: now - (rangeDays * millisPerDay),
      endTime: now
    }
  }

  buildVisit(h) {
    if (!h.url.startsWith('https://github.com/') || h.url.includes('?page=')) return null
    if (h.title === null || h.title === undefined ||
       h.title === 'File Finder' || h.title.startsWith('Page not found ') ||
       h.title.trim() == '') return null

    const parts = h.url.split('?')[0].split('#')[0].split('/')
    if (parts.length < 5 || ignoreTops.includes(parts[3])) return null

    switch(parts[5]) {
      case 'blob':
      case 'blame':
      case 'search':
      case 'issues':
      case 'pulls':
        return null;
    }

    const visit = {
      title: h.title,
      url: h.url,
      org: parts[3],
      repo: parts[4],
      section: parts[5],
      remaining: parts.slice(6).join('/'),
      originalTitle: h.title
    }

    this.adjustTitle(visit)

    return visit
  }

  adjustTitle(v) {
    const parts = v.title.split(/\s[·-]\s/u)
    const repoPath = v.org + '/' + v.repo

    switch(v.section) {
      case 'pull':
        v.title = parts[1].replace('Pull Request #', 'PR #') + ' ' + parts[0]
        return
      case 'commits':
        if (parts[0] == 'Commits') {
          v.title = 'Commits in ' + v.remaining
          return
        }
      case 'commit':
        if (parts.length > 1) {
          if (parts[1].includes(' @') || parts[1].trim().startsWith(repoPath + '@')) {
            v.title = 'Commit @' + parts[1].split('@')[1] + ' ' + parts[0]
            return
          }
          if (parts[0].includes(' at ')) {
            const subparts = parts[0].split(' at ');
            v.title = subparts[0] + ' @' + subparts[1].split(' at ')[1]
            return
          }
        }
      case 'find':
      case 'tree':
        if (parts[0].startsWith(repoPath + ' at ')) {
          parts[0] = 'Branch ' + parts[0].slice(repoPath.length + 4)
        }

        v.title = parts[0].replace(atFullHash, ' @$2').replace(' at master','')
        return
    }

    v.title = parts.filter((t) => t != repoPath).join(' * ')
  }

  addVisit(v) {
    let org = null
    if (v.org in this.orgs) {
      org = this.orgs[v.org]
    } else {
      org = { orgName: v.org, repos: { } }
      this.orgs[v.org] = org
    }

    let repo = null
    if (v.repo in org.repos) {
      repo = org.repos[v.repo]
    } else {
      repo = org.repos[v.repo] = { orgName: v.org, repoName: v.repo, visits: { } }
    }

    if (v.section === undefined) return
    if (!(v.url in repo.visits)) {
      repo.visits[v.url] = v
    }
  }

  loadData() {
    chrome.history.search(this.getSearchCriteria(), (v) => {
      v.map(v => this.buildVisit(v)).forEach(v => { if (v !== null) this.addVisit(v) })
      historyLoadedEvent.data = this
      this.isLoaded = true
      this.background.dispatchEvent(historyLoadedEvent)
    })
  }
}
