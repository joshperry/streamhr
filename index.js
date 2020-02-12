import path from 'path'
import { createServer } from 'http'
import express from 'express'
import WebSocket from 'ws'
import { subscribe } from './hr.js'
 
const app = express()
app.use(express.static(path.join(process.cwd(), '/public')))

const server = createServer(app)
const wss = new WebSocket.Server({ server })
 
wss.on('connection', ws =>  {
	console.log('Got websocket client')
})
 
server.listen(8080, 'localhost', () => {
	console.log(`Listening for heartrate client on ${server.address().port}`)
})

// Our main async context
;(async function() {
  try {
    // Subscribe to heartrate monitor updates
    const unsubscribe = await subscribe(hrv => {
      // Broadcast the heartrate info to all connected websocket clients
      const jhrv = JSON.stringify(hrv)
      for(let ws of wss.clients) {
        if(ws.readyState === WebSocket.OPEN) {
          ws.send(jhrv)
        }
      }

      // TODO: add csv logging
    })

    // Handle ctrl-c
    process.once('SIGINT', function () {
      console.log('got SIGINT, shutting down');

      // Disconnect heartrate monitor
      unsubscribe()

      process.exit(0)
    })
  } catch(err) {
    console.error('There was an error connecting to the HR monitor', err)
    process.exit(1)
  }
}())
