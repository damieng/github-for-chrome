import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import HistoryLoader from './history-loader'

let background = chrome.extension.getBackgroundPage()
background.data = background.data || new HistoryLoader()

class Popup extends Component {
  componentWillMount() {
    this.backgroundSubscription = background.addEventListener('onHistoryLoaded', (e) => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    if (this.backgroundSubscription != null) {
      this.background.removeEventListener('onHistoryLoaded', backgroundSubscription)
      this.backgroundSubscription = null
    }
  }

  render() {
    const data = background.data

    if (data.isLoaded !== true) {
      return this.renderLoading();
    }

    return this.renderOrgList(data.orgs)
  }

  renderLoading() {
    return (<div className="loading">Loading...</div>)
  }

  renderOrgList(orgs) {
    return (
      <ol className='orgs'>
        {this.getSortedKeys(orgs).map((orgKey) =>
            <li key={orgKey}>
              <a href={`https://github.com/${orgKey}`} target="_blank">{orgKey}</a>
                {this.renderSingleRepoOrList(orgs[orgKey])}
            </li>
        )}
      </ol>
    )
  }

  renderSingleRepoOrList(org) {
    var repoKeys = this.getSortedKeys(org.repos)
    if (repoKeys.length === 1)
      return (<a className={'single'} href={this.makeLink(org, repoKeys[0])} target="_blank">{repoKeys[0]}</a>)

    return this.renderRepoList(org, repoKeys)
  }

  renderRepoList(org, repoKeys) {
    return (
      <ol className={'repos'}>
        {repoKeys.map((repo) =>
          <li key={repo}>{this.renderRepo(org, repo)}</li>
        )}
      </ol>
    )
  }

  renderRepo(org, repo) {
    return (<a href={this.makeLink(org, repo)} target="_blank">{repo}</a>)
  }

  makeLink(org, repo) {
    const parts = [ org.name, repo ].join('/')
    return `https://github.com/${parts}`
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
