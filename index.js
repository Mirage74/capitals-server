const Koa = require('koa'); // core
const Router = require('koa-router'); // routing
const bodyParser = require('koa-bodyparser'); // POST parser
const serve = require('koa-static'); // serves static files like index.html
const logger = require('koa-logger'); // optional module for logging

const passport = require('koa-passport'); //passport for Koa
const LocalStrategy = require('passport-local'); //local Auth Strategy

const mongoose = require('./libs/mongoose');


const app = new Koa()
const router = new Router()

const subRouter = new Router({
  prefix: '/score'
})
app.use(serve('public'));
app.use(logger());
app.use(bodyParser());



app.use(async (ctx, next) => {
  const origin = ctx.get('Origin');
  //console.log(ctx.method)
  if (ctx.method !== 'OPTIONS') {
    ctx.set('Access-Control-Allow-Origin', origin);
    ctx.set('Access-Control-Allow-Credentials', 'true');
  } else if (ctx.get('Access-Control-Request-Method')) {
    ctx.set('Access-Control-Allow-Origin', origin);
    ctx.set('Access-Control-Allow-Methods', ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']);
    ctx.set('Access-Control-Allow-Headers', ['Content-Type', 'Authorization', 'Access-Control-Allow-Headers', 'headers']);
    ctx.set('Access-Control-Max-Age', '42');
    ctx.set('Access-Control-Allow-Credentials', 'true');
    ctx.response.status = 200
    //console.log('ctx.response.status', ctx.response.status)
  }
  await next();
});





app.use(passport.initialize()); // initialize passport first
app.use(router.routes()); // then routes
app.use(subRouter.routes()); // then routes
const server = app.listen(process.env.PORT || 4000);// launch server on port  4000


//---------Use Schema and Module  ------------------//

const User = require('./libs/user')

//----------Passport Local Strategy--------------//




passport.use(new LocalStrategy({
  usernameField: 'login',
  passwordField: 'password',
  session: false
},
  function (displayName, password, done) {
    User.findOne({ displayName }, (err, user) => {
      if (err) {
        return done(err);
      }

      if (!user || !user.checkPassword(password)) {
        return done(null, false, { message: 'User does not exist or wrong password.' });
      }
      return done(null, user);
    })
  })
)

//----------Passport JWT Strategy--------//

// Expect JWT in the http header

//const jwtOptions = {
//  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
//  secretOrKey: jwtsecret
//};

//passport.use(new JwtStrategy(jwtOptions, function (payload, done) {
//  User.findById(payload.id, (err, user) => {
//    if (err) {
//      return done(err)
//    }
//    if (user) {
//      done(null, user)
//    } else {
//      done(null, false)
//    }
//  })
//})
//);

//------------Routing---------------//

// new user route


router.param('userByDisplayname', async (displayName, ctx, next) => {
//console.log("param dispname")
   ctx.userByDisplayname = await User.findOne({ displayName: displayName })
   if (!ctx.userByDisplayname) {
    ctx.userByDisplayname = {displayName : "NOT_EXIST_USER"}
  }
  await next();
})

subRouter.param('lvlNum', async (lvlNum, ctx, next) => {
//console.log("lvlNum PARAM", lvlNum)
//console.log("lvlNum PARAM parseInt(lvlNum)", parseInt(lvlNum))
    ctx.lvlNum = parseInt(lvlNum)

  await next();
})




router.post('/user', async (ctx, next) => {
  ctx.request.body.displayName = ctx.request.body.displayName.toLowerCase()
  let user
  try {
    user = await User.findOne({ displayName: ctx.request.body.displayName })
  }

  catch (err) {
    ctx.status = 400
    console.log(err)
    ctx.body = err
  }

  if (!user) {
    try {
      let user = await User.create(ctx.request.body)
      ctx.body = user.toObject();
    }
    catch (err) {
      ctx.status = 400
      console.log(err)
      ctx.body = err
    }
  } else {
    ctx.body = `User with "displayName" ${ctx.request.body.displayName} already exist !`
  }
});

// local auth route. Creates JWT is successful




router.post('/login', async (ctx, next) => {
  ctx.request.body.login =   ctx.request.body.login.toLowerCase()
  await passport.authenticate('local', function (err, user) {
    if (user == false) {
      ctx.body = "Login failed";
    } else {

      let userObj = {
        _id: user._id,
        displayName: user.displayName,
        bestScore: user.bestScore,
        lastRes: user.lastRes,
        debuginfo: user.debuginfo
      } 
    ctx.body = userObj
  }
  })(ctx, next);
});


router.get('/:userByDisplayname',  async function(ctx) {
      let userObj = {
        _id: ctx.userByDisplayname._id,
        displayName: ctx.userByDisplayname.displayName,
        bestScore: ctx.userByDisplayname.bestScore,
        lastRes: ctx.userByDisplayname.lastRes
      } 
    ctx.body = userObj
})


subRouter.get('/:lvlNum',  async function(ctx) {
    let qry
    let users = await User.find().exec()
    let usersArr = []
    for (let i = 0; i < ctx.lvlNum; i++) {
      qry = {}
      qry[`bestScore.${i}`] = { $gt: 0 }	
//      console.log("qry", qry)
//      console.log("i", i)
      let users = await User.find(qry).exec()
      users = users.map( item => 
        [
          item._id,
          item.displayName,
          item.bestScore[i],
          item.lastRes[i]
        ]     
      )
    usersArr.push(users)
  }

    ctx.body = usersArr
})


router.put('/:userByDisplayname',  async function(ctx) {
    const user = await User.updateOne({_id:ctx.userByDisplayname._id}, ctx.request.body.data);
    ctx.body = user.nModified
})






//---Socket Communication-----//
//let io = socketIO(server);

//io.on('connection', socketioJwt.authorize({
//  secret: jwtsecret,
//  timeout: 15000
//})).on('authenticated', function (socket) {

//  console.log('this is the name from the JWT: ' + socket.decoded_token.displayName);

//  socket.on("clientEvent", (data) => {
//    console.log(data);
//  })
//})
