import { useEffect, useState } from 'react'

import Button from './components/ui/button'

type Data = {
  method: string
  url: string
}

function App() {
  const [running, setRunning] = useState(true)
  const [data, setData] = useState<Data[]>([])
  const [checkedIDs, setCheckedIDs] = useState<number[]>([])

  function handleStart() {
    setRunning(!running)
  }

  function handleDownload() {
    chrome.runtime.sendMessage({ action: 'download_postman' }, (res: any) => {
      console.log(res.status)
    })
  }

  function handleCheckAll() {
    if (checkedIDs.length === data.length) {
      setCheckedIDs([])
    } else {
      data.map((_, index) => {
        if (!checkedIDs.find((x) => x === index)) {
          setCheckedIDs((prev) => [...prev, index])
        }
      })
    }
  }

  function handleOnChecked(index: number) {
    if (!checkedIDs.find((x) => x === index)) {
      setCheckedIDs((prev) => [...prev, index])
    } else {
      setCheckedIDs((prev) => {
        return [...prev.filter((x) => x != index)]
      })
    }
  }

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'get_xhr_data' }, (message) => {
      setData(message.data)
    })
  }, [])

  useEffect(() => {
    if (data.length === 0) return
    data.map((_, index) => {
      if (!checkedIDs.find((x) => x === index)) {
        setCheckedIDs((prev) => [...prev, index])
      }
    })
  }, [data])

  return (
    <div className="min-w-[400px] w-full flex flex-col overflow-hidden">
      <div className="p-2 border-b">
        <h3 className="text-base font-bold">XHR Capture</h3>
      </div>
      <div className="max-h-[400px] p-2 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left">
              <th className="p-1">
                <input
                  type="checkbox"
                  checked={checkedIDs.length === data.length}
                  onClick={handleCheckAll}
                />
              </th>
              <th className="p-1">Method</th>
              <th className="p-1">URL</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="text-nowrap">
                <td className="p-1">
                  <input
                    type="checkbox"
                    checked={checkedIDs.find((x) => x === index) ? true : false}
                    onClick={() => handleOnChecked(index)}
                  />
                </td>
                <td className="p-1">{item.method}</td>
                <td className="p-1 max-w-[200px] truncate">{item.url}</td>
                <td className="p-1">
                  <Button>Save</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2 border-t">
        <Button onClick={handleStart}>{running ? 'Stop' : 'Start'}</Button>
        <Button onClick={handleDownload}>Save All</Button>
      </div>
    </div>
  )
}

export default App
