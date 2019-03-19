let GOOGLE_API_KEY = 'YOUR GOOGLE API KEY';

let maxBattery = 3.6;
let minimumBatteryLevel = 2.6;

let maxNumberMsgNew = 10000;
let maxNumberMsgOld = 5000;

function main(params, callback) 
{
    let result = checkGApiKey();
    if (result.length > 0) return callback(null, result);
    result.push({
        "key": "sgfx-payload",
        "value": params.custom
    }, {
        "key": "snr",
        "value": params.custom.snr
    }, {
        "key": "time",
        "value": params.custom.time
    }, {
        "key": "duplicate",
        "value": params.custom.duplicate
    }, {
        "key": "station",
        "value": params.custom.station
    }, {
        "key": "avgSnr",
        "value": params.custom.avgSnr
    }, {
        "key": "rssi",
        "value": params.custom.rssi
    },{
        "key": "lastAccess",
        "value": moment().isDST() ? moment().add(1, 'hour').toISOString() : moment().add(2, 'hour').toISOString()
    }, 
    {
        "key": "seqNumber",
        "value": params.custom.seqNumber
    });

    switch (params.data.length) {
        case 2:
            processCase2(params, result, callback);
            break;
        case 4:
            processCase4(params, result, callback);
            break;
	    case 6:
            processCase6(params, result, callback);
            break;
        case 14:
            processCase14(params, result, callback);
            break;
        case 16:
            processCase16(params, result, callback);
            break;
        case 18:
            processCase18(params, result, callback);
            break;
        case 20:
            processCase20(params, result, callback);
            break;
        case 22:
            processCase22(params, result, callback);
            break;
        case 24:
            processCase24(params, result, callback);
            break;        
        
        default:
            result = result.concat([{
                'key': 'sigfox-error',
                'value': 'Payload size not corresponding to any usecase.'
            }]);
            return callback(null, result);
    }
}


function processCase2(params, result, callback) {
    let status = parseInt(params.data.substring(0, 2), 10);
    if (status === 1) status = "Just powered";
    else status = "No access point";
  
	let batteryP = 50;
  	let daysM = "Más de 30 días";
  
  	if (params.custom.seqNumber > 1000 && params.custom.seqNumber < 3000)
    {
    	batteryP = 10;
      	daysM = "Entre 30 y 15 días";
    }
	else if (params.custom.seqNumber > 3000)
    {
     	batteryP = 5;
      	daysM = "Menos de 10 días";
    }

    result.push({
        "key": "status",
        "value": status
    }, {
        "key": "batteryP",
        "value": batteryP
    }, {
        "key": "daysM",
        "value": daysM
    });
    callback(null, result);
}

function processCase4(params, result, callback) {
    let status = parseInt(params.data.substring(0, 2), 10);
    if (status === 1) status = "Just powered";
    else status = "No access point";

    let temperature = (((parseInt(params.data.substring(2, 4), 16))/parseFloat(2)) - 40);

    result.push({
            "key": "status",
            "value": status
        },
        {
            "key": "temperature",
            "value": temperature
        });
    callback(null, result);
}

function processCase6(params, result, callback) {
    let voltage = parseInt(params.data.substring(0, 4), 10) / parseFloat(1000);
    let percentage = voltage > maxBattery ? 100 : (((voltage - minimumBatteryLevel) / (maxBattery - minimumBatteryLevel)) * 100).toFixed(0);
    percentage = percentage < 0 ? 0 : percentage;
  
	let sn = params.custom.seqNumber;
   	let batteryP = 10;
	batteryP = ((maxNumberMsgOld - sn)/maxNumberMsgOld*100).toFixed(0);        
  
  
    let days = "Más de 30 días";

    if (voltage < 3.3 && voltage >= 3.1) days = "Entre 30 y 15 días";
    else if (voltage < 3.1 && voltage >= 2.9) days = "Menos de 15 días";
    else if (voltage < 2.9 && voltage >= 2.7) days = "Menos de 2 días";
    else if (voltage < 2.7) days = "Sin batería";
  
	let daysM = "Más de 30 días";

    if (sn > 4000 && sn < 4500) days = "Entre 30 y 15 días";
    else if (sn > 4500 && sn < 5000) days = "Menos de 15 días";
    else if (sn > 5000 && sn < 6000) days = "Menos de 2 días";
    else if (sn > 6000) days = "Sin batería";
  

    let status = parseInt(params.data.substring(4, 6), 10);
    if (status === 20) status = "Ask Downlink. No WAP";
    else status = "Wrong message";

    result.push({
        "key": "status",
        "value": status
    }, {
        "key": "batteryVoltage",
        "value": voltage
    }, {
        "key": "batteryDays",
        "value": days
    }, {
        "key": "batteryP",
        "value": batteryP
    }, {
        "key": "daysM",
        "value": daysM
    }, {
        "key": "batteryPercentage",
        "value": percentage
    })
    callback(null, result);
}

