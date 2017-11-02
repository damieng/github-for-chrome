var atFullHash = /( at )([a-f0-9]{10})([a-f0-9]{30})/

const ignoreTops = [ 'orgs', 'settings', 'login', 'blog', 'about' ]

export default class HistoryLoader {
  constructor() {
    this.background = chrome.extension.getBackgroundPage()
    this.orgs = { }
    this.initialized = false
  }

  getSearchCriteria() {
    const now = new Date().getTime()
    const rangeDays = 8
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
       h.title === 'File Finder' || h.title.startsWith('Page not found ') || h.title.trim() == '') return null

    const parts = h.url.split('?')[0].split('#')[0].split('/')
    if (parts.length < 5 || parts[4] === "" || ignoreTops.includes(parts[3])) return null

    switch(parts[5]) {
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
        if (parts.length > 1) v.title = parts[1].replace('Pull Request #', 'PR ') + ' ' + parts[0]
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
        // URL and title fail to match often on /issues
        if (v.remaining === '' && v.title.includes('Issue #')) {
          v.title = 'Issues'
          v.originalTitle = ['Issues', repoPath].join(' : ')
          return
        }

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
          if (parts[0].includes(' at ')) {
            const subparts = parts[0].split(' at ');
            v.title = subparts[0] + ' @' + subparts[1]
            return
          }
          if (parts[1].includes(' @') || parts[1].trim().startsWith(repoPath + '@')) {
            v.title = 'Commit ' + parts[1].split('@')[1] + ' ' + parts[0]
            return
          }
        }
        break
      case 'tree':
        const filePathParts = v.remaining.split('/')
        v.title = `${filePathParts.slice(1).join('/')} at ${filePathParts[0]}`
        break
      case 'blob':
      case 'find':
        if (parts[0].startsWith(v.repo + '/'))
          parts[0] = parts[0].slice(v.repo.length + 1)

        v.className = this.getIconForFile(v.remaining)

        if (parts[0].startsWith('History ')) {
          v.className = 'history'
        }

        if (parts[0].startsWith(repoPath + ' at ')) {
          parts[0] = 'Branch ' + parts[0].slice(repoPath.length + 4)
        }

        v.title = parts[0].replace(atFullHash, ' at $2')
        return
    }

    v.title = parts.filter((t) => t != repoPath && !t.startsWith(repoPath + '@')).join(' : ')
  }

  getIconForFile(filename) {
    const parts = filename.split('/')
    const lastPart = parts[parts.length - 1]
    const fileParts = lastPart.split('.')
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

  addVisit(orgs, v) {
    let org = null
    if (v.org in orgs) {
      org = orgs[v.org]
    } else {
      org = { orgName: v.org, repos: { } }
      orgs[v.org] = org
    }

    let repo = null
    if (v.repo in org.repos) {
      repo = org.repos[v.repo]
    } else {
      repo = org.repos[v.repo] = { orgName: v.org, repoName: v.repo, visits: { } }
    }

    if (v.section === undefined) return
    const cleanUrl = v.url.split('#')[0].split('?')[0]
    repo.visits[cleanUrl] = v
  }

  initialize() {
    this.getHistoricVisits((o) => {
      this.orgs = o
      this.initialized = true
      this.background.dispatchEvent(new Event('onHistoryLoaded'))
    })
  }

  getHistoricVisits(callback) {
    chrome.history.search(this.getSearchCriteria(), (v) => {
      const orgs = { }
      v.map(v => this.buildVisit(v)).forEach(v => { if (v !== null) this.addVisit(orgs, v) })
      callback(orgs)
    })
  }
}
