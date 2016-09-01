import React, { Component } from 'react'
import ReactDOM from 'react-dom'

const background = chrome.extension.getBackgroundPage();

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
    const data = background.data;

    if (data.isLoading) {
      return (
        <div className="loading">Loading...</div>
      )
    }

    return (
      <ol>{
        data.visits.map((v, i) => {
          return (
            <li key={i}>
              <a title={v.url} href={v.url} target="_blank">{v.title}</a>
            </li>
            )
          })
        }
      </ol>
    )
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    (<Popup />),
    document.getElementById('content'))
})
