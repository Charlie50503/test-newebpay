var express = require('express');
var router = express.Router();

const orders={}
/* GET home page. */

const RespondType = 'JSON'
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/createOrder' , (req,res)=>{
  const data = req.body;
  console.log(data);
  res.json()
})
module.exports = router;