function processCase14(params, result, callback) {
    let macs = stringToMac(params.data.substring(0, 12));
    let WiFirssi = parseInt(params.data.substring(12, 14), 16);
    WiFirssi = -WiFirssi;

    result.push({
        'key': 'WiFirssi',
        'value': WiFirssi
    }, {
        'key': 'wifis',
        'value': macs
    }, {
        'key': 'status',
        'value': '1 WiFi + 1 WiFi_RSSI'
    });

    return callback(null, result);
}

function processCase16(params, result, callback) {
    let macs = stringToMac(params.data.substring(0, 12));
    let WiFirssi = parseInt(params.data.substring(12, 14), 16);
    WiFirssi = -WiFirssi;
    let temperature = (((parseInt(params.data.substring(14, 16), 10))/2) - 40); //Temperature = 0,5*RawValue - 40

    result.push({
        "key": "temperature",
        "value": temperature
    }, {
        'key': 'WiFirssi',
        'value': WiFirssi
    }, {
        'key': 'wifis',
        'value': macs
    },{
        'key': 'geo_status',
        'value': '1 WiFi + 1 WiFi_RSSI'
    });

    callback(null, result);
}

// TEMP
function processCase20(params, result, callback)
{

    return callback(null, result);
}


// DOWNLINK ACK
function processCase22(params, result, callback) {

    let temp_min = (((parseInt(params.data.substring(6, 8), 16))/parseFloat(2)) - 40);
    let temp_avg = (((parseInt(params.data.substring(8, 10), 16))/2) - 40);
    let temp_max = (((parseInt(params.data.substring(10, 12), 16))/2) - 40);

    //Bat voltage = RawValue *12,5 + 1800
    let voltage_idl = (parseInt(params.data.substring(12, 14), 16) * parseFloat(12.5) + 1800)/parseFloat(1000);
    let voltage_tx = (parseInt(params.data.substring(14, 16), 16) * parseFloat(12.5) + 1800)/parseFloat(1000);

	let sn = params.custom.seqNumber;
   	let batteryP = 10;
	batteryP = ((maxNumberMsgNew - sn)/maxNumberMsgNew*100).toFixed(0);
    
  	let daysM = "Más de 30 días";

    if (sn > 9000 && sn < 10000) days = "Entre 30 y 15 días";
    else if (sn > 10000 && sn < 11000) days = "Menos de 15 días";
    else if (sn > 11000 && sn < 12000) days = "Menos de 2 días";
    else if (sn > 12000) days = "Sin batería";
  
  
    let percentage = voltage_tx > maxBattery ? 100 : (((voltage_tx - minimumBatteryLevel) / (maxBattery - minimumBatteryLevel)) * 100).toFixed(0);
    percentage = percentage < 0 ? 0 : percentage;

    let acc_x = parseInt(params.data.substring(16, 18), 16);
    let acc_y = parseInt(params.data.substring(18, 20), 16);
    let acc_z = parseInt(params.data.substring(20, 22), 16);

    let acceleration = acc_x +"_"+ acc_y +"_"+ acc_z;
	let absAcceleration = parseFloat(parseFloat((Math.sqrt(acc_x*acc_x + acc_y*acc_y + acc_z*acc_z)) * 100 / 100).toFixed(2));

    result.push({
        "key": "temp_min",
        "value": temp_min
    }, {
        "key": "temp_avg",
        "value": temp_avg
    }, {
        "key": "temp_max",
        "value": temp_max
    }, {
        "key": "voltage_idl",
        "value": voltage_idl
    }, {
        "key": "voltage_tx",
        "value": voltage_tx
    }, {
        "key": "batteryPercentage",
        "value": percentage
    }, {
        "key": "batteryP",
        "value": batteryP
    }, {
        "key": "daysM",
        "value": daysM
    }, {
        "key": "acc_x",
        "value": acc_x
    }, {
        "key": "acc_y",
        "value": acc_y
    }, {
        "key": "acc_z",
        "value": acc_z
    }, {
        "key": "acceleration",
        "value": acceleration
    }, {
        "key": "absAcceleration",
        "value": absAcceleration
    }, {
        "key": "downlink_status",
        "value": "ACK:"+moment().isDST() ? moment().add(1, 'hour').toISOString() : moment().add(2, 'hour').toISOString()
    });

    return callback(null, result);
}


