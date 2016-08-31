import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import URL from 'url'

require('bulma')

class RepoList extends Component {
  constructor() {
    super()
    this.state = {
      loading: true,
      visits: [ ],
      orgs: { }
    }
  }

  convertVisit(v) {
    return {
      title: v.title,
      url: v.url,
      parts: v.url.split('/')
    }
  }

  buildList(newVisits) {
    newVisits
      .map(this.convertVisit)
      .filter(v => v.title && v.url && v.parts[2] === 'github.com')
      .forEach(v => { this.state.visits.push(v) })

    if (this.renderTimer) clearTimeout(this.renderTimer)
    this.renderTimer = setTimeout(() => {
      this.state.loading = false
      this.forceUpdate()
    }, 64)
  }

  componentWillMount() {
    this.loadData()
  }

  loadData() {
    const now = new Date().getTime()
    const rangeDays = 7
    const millisPerDay = 24 * 60 * 60 * 1000

    chrome.history.search(
      {
        text: 'https://github.com',
        maxResults: 10000,
        startTime: now - (rangeDays * millisPerDay),
        endTime: now
      }, (visit) => this.buildList(visit)
    )
  }

  render() {
    console.log(this.state)

    if (this.state.loading) {
      return (
        <div style={{padding: 10}}>Loading...</div>
      )
    }

    return (
      <div style={{padding: 10}}>{
        this.state.visits.map((v) => {
          return (
            <article className="media" title={v.title}>
              <div className="media-content" style={{ width: 250 }}>
                <div className="content" className="content">
                  <a title={v.url} href={v.url} target="_blank" className="linkText">{v.title}</a>
                </div>
              </div>
            </article>
            )
          })
        }
      </div>
    )
  }
}

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    (<RepoList />),
    document.getElementById('root'))
})
