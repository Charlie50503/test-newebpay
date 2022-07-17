var express = require('express');
var router = express.Router();

const orders={}
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/createOrder' , (req,res)=>{
  res.json()
})
module.exports = router;
