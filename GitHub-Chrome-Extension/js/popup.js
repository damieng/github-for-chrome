import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import HistoryLoader from './history-loader'

let background = chrome.extension.getBackgroundPage()
background.data = /* background.data */ new HistoryLoader()

//  Polyfills
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(O) {
		return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), [])
	}
}

class Popup extends Component {
  componentWillMount() {
    this.backgroundSubscription = background.addEventListener('onHistoryLoaded', (e) => this.forceUpdate())
  }

  componentWillUnmount() {
    if (this.backgroundSubscription != null) {
      this.background.removeEventListener('onHistoryLoaded', backgroundSubscription)
      this.backgroundSubscription = null
    }
  }

  render() {
    if (background.data.isLoaded !== true)
      return (<div className="loading">Loading...</div>)

    return this.renderOrgList(background.data.orgs)
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
    let sortedVisits = Object.values(visits)
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

    return (<li key={v.url}>
			{icon}
			<a href={v.url} title={v.originalTitle} target="_blank">{v.title}</a>
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
