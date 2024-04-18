const express = require('express')
const cors = require('cors')
const config = require('./db/config')
const Products = require('./db/Products')
const User = require('./db/User')

const Jwt = require('jsonwebtoken')
const jwtkey = 'ecommerce'

const app = express()
app.use(express.json())
app.use(cors())

app.post("/register", async(req, resp)=>{
    let user = new User(req.body)
    let result = await user.save()
    result = result.toObject()
    delete result.password
    Jwt.sign({result},jwtkey, {expiresIn:"48h"}, (error, token) =>{
        if(error){
            resp.send({result: "token expired"})
        }
        resp.send({result, auth:token})
    })

})

app.post("/login", async(req, resp) => {
    if(req.body.email && req.body.password){
        let user = await User.findOne(req.body).select('-password')  
    if(user){
        Jwt.sign({user},jwtkey, {expiresIn:"2h"}, (error, token) =>{
            if(error){
                resp.send({result: "token expired"})
            }
            resp.send({user, auth:token})
        })
        
    }else{
        resp.send("no record found")
    }
    }
    else{
        resp.send("either email or password missing")
    }
})

app.post('/add-product',verifyToken, async(req, resp)=>{
    const productData = req.body
    let product = new Products(productData)
    let result = await product.save()
    resp.send(result)
})

app.get('/list-product',verifyToken, async(req, resp)=>{
    let product = await Products.find()
    if(product.length>0){
        resp.send(product)
    }else{
        resp.send({result:"No Products Found!"})
    }
    
})

app.delete('/delete-product/:id',verifyToken, async(req, resp) => {
    let product = await Products.deleteOne({_id:req.params.id})
    if(product.length>0){
        resp.send(product)
    }else{
        resp.send({result:"No Products Found"})
    }
})

app.get("/product/:id",verifyToken, async(req, resp) =>{
    let result = await Products.findOne({_id:req.params.id})
    if(result){
        resp.send(result)
    }else{
        resp.send({result: "No Records Found"})
    }
})

app.put('/product/:id',verifyToken, async(req, resp)=>{
    let result = await Products.updateOne(
        {_id:req.params.id},
        {
            $set: req.body
        }
        )
        resp.send(result)
})

app.get('/search/:key', verifyToken, async(req, resp) =>{
    let result = await Products.find({
        "$or":[
            {name: {$regex: req.params.key}},
            // {price: {$regex: req.params.key}},
             {category: {$regex: req.params.key}},
             {brand: {$regex: req.params.key}},
        ]
    })
    resp.send(result)
    
})

function verifyToken(req, resp, next){
    let token = req.headers['authorization']
    if(token){
        token = token.split(' ')[1]
        console.warn("middleware called", token)
        Jwt.verify(token, jwtkey, (err, valid)=>{
            if(err){
                resp.status(401).send({result: "please provide valid token"})
            }
            else{
               next() 
            }

        })
    }else{
        resp.status(403).send({result:"Please add token with header"})
    }
   
}

const port = config.port
app.listen(port)


