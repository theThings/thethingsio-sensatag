let GOOGLE_API_KEY = 'YOUR GOOGLE API KEY';

let maxBattery = 3.6;
let minimumBatteryLevel = 2.6;

function main(params, callback) {
    let result = checkGApiKey();
    if (result.length > 0) return callback(null, result);

    switch (params.data.length) {
        case 2:
            processCase2(params, callback);
            break;
        case 6:
            processCase6(params, callback);
            break;
        case 14:
            processCase14(params, callback);
            break;
        case 18:
            processCase18(params, callback);
            break;
        case 24:
            processCase24(params, callback);
            break;
        default:
            result = result.concat([{'key': 'sigfox-error', 'value': 'Payload size not corresponding to any usecase.' }]);
            return callback(null, result);
    }
}


function processCase2(params, callback) {
    let status = parseInt(params.data.substring(0, 2), 10);
    if (status === 1) status = "Just powered";
    else status = "No access point";

    let result = [
      	{"key": "status", "value": status }, { "key": "sgfx-payload", "value": params.custom}, {"key": "snr", "value": params.custom.snr}, 			{"key": "time", "value": params.custom.time}, {"key": "duplicate", "value": params.custom.duplicate}, 
      	{"key": "station", "value": params.custom.station}, {"key": "avgSnr", "value": params.custom.avgSnr}, 
      	{"key": "rssi","value": params.custom.rssi}, {"key": "seqNumber", "value": params.custom.seqNumber}];
  
    callback(null, result);
}

function processCase6(params, callback) {
    let voltage = parseInt(params.data.substring(0, 4), 10) / parseFloat(1000);
    let percentage = voltage > maxBattery ? 100 : (((voltage - minimumBatteryLevel) / (maxBattery - minimumBatteryLevel)) * 100).toFixed(0);
    percentage = percentage < 0 ? 0 : percentage;
    let days = "Más de 30 días";

    if (voltage < 3.3 && voltage >=3.1) days = "Entre 30 y 15 días";
    else if (voltage < 3.1 && voltage >=2.9) days = "Menos de 15 días";
    else if (voltage < 2.9 && voltage >= 2.7) days = "Menos de 2 días";
    else if (voltage < 2.7) days = "Sin batería";

    let status = parseInt(params.data.substring(4, 6), 10);
    if (status === 20) status = "Ask Downlink. No WAP";
    else status = "Wrong message";

    let result = [
        {"key": "status", "value": status}, {"key": "batteryVoltage", "value": voltage}, {"key": "batteryDays", "value": days},
        {"key": "batteryPercentage", "value": percentage}, { "key": "sgfx-payload", "value": params.custom}, {"key": "snr", "value": params.custom.snr}, {"key": "time", "value": params.custom.time}, {"key": "duplicate", "value": params.custom.duplicate}, {"key": "station", "value": params.custom.station}, {"key": "avgSnr", "value": params.custom.avgSnr}, {"key": "rssi","value": params.custom.rssi}, {"key": "seqNumber", "value": params.custom.seqNumber}];

    callback(null, result);
}

function processCase14(params, callback) {

    let macs = [];
    macs.push(stringToMac(params.data.substring(0, 12)));

    let WiFirssi = parseInt(params.data.substring(12, 14), 16);
    WiFirssi = -WiFirssi;

    let result = [];
    result.push({'key': 'WiFirssi', 'value': WiFirssi}, {'key': 'status', 'value': '1 WiFi + 1 WiFi_RSSI'});

    let paramsMylnikov = {macs: macs, thingToken: params.thingToken};
    async.waterfall([
        async.apply(callMylnikovAPI, paramsMylnikov),
        processMylnikovAPIResponse,
        storeGeolocation
    ], function(err, res) {
        if (err) callback(err);
        result = result.concat(res);
        result.push({ "key": "sgfx-payload", "value": params.custom}, {"key": "snr", "value": params.custom.snr}, {"key": "time", "value": params.custom.time}, {"key": "duplicate", "value": params.custom.duplicate}, {"key": "station", "value": params.custom.station}, {"key": "avgSnr", "value": params.custom.avgSnr}, {"key": "rssi","value": params.custom.rssi}, {"key": "seqNumber", "value": params.custom.seqNumber});
        return callback(null, result);
    });
}

function processCase18(params, callback) {
    let voltage = parseInt(params.data.substring(0, 4), 10) / parseFloat(1000);
    let percentage = voltage > maxBattery ? 100 : (((voltage - minimumBatteryLevel) / (maxBattery - minimumBatteryLevel)) * 100).toFixed(0);
    percentage = percentage < 0 ? 0 : percentage;
    let days = "Más de 30 días";

    if (voltage < 3.3 && voltage >=3.1) days = "Entre 30 y 15 días";
    else if (voltage < 3.1 && voltage >=2.9) days = "Menos de 15 días";
    else if (voltage < 2.9 && voltage >= 2.7) days = "Menos de 2 días";
    else if (voltage < 2.7) days = "Sin batería";

    let macs = [];
    macs.push(stringToMac(params.data.substring(4, 16)));
    let WiFirssi = parseInt(params.data.substring(16, 18), 16);
    WiFirssi = -WiFirssi;
    let result = [];

    result.push(
        {'key': 'WiFirssi', 'value': WiFirssi},
        {'key': 'status', 'value': 'Ask Downlink. 1 WiFi + 1 WiFi_RSSI'},
        {'key': 'batteryVoltage', 'value': voltage},
        {'key': 'batteryDays', 'value': days},
        {'key': 'batteryPercentage', 'value': percentage}, {"key": "snr", "value": params.custom.snr}, {"key": "time", "value": params.custom.time}, {"key": "duplicate", "value": params.custom.duplicate}, {"key": "station", "value": params.custom.station}, {"key": "avgSnr", "value": params.custom.avgSnr}, {"key": "rssi","value": params.custom.rssi}, {"key": "seqNumber", "value": params.custom.seqNumber});


    let paramsMylnikov = {macs: macs, thingToken: params.thingToken};
    async.waterfall([
        async.apply(callMylnikovAPI, paramsMylnikov),
        processMylnikovAPIResponse,
        storeGeolocation
    ], function(err, res) {
        if (err) callback(err);
        result = result.concat(res);

        result.push({ "key": "sgfx-payload", "value": params.custom});
        return callback(null, result);
    });
}

