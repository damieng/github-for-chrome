import React, { Component } from 'react'
import ReactDOM from 'react-dom'

class RepoList extends Component {
  render() {
    const { loading, visits } = this.props;
    if (loading) {
      return (
        <div className="loading">Loading...</div>
      )
    }

    return (
      <ol>{
        visits.map((v, i) => {
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
    (<RepoList loading={true} />),
    document.getElementById('content'))
})

var bg = chrome.extension.getBackgroundPage();
console.log(bg);

chrome.runtime.getBackgroundPage((backgroundPage) => {
  console.log(backgroundPage)
  ReactDOM.render(
    (<RepoList loading={false} visits={backgroundPage.data.visits} />),
    document.getElementById('content'))
})