function processCase18(params, result, callback) {
    let voltage = parseInt(params.data.substring(0, 4), 10) / parseFloat(1000);
    let percentage = voltage > maxBattery ? 100 : (((voltage - minimumBatteryLevel) / (maxBattery - minimumBatteryLevel)) * 100).toFixed(0);
    percentage = percentage < 0 ? 0 : percentage;
    let days = "Más de 30 días";

    if (voltage < 3.3 && voltage >= 3.1) days = "Entre 30 y 15 días";
    else if (voltage < 3.1 && voltage >= 2.9) days = "Menos de 15 días";
    else if (voltage < 2.9 && voltage >= 2.7) days = "Menos de 2 días";
    else if (voltage < 2.7) days = "Sin batería";

    let macs = stringToMac(params.data.substring(4, 16));
    let WiFirssi = parseInt(params.data.substring(16, 18), 16);
    WiFirssi = -WiFirssi;

    result.push({
        "key": "batteryVoltage",
        "value": voltage
    }, {
        "key": "batteryDays",
        "value": days
    }, {
        "key": "batteryPercentage",
        "value": percentage
    }, {
        'key': 'WiFirssi',
        'value': WiFirssi
    }, {
        'key': 'wifis',
        'value': macs
    }, {
        'key': 'status',
        'value': 'Ask Downlink. 1 WiFi + 1 WiFi_RSSI'
    });

    return callback(null, result);
}

function processCase24(params, result, callback) {
    let macs = [];
    macs.push(stringToMac(params.data.substring(0, 12)));
    macs.push(stringToMac(params.data.substring(12, 24)));
    result.push({
        "key": "status",
        "value": "2 WiFi"
    });


    thethingsAPI.findGeoMAC(params.thingToken, {macs: macs}, function(err, resF) {
        if (err) callback(err);
        if (!resF || resF.status !== 'success') callback(new Error('Problem at findGeoMAC'));
        if (resF.geo === null) {
            let paramsGMAP = {
                macs: macs,
                thingToken: params.thingToken
            };

            async.waterfall([
                async.apply(getGMAPBody, paramsGMAP),
                callGMAPAPI,
                processGMAPAPIResponse,
                storeGeolocation
            ], function (err, res) {
                if (err) return callback(err);
                result = result.concat(res);
                return callback(null, result);
            });
        } else {
            let macValue = (macs.length === 1) ? macs[0] : macs[0] + '-' + macs[1];
          
          	if (resF.accuracy === "") resF.accuracy = "100";
          
            let resultFind = [{
                'key': 'geolocation',
                'value': 'googlewifi',
                'geo': {
                    'lat': resF.geo.lat,
                    'long': resF.geo.lng
                }
            },
                {
                    'key': 'combinedLocation',
                    'value': 'googlewifi',
                    'geo': {
                        'lat': resF.geo.lat,
                        'long': resF.geo.lng
                    }
                },
                {
                    'key': 'radius',
                    'value': resF.accuracy,
                    'geo': {
                        'lat': resF.geo.lat,
                        'long': resF.geo.lng
                    }
                },
                {
                    'key': 'wifis',
                    'value': macValue,
                    'geo': {
                        'lat': resF.geo.lat,
                        'long': resF.geo.lng
                    }
                },
                {
                    'key': '$geo',
                    'value': [resF.geo.lng, resF.geo.lat]
                }
            ];
            result = result.concat(resultFind);
            return callback(null, result);
        }
    });
}