function processCase24(params, callback) {
    let macs = [];
    macs.push(stringToMac(params.data.substring(0, 12)));
    macs.push(stringToMac(params.data.substring(12, 24)));
    let result = [];
    result.push({"key": "status", "value": "2 WiFi"});

    let paramsGMAP = {macs: macs, thingToken: params.thingToken};
    async.waterfall([
        async.apply(getGMAPBody, paramsGMAP),
        callGMAPAPI,
        processGMAPAPIResponse,
        storeGeolocation
    ], function(err, res) {
        if (err)
            callback(err);
        result = result.concat(res);
        result.push({ "key": "sgfx-payload", "value": params.custom}, {"key": "snr", "value": params.custom.snr}, {"key": "time", "value": params.custom.time}, {"key": "duplicate", "value": params.custom.duplicate}, {"key": "station", "value": params.custom.station}, {"key": "avgSnr", "value": params.custom.avgSnr}, {"key": "rssi","value": params.custom.rssi}, {"key": "seqNumber", "value": params.custom.seqNumber});
        return callback(null, result);
    });
}

function checkGApiKey() {
    let result = [];
    if (GOOGLE_API_KEY == 'YOUR GOOGLE API KEY') {
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
        'wifiAccessPoints': [{'macAddress': params.macs[0]}, {'macAddress': params.macs[1]}]
    };
    return callback(null, params, body);
}

function callGMAPAPI(params, body, callback) {
    httpRequest({
        host: 'www.googleapis.com',
        path: '/geolocation/v1/geolocate?key=' + GOOGLE_API_KEY,
        method: 'POST',
        secure: true,
        headers: {'Content-Type': 'application/json'}
    }, body, function(err, res) {
        if (err) return callback(err);
        res = JSON.parse(res.result);
        callback(null, params, res);
    });
}

function callMylnikovAPI(params, callback) {
    // More information here: https://www.mylnikov.org/archives/1170
    httpRequest({
        host: 'api.mylnikov.org',
        path: '/geolocation/wifi?v=1.1&data=open&bssid=' + params.macs,
        method: 'GET',
        secure: true
    }, function(err, res) {
        if (err) return callback(err);
        res = JSON.parse(res.result);
        callback(null, params, res);
    });
}

function processMylnikovAPIResponse(params, res, callback) {
    if (res.result != 200) {
        return saveError(params.macs, res, 'Mylikinov', callback);
    }
    let result = [
        {'key': 'geolocation', 'value': 'MylnikovAPI', 'geo': {'lat': res.data.lat, 'long': res.data.lon}},
        {'key': 'combinedLocation', 'value': 'MylnikovAPI', 'geo': {'lat': res.data.lat, 'long': res.data.lon}},
        {'key': 'googleAccuracy', 'value': res.data.range},
        {'key': 'wifis', 'value': params.macs, 'geo': {'lat': res.data.lat, 'long': res.data.lon}},
        {'key': '$geo', 'value': [res.data.lon, res.data.lat]}
    ];
    params.lat = res.data.lat;
    params.lng = res.data.lon;
    params.accuracy = res.data.range;
    params.source = "Mylnikov API";

    return callback(null, params, result);
}

function processGMAPAPIResponse(params, res, callback) {
    if (res.error) return saveError(params.macs, res, 'Google', callback);
    let macValue = (params.macs.length === 1) ? params.macs[0] : params.macs[0] + '-' + params.macs[1];

    let result = [
        {'key': 'geolocation', 'value': 'googlewifi', 'geo': {'lat': res.location.lat, 'long': res.location.lng}},
        {'key': 'combinedLocation', 'value': 'googlewifi', 'geo': {'lat': res.location.lat, 'long': res.location.lng}},
        {'key': 'googleAccuracy', 'value': res.accuracy},
        {'key': 'wifis', 'value': macValue, 'geo': {'lat': res.location.lat, 'long': res.location.lng}},
        {'key': '$geo', 'value': [res.location.lng, res.location.lat]}
    ];

    params.lat = res.location.lat;
    params.lng = res.location.lng;
    params.accuracy = res.accuracy;
    params.source = "Google Maps Api";

    return callback(null, params, result);
}

function storeGeolocation(params, result, callback) {
    if(params.error === 'true') return callback(null,result)
    let payload = {"macs": params.macs, "lat": params.lat, "lng": params.lng, "accuracy": params.accuracy, "source": params.source};

    thethingsAPI.submitGeoMAC(params.thingToken, payload, function() {
        callback(null, result);
    });
}

function saveError(macs, res, source, callback) {

    let macValue = (macs.length === 1) ? macs[0] : macs[0] + '-' + macs[1];
    let result=[];
    if (source == 'Google') {
        result.push({'key': 'Errors', 'value': "Google Api Message: " + res.error.message}, {'key': 'wifis', 'value': macValue});
    } else {
        result.push({'key': 'Errors', 'value': "Mylnikov: " + res.desc}, {'key': 'wifis', 'value': macValue});
    }
    return callback(null,{error:'true'}, result);
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
