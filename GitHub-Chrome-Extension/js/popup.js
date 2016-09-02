import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import HistoryLoader from './history-loader'

let background = chrome.extension.getBackgroundPage()
background.data = background.data || new HistoryLoader()

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
        <a href={`https://github.com/${org.orgName}`} target="_blank">{org.orgName}</a>
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
      <span> / <a href={`https://github.com/${repo.orgName}/${repo.repoName}`} target="_blank">{repo.repoName}</a></span>
    )
  }

  renderRepoList(repos, repoKeys) {
    return (
      <ol className={'repos'}>
        {repoKeys.map((r) => this.renderRepo(repos[r]))}
      </ol>
    )
  }

  renderRepo(repo) {
    return (
      <li key={repo.repoName}>
        <a href={`https://github.com/${repo.orgName}/${repo.repoName}`} target="_blank">{repo.repoName}</a>
        <ol className={'visits'}>
        </ol>
      </li>
    )
  }

  getSortedKeys(obj) {
    const keys = Object.keys(obj)
    keys.sort((a, b)  => a.toLowerCase().localeCompare(b.toLowerCase()))
    return keys
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    (<Popup />),
    document.getElementById('content'))
})
