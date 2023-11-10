require('dotenv').config()
const { Tado } = require("node-tado-client");

const HOME_ID = 1343926;

const ZONES = {
  home: 12,
  bedroom: 4,
  livingRoom: 13,
};

const USERNAME = process.env.USERNAME
const PASSWORD = process.env.PASSWORD

const getTemp = (overlay) => {
  return overlay.setting.temperature
}

const isOn = (overlay) => {
  return overlay.setting.power === 'ON'
}

const loop = async () => {
  var tado = new Tado();

  // Login to the Tado Web API
  await tado.login(USERNAME, PASSWORD);
  const getHome = await tado.getZoneOverlay(HOME_ID, ZONES.home);
  const getBedroom = await tado.getZoneOverlay(HOME_ID, ZONES.bedroom);
  const getLivingRoom = await tado.getZoneOverlay(HOME_ID, ZONES.livingRoom);

  const homeIsOn = isOn(getHome)
  const bedroomIsOn = isOn(getBedroom)
  const livingRoomIsOn = isOn(getLivingRoom)

  const setTemp = async (temp) => {

    if (homeIsOn) {
      if (getTemp(getHome).celsius === temp.celsius) {
        console.log('heat staying at', temp.celsius)
        return
      }
    }

    console.log('setting temp to', temp.celsius)
    await tado.setZoneOverlays(HOME_ID, [
      {
        zone_id: ZONES.home,
        power: 'ON',
        temperature: temp
      }
    ])
  }
  const turnOff = async () => {
    console.log('turning off heating')
    await tado.setZoneOverlays(HOME_ID, [
      {
        zone_id: ZONES.home,
        power: 'OFF',
      }
    ])
  }



  if (!bedroomIsOn && !livingRoomIsOn) {
    if (homeIsOn) {
      //TURN OFF HOME.
      await turnOff()
    }
    return
  }

  //is any on?
  if (!bedroomIsOn || !livingRoomIsOn) {
    if (bedroomIsOn) {
      // set home to bedroomTemp
      const bedroomTemp = getTemp(getBedroom)
      await setTemp(bedroomTemp)
      return
    }
    if (livingRoomIsOn) {
      // set home to livingRoomTemp
      const livingRoomTemp = getTemp(getLivingRoom)
      await setTemp(livingRoomTemp)
      return
    }
  }


  const livingRoomTemp = getTemp(getLivingRoom)
  const bedroomTemp = getTemp(getBedroom)
  const homeTemp = getTemp(getHome);

  const getHighest = (a, b) => {
    return a.celsius > b.celsius ? a : b;
  }

  const highestTemp = getHighest(bedroomTemp, livingRoomTemp)

  if (highestTemp.celsius > homeTemp.celsius) {
    // console.log('set heating to', highestTemp.celsius)
    await setTemp(highestTemp)
  }

};




var minutes = 1, the_interval = minutes * 60 * 1000;
loop();
setInterval(function () {
  try {
    loop();
  } catch (err) {
    console.error(err)
  }
}, the_interval);
