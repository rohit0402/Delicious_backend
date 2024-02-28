const express=require("express");
const app=express();
const port=8080;
const cors=require("cors");
const cookieParser=require("cookie-parser");
require("dotenv").config();
const {connectdDB} =require('./connection');
const routes=require("./routes");


connectdDB();

app.use(cors({
    origin:["http://localhost:5173","https://delicious-frontend-shjd.vercel.app"],
    credentials:true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api",routes);

app.listen(port,()=>{
    console.log(`server is running in port ${port}`);
});