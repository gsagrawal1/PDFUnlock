require("dotenv").config()
const express = require('express')
const path = require("path")
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const app = express()
const PORT = process.env.PORT || 1104

app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))
app.use(express.json())
app.use(express.urlencoded({extended : false}))
app.use(express.static(path.resolve('./public')))

const pdfRoutes = require('./routes/pdf')

app.use("/", pdfRoutes)

app.listen(PORT, ()=> {
    console.log("Server started at :" + PORT)
})