function checkGApiKey() {
    let result = [];
    if (GOOGLE_API_KEY === 'YOUR GOOGLE API KEY') {
        result = result.concat([{
            'key': 'GMapsErrors',
            'value': 'Google Api Key not configured'
        }]);
    }
    return result;
}

function getGMAPBody(params, callback) {
    let body = {
        'considerIp': 'false',
        'wifiAccessPoints': [{
            'macAddress': params.macs[0]
        }, {
            'macAddress': params.macs[1]
        }]
    };
    return callback(null, params, body);
}

function callGMAPAPI(params, body, callback) {
    httpRequest({
        host: 'www.googleapis.com',
        path: '/geolocation/v1/geolocate?key=' + GOOGLE_API_KEY,
        method: 'POST',
        secure: true,
        headers: {
            'Content-Type': 'application/json'
        }
    }, body, function (err, res) {
        if (err) return callback(err);
        res = JSON.parse(res.result);
        callback(null, params, res);
    });
}



function processGMAPAPIResponse(params, res, callback) {
    if (res.error) return saveError(params.macs, res, 'Google', callback);
    let macValue = (params.macs.length === 1) ? params.macs[0] : params.macs[0] + '-' + params.macs[1];
  
  	if (res.accuracy === "") res.accuracy = "100";

    let result = [{
            'key': 'geolocation',
            'value': 'googlewifi',
            'geo': {
                'lat': res.location.lat,
                'long': res.location.lng
            }
        },
        {
            'key': 'combinedLocation',
            'value': 'googlewifi',
            'geo': {
                'lat': res.location.lat,
                'long': res.location.lng
            }
        },
        {
            'key': 'radius',
            'value': res.accuracy,
            'geo': {
                'lat': res.location.lat,
                'long': res.location.lng
            }
        },
        {
            'key': 'wifis',
            'value': macValue,
            'geo': {
                'lat': res.location.lat,
                'long': res.location.lng
            }
        },
        {
            'key': '$geo',
            'value': [res.location.lng, res.location.lat]
        }
    ];

    params.lat = res.location.lat;
    params.lng = res.location.lng;
    params.accuracy = res.accuracy;
    params.source = "Google Maps Api";

    return callback(null, params, result);
}

function storeGeolocation(params, result, callback) {
    if (params.error === 'true') return callback(null, result);
    let payload = {
        "macs": params.macs,
        "lat": params.lat,
        "lng": params.lng,
        "radius": params.accuracy,
        "source": params.source
    };

    thethingsAPI.submitGeoMAC(params.thingToken, payload, function () {
        callback(null, result);
    });
}

function saveError(macs, res, source, callback) {

    let macValue = (macs.length === 1) ? macs[0] : macs[0] + '-' + macs[1];
    let result = [];
    if (source === 'Google') {
        result.push({
            'key': 'Errors',
            'value': "Google Api Message: " + res.error.message
        }, {
            'key': 'wifis',
            'value': macValue
        });
    } else {
        result.push({
            'key': 'Errors',
            'value': "Mylnikov: " + res.desc
        }, {
            'key': 'wifis',
            'value': macValue
        });
    }
    return callback(null, {
        error: 'true'
    }, result);
}

// BIG ENDIAN TO LITTLE ENDIAN
function rev(v) {
    let s = v.replace(/^(.(..)*)$/, '0$1'); // add a leading zero if needed
    let a = s.match(/../g); // split number in groups of two
    a.reverse(); // reverse the groups
    return a.join(''); // join the groups back together
}

// STRING TO MAC ADDRESS
function stringToMac(string) {
    return rev(string).match(/.{1,2}/g).reverse().join(':');
}
