import { promises as fs } from 'fs'
import noble from 'noble-promise'

const HR_SERVICE = '180d',
      HR_CHAR = '2a37'

/**
Start listening for 'Heart Rate Measurement' characteristics emitted by the
first Bluetooth LE peripheral that implements the 'Heart Rate' service.
*/
export async function subscribe(cb) {
  // Find the peripheral heart rate characteristic
  const hrchar = await findFirstCharacteristic(HR_SERVICE, HR_CHAR)

  // heart rate data handler
  hrchar.on('data', data => {
    const hrv = parseHeartRateData(data)
    cb(hrv)

    console.log(hrv)
  })

  // Subscribe to data events
  await hrchar.subscribe()

  // Return the unsubscribe function
  return function unsubscribe() {
    // Close heartrate connection
    if(hrchar) {
      hrchar.removeAllListeners('data')
      hrchar.unsubscribe()
      hrchar = null
    }
  }
}

async function waitForReady() {
  return new Promise(resolve => {
    const handle = state => {
      if(state === 'poweredOn') {
        noble.off('stateChange', handle)
        resolve()
      }
    }

    noble.on('stateChange', handle)
  })
}

// Scan for the first peripheral implementing the given service UUIDs.
async function findFirstPeripheral(serviceUUID) {
  // Set up the discovery resolver
  const futureperiph = new Promise(resolve => {
    // set up scanning listener
    noble.once('discover', peripheral => {
      // as soon as the first peripheral is discovered, stop scanning
      noble.stopScanning()
      resolve(peripheral)
    })
  })

  // Begin the scanning process
  await noble.startScanning([serviceUUID], false)

  return futureperiph
}

// Find the first matching peripheral, connect to it, discover the matching service
// & characteristic UUIDs, and callback with the first characteristic found.
async function findFirstCharacteristic(serviceUUID, characteristicUUID) {
  // the state has to be 'poweredOn' before we start scanning
  if (noble.state !== 'poweredOn') {
    await waitForReady()
  }

  // Find it
  const peripheral = await findFirstPeripheral(serviceUUID)

  // Connect to it and query it for characteristics
  await peripheral.connect()
  const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristics([serviceUUID], [characteristicUUID])

  // If there was no error thrown, there should be at least one
  return characteristics[0]
}

const sampleCorrection = 1000.0 / 1024.0 // = 0.9765625

/**
Parse the raw bytes representing data according to the
Bluetooth LE "Heart Rate Measurement" characteristic specification.

@param {Buffer} data - buffer emitted by the characteristic's 'data' event.
*/
function parseHeartRateData(data) {
  let cursor = 0
  function readNext(byteLength) {
    const value = (byteLength > 0) ? data.readUIntLE(cursor, byteLength) : undefined
    cursor += byteLength
    return value
  }
  // the first byte of data is the mandatory "Flags" value,
  // which indicates how to read the rest of the data buffer.
  const flags = readNext(1)
  // 0b00010110
  //          ^ 0 => Heart Rate Value Format is set to UINT8. Units: beats per minute (bpm)
  //            1 => Heart Rate Value Format is set to UINT16. Units: beats per minute (bpm)
  //        ^^ 00 or 01 => Sensor Contact feature is not supported in the current connection
  //           10       => Sensor Contact feature is supported, but contact is not detected
  //           11       => Sensor Contact feature is supported and contact is detected
  //       ^ 0 => Energy Expended field is not present
  //         1 => Energy Expended field is present (units are kilo Joules)
  //      ^ 0 => RR-Interval values are not present
  //        1 => One or more RR-Interval values are present
  //   ^^^ Reserved for future use
  const valueFormat =          (flags >> 0) & 0b01
  const sensorContactStatus =  (flags >> 1) & 0b11
  const energyExpendedStatus = (flags >> 3) & 0b01
  const rrIntervalStatus =     (flags >> 4) & 0b01

  const bpm = readNext(valueFormat === 0 ? 1 : 2)
  const sensor = (sensorContactStatus === 2) ? 'no contact' : ((sensorContactStatus === 3) ? 'contact' : 'N/A')
  const energyExpended = readNext(energyExpendedStatus === 1 ? 2 : 0)
  const rrSample = readNext(rrIntervalStatus === 1 ? 2 : 0)
  // RR-Interval is provided with "Resolution of 1/1024 second"
  const rr = rrSample && (rrSample * sampleCorrection) | 0
  return {bpm, sensor, energyExpended, rr}
}
