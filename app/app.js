import mqtt from 'mqtt';
import fs from 'fs';
import {config} from "./config.js";
import {execute} from "./set-up-thing.js";
import {v4} from 'uuid';
import si from "systeminformation";
import convertSize from "convert-size";

const samplingInterval = 5 * 1000;
const reportingInterval = 15 * 1000;

//In memory array. This will be used to store the metrics.
let metrics = [];

const appId = v4();
const CLIENT_ID = 'MyApp123';
const METRICS_PUB_TOPIC = `$aws/rules/emf/${CLIENT_ID}/logs`;

const PORT = 8883;
const CERT_FILE = `./certs/${CLIENT_ID}.cert.pem`;
const KEY_FILE = `./certs/${CLIENT_ID}.private.key`;
const REGION = config.region;
const ENDPOINT = config.iotEndpoint;

execute(CLIENT_ID, REGION)
    .then(() => {
        const options = {
            clientId: CLIENT_ID,
            host: ENDPOINT,
            port: PORT,
            protocol: 'mqtts',
            protocolVersion: 5,
            cert: fs.readFileSync(CERT_FILE),
            key: fs.readFileSync(KEY_FILE),
            reconnectPeriod: 0,
            enableTrace: false
        }
        //connect to the mqtt broker
        const client = mqtt.connect(options);
        client.on('connect', (packet) => {
            console.log('connected');
        });

        //Reading memory and stats at sampling interval. Storing in memory.
        setInterval(async () => {
            //Store stats.
            console.log('Storing stats');
            await storeStatistics();
        }, samplingInterval);

        let messageId = 0;
        //Report memory and stats in EMF format at reporting interval.
        setInterval(() => {
            console.log('Starting to send stats');
            let message = {
                batch: []
            }
            metrics.forEach(metric => {
                message.batch.push(
                    {"timestamp": Date.now(), "message": JSON.stringify(metric)});
            })
            console.log('Publishing', message)
            client.publish(METRICS_PUB_TOPIC, JSON.stringify(message), {
                qos: 1,
                properties: {
                    contentType: 'application/json',
                    correlationData: JSON.stringify({messageId: messageId, appId: appId})
                }
            });
            messageId ++;
            metrics = [];
            console.log('Publishing', message)
            client.publish(METRICS_PUB_TOPIC, JSON.stringify(message), {
                qos: 1,
                properties: {
                    contentType: 'application/json',
                    correlationData: JSON.stringify({messageId: messageId, appId: appId})
                }
            });
        }, reportingInterval);

    })
    .catch(err => {
        console.log(err);
    });

const storeStatistics = async () => {
    try {
        const network = await si.networkStats();
        const memory = await si.mem();
        const network_0 = network[0];
        const iface = network_0.iface;

        const statObject = {
            "_aws": {
                "Timestamp": Date.now(),
                "CloudWatchMetrics": [
                    {
                        "Namespace": "iot-device-memory",
                        "Dimensions": [["thingName"]],
                        "Metrics": [
                            {
                                "Name": "total",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "free",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "used",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "active",
                                "Unit": "Kb",
                                "StorageResolution": 60
                            }, {
                                "Name": "available",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                        ]
                    },
                    {
                        "Namespace": "iot-device-network",
                        "Dimensions": [["thingName"]],
                        "Metrics": [
                            {
                                "Name": "operstate",
                                 "Unit": "String",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "rx_bytes",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "rx_dropped",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "rx_errors",
                                "Unit": "Count",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "tx_bytes",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            }, {
                                "Name": "tx_dropped",
                                "Unit": "Kb",
                                "StorageResolution": 1
                            },
                            {
                                "Name": "tx_errors",
                                "Unit": "Count",
                                "StorageResolution": 1
                            }, {
                                "Name": "ms",
                                "Unit": "Milliseconds",
                                "StorageResolution": 1
                            },
                        ]
                    }
                ]
            },
            "thingName": CLIENT_ID,
            "total": convertSize(memory.total, "KB"),
            "free": convertSize(memory.free,"KB"),
            "used": convertSize(memory.used,"KB"),
            "active": convertSize(memory.active,"KB"),
            "available": convertSize(memory.available,"KB"),
            "iface": iface,
            "operstate": network_0.operstate,
            "rx_bytes": convertSize(network_0.rx_bytes,"KB"),
            "rx_dropped": convertSize(network_0.rx_dropped,"KB"),
            "rx_errors": network_0.rx_errors,
            "tx_bytes": convertSize(network_0.tx_bytes,"KB"),
            "tx_dropped": convertSize(network_0.tx_dropped,"KB"),
            "tx_errors": network_0.tx_errors,
            "ms": network_0.ms,
            "requestId": v4()
        }
        metrics.push(statObject);

    } catch (err) {
        console.error('[Main] Error publishing stats', err);
    }
};