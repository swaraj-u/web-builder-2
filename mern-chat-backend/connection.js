const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`mongodb+srv://web:web@cluster0.6f2ju.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, ()=> {
  console.log('connected to mongodb')
})
 