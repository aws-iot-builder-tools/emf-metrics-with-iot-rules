import {
    IoTClient, CreateThingCommand, CreateKeysAndCertificateCommand, AttachPolicyCommand, AttachThingPrincipalCommand,
} from "@aws-sdk/client-iot";
import fs from 'fs';

//store a string into a file with file name fileName
const storeToFile = (fileName, data) => {
    if (!fs.existsSync('./certs')) {
        fs.mkdirSync('./certs');
    }
    fs.writeFileSync('certs/'+ fileName, data, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

//create an iot thing
const createThing = async (iotClient, thingName) => {
    const params = {
        thingName: thingName
    };
    return await iotClient.send(new CreateThingCommand(params));
}

//create a new certificate and private key. Activate certificate.
const createKeysAndCertificate = async (iotClient) => {
    return await iotClient.send(new CreateKeysAndCertificateCommand({
        setAsActive: true
    }));
}

//attach the policy to the certificate
const attachPolicy = async (iotClient, policyName, certificateArn) => {
    const params = {
        policyName: policyName, target: certificateArn
    };
    return await iotClient.send(new AttachPolicyCommand(params));
}

//attach the thing to the certificate
const attachThingPrincipal = async (thingName, iotClient, certificateArn) => {
    const params = {
        thingName: thingName, principal: certificateArn
    };
    return await iotClient.send(new AttachThingPrincipalCommand(params));
}

//execute create thing function, create keys and certificate, attach policy and attach thing principal
export const execute = async (thingName, region) => {
    //create iot client
    const iotClient = new IoTClient({region: region});
    const thing = await createThing(iotClient, thingName);
    const {certificateArn, keyPair, certificatePem} = await createKeysAndCertificate(iotClient);
    //store the private key and certificate to a file
    storeToFile(thingName + ".private.key", keyPair.PrivateKey);
    storeToFile(thingName + ".cert.pem", certificatePem);
    await attachPolicy(iotClient, "MyApp123IoTPolicy", certificateArn);
    await attachThingPrincipal(thingName, iotClient, certificateArn);
    return thing;
}

