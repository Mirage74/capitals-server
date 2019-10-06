const axios = require('axios')
let pathServer = "https://koa-jwt.herokuapp.com/user"
//let pathServer = "http://proxyservice-env.gujm6w8yic.us-east-2.elasticbeanstalk.com/proxy"
//let pathServer = "https://proxy-service-rest.azurewebsites.net/proxy"


const configAx = {
  "displayName": "John", 
  "email": "jdoe@gmail.com", 
  "password": "123456" 
  }
axios.post(
    pathServer,
    configAx
)
    .then(res => {
        console.log(res.data)
    })
