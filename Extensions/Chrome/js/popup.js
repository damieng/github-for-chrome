import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import HistoryLoader from './history-loader'

let background = chrome.extension.getBackgroundPage();
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
    if (data === undefined || data == null || data.isLoading)
      return renderLoading();

    return this.renderOrgList(data.orgs)
  }

  renderLoading() {
    return (
      <div className="loading">Loading...</div>
    )
  }

  renderOrgList(orgs) {
    return (
      <ol className='orgs'>
      {
        this.getOrgKeys(orgs).map((o) =>
            <li key={o}>
              <a href={`https://github.com/${o}`} target="_blank">{o}</a>{
                this.renderSingleRepoOrList(orgs[o])
            }
            </li>
        )
      }
      </ol>
    )
  }

  renderSingleRepoOrList(org) {
    var repoKeys = this.getRepoKeys(org)
    if (repoKeys.length === 1)
      return (
        <a className={'single'} href={this.makeLink(org, repoKeys[0])} target="_blank">{repoKeys[0]}</a>
      )
    else {
      return this.renderRepoList(org)
    }
  }

  makeLink(org, repo) {
    const parts = [ org.name, repo ].join('/')
    return `https://github.com/${parts}`
  }

  renderRepoList(org) {
    return (<ol className={'repos'}>{
      this.getRepoKeys(org).map((r) =>
        <li key={r}>
          <a href={this.makeLink(org, r)} target="_blank">{r}</a>
        </li>
      )
    }</ol>)
  }

  setSelected(e) {
    console.log(e)
  }

  getOrgKeys(orgs) {
    const orgsKeys = Object.keys(orgs)
    orgsKeys.sort((a, b)  => a.toLowerCase().localeCompare(b.toLowerCase()))
    return orgsKeys
  }

  getRepoKeys(org) {
    const repoKeys = Object.keys(org.repos)
    repoKeys.sort((a, b)  => a.toLowerCase().localeCompare(b.toLowerCase()))
    return repoKeys
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    (<Popup />),
    document.getElementById('content'))
})
