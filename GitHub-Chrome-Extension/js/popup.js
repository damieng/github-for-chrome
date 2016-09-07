import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import HistoryLoader from './history-loader'

const background = chrome.extension.getBackgroundPage()
background.historic = background.historic || new HistoryLoader()

class Popup extends Component {
  componentWillMount() {
    this.backgroundSubscription = background.addEventListener('onHistoryLoaded', (e) => this.forceUpdate())
    background.lastPopup = this
    if (background.historic.initialized !== true)
      background.historic.initialize()
  }

  componentWillUnmount() {
    if (this.backgroundSubscription != null) {
      background.removeEventListener('onHistoryLoaded', backgroundSubscription)
      this.backgroundSubscription = null
    }
  }

  render() {
    if (background.historic.initialized === false)
      return (<div className="loading">Loading...</div>)

    return this.renderOrgList(background.historic.orgs)
  }

  renderOrgList(orgs) {
    return (
      <ol className='orgs'>
        {this.getSortedKeys(orgs).map((o) => this.renderOrg(orgs[o]))}
      </ol>
    )
  }

  renderOrg(org) {
    return (
      <li key={org.orgName}>
        {this.renderLink(org.orgName)}
        {this.renderSingleRepoOrList(org.repos)}
      </li>
    )
  }

  renderSingleRepoOrList(repos) {
    const repoKeys = this.getSortedKeys(repos)
    if (repoKeys.length === 1)
      return this.renderSingleRepo(repos[repoKeys[0]])

    return this.renderRepoList(repos, repoKeys)
  }

  renderSingleRepo(repo) {
    return (
      <span> / <span className={"octicon octicon-repo"}></span>
				{this.renderLink(repo.orgName, repo.repoName)}
        {this.renderRepoVisits(repo.visits)}
      </span>
    )
  }

  renderLink(orgName, repoName) {
    const parts = [ orgName, repoName ].join('/')
    const linkName = repoName === undefined ? orgName : repoName
    return (<a href={`https://github.com/${parts}`} target="_blank">{linkName}</a>)
  }

  renderRepoList(repos, repoKeys) {
    return (
      <ol className={'repos'}>
        {repoKeys.map((rk) => this.renderRepo(repos[rk]))}
      </ol>
    )
  }

  renderRepo(repo) {
    return (
      <li key={repo.repoName}>
        <span className={"octicon octicon-repo"}></span>
        {this.renderLink(repo.orgName, repo.repoName)}
        {this.renderRepoVisits(repo.visits)}
      </li>
    )
  }

  renderRepoVisits(visits) {
    let sortedVisits = Object.keys(visits).map(k => visits[k])
    if (sortedVisits.length === 0) return
    sortedVisits.sort((a, b) => this.stringSort(a.title, b.title))

    return (
      <ol className={'visits'}>
        {sortedVisits.map(this.renderRepoVisit)}
      </ol>
    )
  }

  renderRepoVisit(v) {
		const icon = v.className === undefined ? '' : <span className={'octicon octicon-' + v.className}></span>

    return (<li key={v.url} title={v.originalTitle}>
			{icon}
			<a href={v.url} title={v.url} target="_blank">{v.title}</a>
		</li>)
  }

  getSortedKeys(obj) {
    const keys = Object.keys(obj)
    keys.sort(this.stringSort)
    return keys
  }

  stringSort(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    (<Popup />),
    document.getElementById('content'))
})
