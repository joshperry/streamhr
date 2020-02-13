// Number of samples to graph
const MAX = 60
// Height of the body font
const LINE_HEIGHT = parseFloat(getComputedStyle(document.body).fontSize)

// Set us up the chart
let data = Array(MAX).fill(0)
Plotly.plot('chart', [{
  y: data,
  type: 'line'
}], {
  autosize: false,
  width: hrconfig.width,
  // remove one line height for bpm heart/text below graph
  height: hrconfig.height - LINE_HEIGHT,
  margin: { l: 23, r: 0, b: 0, t: 0, },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  yaxis: {
    tickfont: {
      color: hrconfig.fontcolor,
    },
  },
  xaxis: {
    zeroline: false,
    showticklabels: false,
  }
})

// Set UI styles from config
document.getElementById('wrap').style.width = `${hrconfig.width}px`
document.body.style.color = hrconfig.fontcolor

// Connect to the server and watch for heartrate messages
const ws = new WebSocket(`ws://${location.host}`)
ws.onmessage = evt => {
  const hrv = JSON.parse(evt.data)

  // Beat the heart graphic
  const heart = document.getElementById('heart')
  heart.style.animation = 'none'
  heart.offsetHeight; // Trigger reflow hack
  heart.style.animation = null

  // Set the bpm text
  const bpm = document.getElementById('bpm')
  bpm.textContent = hrv.bpm

  // Slide the samples and update the chart
  let head;
  [head, ...data] = [...data, hrv.bpm]
  Plotly.update('chart', { y: [data], line: { color: hrconfig.plotcolor } })
}
