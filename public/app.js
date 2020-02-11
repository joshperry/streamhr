// Number of samples to graph
const MAX = 60

// Set us up the chart
let data = Array(MAX).fill(0)
Plotly.plot('chart', [{
  y: data,
  type: 'line'
}], {
  autosize: false,
  width: 250,
  height: 120,
  margin: { l: 20, r: 0, b: 0, t: 0, },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  xaxis: {
    zeroline: false,
    showticklabels: false,
  }
})

// Connect to the server and watch for heartrate messages
const ws = new WebSocket(`ws://${location.host}`)
ws.onmessage = evt => {
  const hrv = JSON.parse(evt.data)

  // Slide the samples and update the chart
  let head;
  [head, ...data] = [...data, hrv.bpm]
  Plotly.update('chart', { y: [data] })

  /*
  Plotly.extendTraces('chart', { y: [[hrv.bpm]] }, [0])

  if(count++ > MAX) {
    Plotly.relayout('chart', { xaxis: { range: [count - MAX, count] } })
  }
  */
}
