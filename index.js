const express=require('express');
const app=express();
var connection= require("./database")
const bodyParser=require('body-parser')
const cors = require('cors')
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}))
const jwt = require("jsonwebtoken")
const axios= require('axios')

const users = [
    {
        id:"1",
        username:"John",
        password:"John0908",
        isAdmin:true,
    },
    {
        id:"2",
        username:"Jane",
        password:"Jane0908",
        isAdmin:false,
    },
]
// connection.query("select * from rides",(err,result)=>{
    
//     console.log(result)
// })

let hash=[]
    // const users =axios.get("http://localhost:2000/data")
    // .then(res=>{return(res.data)})

    // console.log(users)
let refreshTokens=[]

app.post("/api/refresh",(req,res)=>{
    const refreshToken = req.body.token
if(!refreshToken) return res.status(401).json("You are not authenticated")
if(!refreshTokens.includes(refreshToken)){
    return res.status(403).json("refresh token is not valid")
}
jwt.verify(refreshToken,"myrefreshsecretkey",(err,user)=>{
    err && console.log(err)
    refreshTokens =refreshTokens.filter((token)=> token !==refreshToken)
    const newAccessToken=generateAccessToken(user)
    const newRefreshToken =generateRefreshToken(user)
    refreshTokens.push(newRefreshToken)
    res.status(200).json({
        accessToken: newAccessToken,
        refreshToken:newRefreshToken,
    })
})
})
const generateAccessToken = (user) =>{
    return(jwt.sign({id:user.id,isAdmin:user.isAdmin},"mysecretkey",
    {expiresIn:"15m"})
    )
}
const generateRefreshToken = (user) =>{
    return(jwt.sign({id:user.id,isAdmin:user.isAdmin},"myrefreshsecretkey",
    {expiresIn:"15m"}))
}
app.post("/api/login",(req,res)=>{
    const {username,password} = req.body;
    const user = users.find((u)=>{
        return u.username === username && u.password === password
    })
    if(user){
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        refreshTokens.push(refreshToken)
        res.json({
            id:user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
            
        })
       
           
    }
    
    else
    res.status(400).json("user or password incorrect")
})

const verify = (req,res,next) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
const token = authHeader.split(" ")[1];
jwt.verify(token,"mysecretkey",(err,user)=>{
    if(err) {
        return res.status(403).json("token invalid")
    }
    req.user = user
    next();
})
    }
    else{
        res.status(401).json("You are not authenticated")
    }
}
app.delete("/api/users/:userId",verify,(req,res)=>{
    if(req.user.id === req.params.userId || req.user.isAdmin){
        res.status(200).json('user has been deleted')
    }
    else {
        res.status(403).json("you are not allowed to delete this user")
    }
})
app.post("api.logout",verify,(req,res)=>{
    const refreshToken=req.body.token;
    refreshTokens=refreshTokens.filter((token)=>token!==refreshToken)
    res.status(200).json("you logged out succesfully")
})
app.post("/",(req,res)=>{
    const moviename= req.body.moviename;
    const movierating=req.body.rating
    connection.query("insert into customer (moviename,movierating) values(?,?);",[moviename,movierating],(result,err)=>{
     res.send("hi")
        console.log(result)
       
    })

   
})
app.get("/check/:cid/:eid",(req,res)=>{
    const eid=req.params.eid
    const cid=req.params.cid
    connection.query("select * from events where cid=? and eid=?",[cid,eid],(err,result)=>{
        res.send(result)
    })
    
})
app.post("/insert",(req,res)=>{
    const rname= req.body.rname;
    const eid=req.body.eid;
    const price=req.body.price;
    const cid=req.body.cid;

    connection.query("insert into events(Eid,Ftype,Price,Cid,Rname) values(?,\"Rides\",?,?,?);",[eid,price,cid,rname],(result,err)=>{
        res.send("inserted")
    })
})
app.get("/get",(req,res)=>{
    connection.query("select * from newdb.events where Eid=1",(err,result)=>{
    res.send(result)
    })
})
app.get("/data",(req,res)=>{
    connection.query("select * from newdb.customer",(err,result)=>{
        res.send(result)
    })
})
app.get("/rides",(req,res)=>{
    connection.query("select * from rides",(err,result)=>{
        res.send(result)
    })
})
app.post("/sum",(req,res)=>{
    const cid=req.body.cid
    
    connection.query("select sum(price) as sum from events where cid = ?",[cid],(err,result)=>{
        res.send(result)
       
    })
})
app.post("/delete/:cid/:id",(req,res)=>{
    const eid=req.params.id;
    const cid=req.params.cid;
    connection.query("delete from events where Eid=? and cid=?",[eid,cid],(result,err)=>{
        res.send("deleted succesfully")
    })
})
app.get("/filter",(req,res)=>{
connection.query("select exists(select * from rides where Rname= 'Roller coaster') as filter;",(err,result)=>{
    res.send(result)
})
})

app.listen(2000,()=>{
    connection.connect(function(err){

        if(err) throw err;
        console.log('database connected')
    })
    console.log("app running on port 2000")
})
// dont get it