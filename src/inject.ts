;(() => {
  let open = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = (method, url) => {
    console.log('[inject] XHR request:', [method, url])
    return open.apply(this, [method, url, true, null, null])
  }

  const origFetch = window.fetch
  window.fetch = async (...args) => {
    console.log(`[inject] fetch request:`, args)
    return origFetch(...args)
  }
})()
