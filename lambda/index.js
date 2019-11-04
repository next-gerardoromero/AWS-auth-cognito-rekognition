
const       AWS = require('aws-sdk');

const s3            = new AWS.S3();
const rekognition   =  new AWS.Rekognition();
const dynamodb      = new AWS.DynamoDB();

const collectionRekognition = "Jet";
const tableDynamo = "UserMeta";



exports.handler = function(event, context, callback) {

    console.log("=== Event Put Object S3 ===");
    var faceId;
    let bucketName = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    let key = decodeURIComponent( event.Records[0].s3.object.key.replace(/\+/g, " ") );

    let paramsS3 = { Bucket: bucketName, Key: key };
    let paramsRekognition = {
        CollectionId: collectionRekognition,
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: key
            }
        }
    };

    
    indexFaces(paramsRekognition)
        .then(response =>{            
            faceId = response.detail.FaceRecords[0].Face.FaceId;
            console.log("Rekognition ID = " + faceId);
            return  getMetadata(paramsS3);
        })
        .then(response =>{
            console.log( response.detail);
            let paramsDB = {
                Item: {
                  RekognitionId: { S: faceId },
                  Email: { S: response.detail.Metadata["email"] }
                },
                TableName: tableDynamo 
            };            
            return putItem(paramsDB);
        })
        .then(response=>{
            console.log(" Successfully execute ");
            console.log(response.detail);
        })
        .catch(err =>{
            console.log(":: Error :");
            console.log(err);
        });

};




const indexFaces = (request) =>{
    console.group(":: indexFaces");
    return new Promise((resolve, reject) => {
        rekognition.indexFaces(request, (err, data)=> {
            if( err) {
                reject({
                    code: "NOK",
                    reason: ":: indexFaces: Error indexFaces!",
                    detail: err.stack
                })
            }else{
                resolve({
                    code: "OK",
                    reason: ":: indexFaces: Execute Successfully",
                    detail: data
                });
            } 
        });
    });
}

const getMetadata = (request) =>{
     console.log(":: getMetadata");
     return new Promise((resolve, reject) => {
        s3.headObject(request, (err, data) => {         
            if( data !== null && typeof data === 'object') {
                resolve({
                    code: "OK",
                    reason: ":: getMetadata: Error getting Metadata!",
                    detail: data
                })
            }else{
                reject({
                    code: "KOK",
                    reason: ":: getMetadata: Execute Successfully",
                    detail: err
                });
            } 
        });
    });
}

const putItem = (request) =>{
    console.log(":: putItem");
    return new Promise((resolve, reject) => {
        dynamodb.putItem(request, (err, data) => {
            if( err) {
                reject({
                    code: "NOK",
                    reason: ":: putItem: Error putting Item!",
                    detail: err.stack
                })
            }else{
                resolve({
                    code: "OK",
                    reason: ":: putItem: Execute Successfully",
                    detail: data
                });
            }       
        });
    });
}
