type Header = {
  key: string
  value: string
}

type Data = {
  id: string
  method: string
  url: string
  headers: Header[] | any
  body: string
}

let tabActived: number
let data: Map<number, Data[]> = new Map()

chrome.webRequest.onBeforeRequest.addListener(
  (req) => {
    if (req.type === 'xmlhttprequest' || req.type === 'ping') {
      let requestBody = ''
      if (req.requestBody) {
        if (req.requestBody.raw) {
          const decoder = new TextDecoder('utf-8')
          requestBody = decoder.decode(req.requestBody.raw[0].bytes)
        } else if (req.requestBody.formData) {
          requestBody = JSON.stringify(req.requestBody.formData)
        }
      }
      let prev = data.get(req.tabId) || []
      if (prev) {
        prev.push({
          id: req.requestId,
          method: req.method,
          url: req.url,
          headers: [],
          body: requestBody,
        })
      }
      data.set(req.tabId, prev)
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody'],
)

chrome.webRequest.onBeforeSendHeaders.addListener(
  (req) => {
    if (req.type === 'xmlhttprequest' || req.type === 'ping') {
      let prev = data.get(req.tabId)
      if (prev) {
        let request = prev.find((x) => x.id === req.requestId)
        if (request) {
          request.headers = req.requestHeaders?.map((header) => ({
            key: header.name,
            value: header.value,
          }))
          console.log(`XHR Captured:`, request, req.tabId)
          data.set(req.tabId, [
            ...prev.filter((x) => x.id != request.id),
            request,
          ])
        }
        updateBadge(req.tabId)
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders'],
)

function generatePostmanCollection(items: Data[]) {
  let collections = {
    info: {
      name: 'Captured data',
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: items.map((req) => ({
      name: req.url,
      request: {
        method: req.method,
        url: req.url,
        header: req.headers,
        body: req.body ? { mode: 'raw', raw: req.body } : undefined,
      },
    })),
  }
  return JSON.stringify(collections, null, 2)
}

function updateBadge(tabId: number) {
  let tab = data.get(tabId) || []
  if (tab) {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: tab.length.toString(),
    })
  }
}

chrome.tabs.onActivated.addListener((tab) => {
  console.log('tab activated', tab.tabId)
  tabActived = tab.tabId
  updateBadge(tab.tabId)
})

chrome.tabs.onRemoved.addListener((tab) => {
  console.log('tab removed', tab)
  data.delete(tab)
  updateBadge(tab)
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'download_postman') {
    let postmanJson = generatePostmanCollection(data.get(tabActived) || [])
    let blob = new Blob([postmanJson], { type: 'application/json' })
    let reader = new FileReader()
    reader.onloadend = () => {
      let txt = reader.result as string
      let base64Data = txt.split(',')[1]
      chrome.downloads.download({
        url: 'data:application/json;base64,' + base64Data,
        filename: 'captured_data.postman_collection.json',
        saveAs: true,
      })
      sendResponse({ status: 'File saved' })
    }
    reader.readAsDataURL(blob)
    return true
  } else if (message.action === 'get_xhr_data') {
    console.log('xhr_data from tab id:', tabActived)
    sendResponse({ action: 'xhr_data', data: data.get(tabActived) || [] })
  }
  updateBadge(tabActived)
})
