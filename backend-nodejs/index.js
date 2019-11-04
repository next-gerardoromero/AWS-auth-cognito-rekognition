
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

var express = require('express');
var fileUpload = require('express-fileupload');

global.fetch = require('node-fetch');
global.navigator = () => null;

// Enter copied or downloaded access ID and secret key here
const ID = '';
const SECRET = '';
const BUCKET_NAME = 'photousers';

const APP_ID_COGNITO ='';
const USER_POOL_ID ='us-west-2_P7oACUvuL';

var app = express();

const UserRouter = express.Router();
const S3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

app.use('/',express.static(__dirname + '/../public'));
app.use(fileUpload());
app.use('/user', UserRouter);

app.listen(5555, function () {
	console.log('Listening on port 5555!');
})

UserRouter.route('/create').post(function (req, res) {
   console.log(req.body);
   var email = req.body.email;
   var password = req.body.password;
   var phone = '+15555555555';
   var archivo = req.files.imagen;
   var data =req.files.imagen.data;
   var nameFile = archivo.name
   
  

   uploadFile(nameFile,data,email);
   createUser(email,phone,password);
   res.status(200).send('User added successfully');

  });

  


const createUser = (email,phone,password) =>{
    var poolData = { 
        UserPoolId :  USER_POOL_ID,
        ClientId : APP_ID_COGNITO
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var attributeList = [];
    
    var dataEmail = {
        Name : 'email',
        Value : email
    };
    var dataPhoneNumber = {
        Name : 'phone_number',
        Value : phone
    };
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber);

    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);

    userPool.signUp(email, password, attributeList, null, function(err, result){
        if (err) {
            console.log(err);
            return;
        }
        cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());
    });
}



const uploadFile = (fileName,fileContent,email) => {

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        Metadata :{
            'email': email
        },
    };


    S3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};