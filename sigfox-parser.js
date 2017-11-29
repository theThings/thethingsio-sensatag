let GOOGLE_API_KEY = 'YOUR GOOGLE API KEY';

// BIG ENDIAN TO LITTLE ENDIAN
function rev(v) {
    let s = v.replace(/^(.(..)*)$/, '0$1'); // add a leading zero if needed
    let a = s.match(/../g);             // split number in groups of two
    a.reverse();                        // reverse the groups
    let s2 = a.join('');                // join the groups back together
    return s2;
}

// STRING TO MAC ADDRESS
function stringToMac(string) {
    return rev(string).match(/.{1,2}/g).reverse().join(':');
}

// MAIN
function main(params, callback){
    let result = [];
    let mac, mac2;
  	let voltage;
 	let percentage;
  	let status;
  	let WiFirssi;
    let body = {};
  
  	// these are estimations of the max and min battery to generate %
  	let maximumBattery = 3.6;
  	let minimumBattery = 2.5;

    switch(params.data.length) 
    {
    case 2:
        status = parseInt(params.data.substring(0,2),10);
        if (status === 1)
            status = "Just powered";
        else
            status = "No access point";
        result = [
          {
            "key": "status",
            "value": status
          }
        ];
        return callback(null, result);
        break;
    case 6:
        voltage = parseInt(params.data.substring(0,4),10);
        voltage = voltage/parseFloat(1000);
        
        percentage = voltage > maximumBattery ? 100 : (((voltage-minimumBattery)/(maximumBattery-minimumBattery))*100).toFixed(0)
        percentage = percentage < 0 ? 0 : percentage;
        
        status = parseInt(params.data.substring(4,6),10);
        if (status === 20)
            status = "Ask Downlink. No WAP";
        else
            status = "Wrong message";

        result = result.concat([
          {
            "key": "status",
            "value": status
          },
          {
            "key": "batteryVoltage",
            "value": voltage
          },
          {
            "key": "batteryPercentage",
            "value": percentage
          }
        ]);
        return callback(null, result);
        break;
    case 14:
        if (GOOGLE_API_KEY == 'YOUR GOOGLE API KEY') {
            result = result.concat([
                {
                    'key': 'GMapsErrors',
                    'value': "Google Api Key not configured"
                }]);

            return callback(null, result);
        }

        mac = stringToMac(params.data.substring(0, 12));
        WiFirssi = parseInt(params.data.substring(12,14),16);
        WiFirssi = -WiFirssi;

        body = {
            'considerIp': 'false',
            'wifiAccessPoints': [
                {'macAddress': mac,
                 'signalStrength': WiFirssi,
                 "signalToNoiseRatio": 0
                }]
        };

        httpRequest({
            host: 'www.googleapis.com',
            path: '/geolocation/v1/geolocate?key=' + GOOGLE_API_KEY,
            method: 'POST',
            secure: true,
            headers: {'Content-Type': 'application/json'}
        }, body, function (err, res) {
            res = JSON.parse(res.result);
            if (err) return callback(err);
            if (res.error) {
                result = result.concat([
                    {
                        'key': 'GMapsErrors',
                        'value': "Google Api Message: " + res.error.message
                    }]);

                return callback(null, result);
            }
            
            let payload = {
              "macs": [mac], //2 o una
              "lat": res.location.lat,
              "lng": res.location.lng,
              "accuracy": res.accuracy,  //optional
              "source": "Google API" //optional
            };
            thethingsAPI.submitGeoMAC(params.thingToken, payload, callback);

            result = result.concat([
              	{

                  	'key': 'status',
                    'value': '1 WiFi + 1 WiFi_RSSI'
                },
                {
                    'key': 'geolocation',
                    'value': 'googlewifi',
                    'geo': {
                        'lat': res.location.lat,
                        'long': res.location.lng
                    }
                },
                {
                    'key': 'googleAccuracy',
                    'value': res.accuracy
                },
                {
                    'key': 'WiFirssi',
                    'value': WiFirssi
                },
              	{
                    'key': 'wifis',
                    'value': mac,
                    'geo': {
                        'lat': res.location.lat,
                        'long': res.location.lng
                    }
                },
                {
                    'key': '$geo',
                    'value': [res.location.lng, res.location.lat]
                }]);
            return callback(null, result);
        });
        break;
    case 18:
    	  voltage = parseInt(params.data.substring(0,4),10);
        voltage = voltage/parseFloat(1000);
        
        percentage = voltage > maximumBattery ? 100 : (((voltage-minimumBattery)/(maximumBattery-minimumBattery))*100).toFixed(0)
        percentage = percentage < 0 ? 0 : percentage;
        
        mac = stringToMac(params.data.substring(4, 16));
        WiFirssi = parseInt(params.data.substring(16,18),16);

        WiFirssi = -WiFirssi;

        body = {
            'considerIp': 'false',
            'wifiAccessPoints': [
                {'macAddress': mac,
                 'signalStrength': WiFirssi
               }]
        };

        httpRequest({
            host: 'www.googleapis.com',
            path: '/geolocation/v1/geolocate?key=' + GOOGLE_API_KEY,
            method: 'POST',
            secure: true,
            headers: {'Content-Type': 'application/json'}
        }, body, function (err, res) {
            res = JSON.parse(res.result);
            if (err) return callback(err);
            if (res.error) {
                result = result.concat([
                      {
                        	'key': 'status',
                          'value': 'Ask Downlink. 1 WiFi + 1 WiFi_RSSI'
                      },
                    	{
                     		'key': 'batteryVoltage',
                           'value': voltage
                    	},
                  		{
                     		'key': 'batteryPercentage',
                           'value': percentage
                    	},
                      {
                          'key': 'GMapsErrors',
                          'value': "Google Api Message: " + res.error.message
                      }]);

               return callback(null, result);
            }

            result = result.concat([
              	{

                  	'key': 'status',
                    'value': 'Ask Downlink. 1 WiFi + 1 WiFi_RSSI'
                },
              	{
               		   'key': 'batteryVoltage',
                    'value': voltage
              	},
              	{
               		   'key': 'batteryPercentage',
                    'value': percentage
              	},
                {
                    'key': 'geolocation',
                    'value': 'googlewifi',
                    'geo': {
                        'lat': res.location.lat,
                        'long': res.location.lng
                    }
                },
                {
                    'key': 'googleAccuracy',
                    'value': res.accuracy
                },
                {
                    'key': 'WiFirssi',
                    'value': WiFirssi
                },
                {
                    'key': '$geo',
                    'value': [res.location.lng, res.location.lat]
                }]);
            return callback(null, result);
        });
        break;
    case 24:
        if (GOOGLE_API_KEY == 'YOUR GOOGLE API KEY') {
            result = result.concat([
                {
                    'key': 'GMapsErrors',
                    'value': "Google Api Key not configured"
                }]);

            return callback(null, result);
        }

        mac = stringToMac(params.data.substring(0, 12));
        mac2 = stringToMac(params.data.substring(12, 24));


        body = {
            'considerIp': 'false',
            'wifiAccessPoints': [
                {'macAddress': mac},
                {'macAddress': mac2}]
        };

        httpRequest({
            host: 'www.googleapis.com',
            path: '/geolocation/v1/geolocate?key=' + GOOGLE_API_KEY,
            method: 'POST',
            secure: true,
            headers: {'Content-Type': 'application/json'}
        }, body, function (err, res) {
            res = JSON.parse(res.result);
            if (err) return callback(err);
            if (res.error) {
                result = result.concat([
                    {
                        'key': 'GMapsErrors',
                        'value': "Google Api Message: " + res.error.message
                    }]);

                return callback(null, result);
            }

            result = result.concat([
                {
                  	'key': 'status',
                    'value': '2 WiFi'
                },
              	{
                    'key': 'wifis',
                    'value': mac+'-'+mac2,
                    'geo': {
                        'lat': res.location.lat,
                        'long': res.location.lng
                    }
                },
                {
                    'key': 'geolocation',
                    'value': 'googlewifi',
                    'geo': {
                        'lat': res.location.lat,
                        'long': res.location.lng
                    }
                },
                {
                    'key': 'googleAccuracy',
                    'value': res.accuracy
                },
                {
                    'key': '$geo',
                    'value': [res.location.lng, res.location.lat]
                }
              ]);
            return callback(null, result);
            });
        break;
    default:
         result = result.concat([
                {
                    'key': 'sigfox-error',
                    'value': 'Wrong message'
                }])
        return callback(null, result);
      }
  }
