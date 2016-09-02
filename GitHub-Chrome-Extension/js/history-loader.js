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
    if (parts.length < 5 || parts[4] === "" || ignoreTops.includes(parts[3])) return null

    switch(parts[3]) {
      case 'blog':
        return null
    }

    switch(parts[5]) {
      case 'blob':
      case 'blame':
      case 'search':
      case 'pulls':
        return null
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

    v.className = 'arrow-small-right'

    switch(v.section) {
      case 'pull':
        v.className = 'git-pull-request'
        v.title = parts[1].replace('Pull Request #', 'PR ') + ' ' + parts[0]
        return
      case 'edit':
      case 'new':
        v.className = 'pencil'
        break
      case 'graphs':
        v.className = 'graph'
        break
      case 'settings':
        v.className = 'settings'
        break
      case 'compare':
        v.className = 'diff'
        break
      case 'releases':
      case 'release':
        v.className = 'package'
        break
      case 'branches':
        v.className = 'git-branch'
        break
      case 'issues':
        v.className= 'issue-opened'
        if (v.remaining !== '' && v.remaining != 'new') {
          v.title = 'Issue ' + v.remaining
          if (parts.length > 2)
            v.title += ' ' + parts[0]
          return
        }
        break
      case 'commits':
        v.className = 'git-branch'
        if (parts[0] == 'Commits' && v.remaining != '') {
          v.title = 'Commits in ' + v.remaining
          return
        }
        break
      case 'commit':
        v.className = 'git-commit'
        if (parts.length > 1) {
          if (parts[1].includes(' @') || parts[1].trim().startsWith(repoPath + '@')) {
            v.title = 'Commit ' + parts[1].split('@')[1] + ' ' + parts[0]
            return
          }
          if (parts[0].includes(' at ')) {
            const subparts = parts[0].split(' at ');
            v.title = subparts[0] + ' @' + subparts[1].split(' at ')[1]
            return
          }
        }
        break
      case 'find':
      case 'tree':
        v.className = this.getIconForFile(v.remaining)

        if (parts[0].startsWith('History ')) {
          v.className = 'history'
        }

        if (parts[0].startsWith(repoPath + ' at ')) {
          parts[0] = 'Branch ' + parts[0].slice(repoPath.length + 4)
        }

        v.title = parts[0].replace(atFullHash, ' @$2').replace(' at master','')
        return
    }

    v.title = parts.filter((t) => t != repoPath).join(' * ')
  }

  getIconForFile(filename) {
    const parts = filename.split('/')
    const lastPart = parts[parts.length - 1]
    const fileParts = lastPart.split('.')
    console.log(fileParts)
    if (fileParts.length === 1)
      return 'file-directory'

    switch(fileParts[fileParts.length - 1]) {
      case 'md':  return 'markdown'
      case 'txt': return 'file-text'
      case 'pdf': return 'file-pdf'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'svg':
      case 'gif':
      case 'tiff':
      case 'tif':
        return 'file-media'
      case 'exe':
        return 'file-binary'
      default:
        return 'file-code'
    }
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
    const cleanUrl = v.url.split('#')[0].split('?')[0]
    if (!(cleanUrl in repo.visits)) {
      repo.visits[cleanUrl] = v
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
