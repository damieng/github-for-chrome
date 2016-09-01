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
    console.log('will unmount')
    if (this.backgroundSubscription != null) {
      this.background.removeEventListener('onHistoryLoaded', backgroundSubscription)
      this.backgroundSubscription = null
    }
  }

  render() {
    const data = background.data
    if (data === undefined || data == null || data.isLoading) {
      return (
        <div className="loading">Loading...</div>
      )
    }

    return (
      <ol className='orgs'>
      {
        this.getOrgKeys(data.orgs).map((o) =>
            <li key={o}>
              <a href={`https://github.com/${o}`} target="_blank">{o}</a>
              <ol className={'repos'}>{
                this.getRepoKeys(data.orgs[o]).map((r) =>
                  <li key={r}>
                    <a href={`https://github.com/${o}/${r}`} target="_blank">{r}</a>
                  </li>
                )
              }</ol>
            </li>
        )
      }
      </ol>
    )
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
    const repoKeys = Object.keys(org)
    repoKeys.sort((a, b)  => a.toLowerCase().localeCompare(b.toLowerCase()))
    return repoKeys
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    (<Popup />),
    document.getElementById('content'))
})
