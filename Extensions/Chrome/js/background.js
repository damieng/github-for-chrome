class A {
  constructor() {
    this.loading = true
    this.visits = [ ]
    this.orgs = { }
  }

  convertVisit(v) {
    return {
      title: v.title,
      url: v.url,
      parts: v.url.split('/')
    }
  }

  loadData() {
    const now = new Date().getTime()
    const rangeDays = 7
    const millisPerDay = 24 * 60 * 60 * 1000

    chrome.history.search({
        text: 'https://github.com',
        maxResults: 10000,
        startTime: now - (rangeDays * millisPerDay),
        endTime: now
      }, (v) => {
          v.map(this.convertVisit)
           .filter(v => v.title && v.url && v.parts[2] === 'github.com')
           .forEach(v => { this.visits.push(v) })
          this.loading = false
        }
    )
  }
}

data = new A()
