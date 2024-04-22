let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const express = require('express'); // To build an application server or API
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

//INFO: Connection to DB and initialize it with test data in initdata.js
const { bcrypt, db } = require('../resources/js/initdata'); // Connect from postgres DB and initialize it with test data

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
	extname: "hbs",
	layoutsDir: __dirname + "/views/layouts",
	partialsDir: __dirname + "/views/partials",
});


//book schema definition
let BookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    pages: { type: Number, required: true, min: 1 },
    createdAt: { type: Date, default: Date.now },    
  }, 
  { 
    versionKey: false
  }
);

// Sets the createdAt parameter equal to the current time
BookSchema.pre('save', next => {
  now = new Date();
  if(!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

//Exports the BookSchema for use elsewhere.
module.exports = mongoose.model('book', BookSchema);