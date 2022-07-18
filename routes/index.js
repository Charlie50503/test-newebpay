var express = require('express')
var router = express.Router()
const crypto = require('crypto')
require('dotenv').config();
const {MerchantID,Version,NotifyURL,ReturnURL,HashKey,HashId} = process.env
const orders = {}
/* GET home page. */

const RespondType = 'JSON'
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
})
//建立一筆訂單
router.post('/createOrder', (req, res) => {
  const data = req.body;
  console.log(data);
  const TimeStamp = Math.round(new Date().getTime() / 1000);
  console.log(TimeStamp);
  orders[TimeStamp] = {
    ...data,
    TimeStamp,
    MerchantOrderNo: TimeStamp,
  };
  console.log(orders[TimeStamp]);

  return res.json(orders[TimeStamp]);
});

function genDataChain(order){
  return `MerchantID=${MerchantID}&RespondType=${RespondType}&TimeStamp=${order.TimeStamp}&Version=${Version}&MerchantOrderNo=${order.MerchantOrderNo}&Amt=${order.Amt}&ItemDesc=${encodeURIComponent(order.ItemDesc)}&Email=${encodeURIComponent(order.Email)}`
}

//確認一筆訂單
router.get('/check', (req, res, next) => {
  res.render('check', { title: 'Express' })
})
router.get('/order/:id', (req, res, next) => {
  console.log(req.params?.id)
  const id = req.params?.id
  console.log(orders[id]);
  console.log('MerchantID',MerchantID);
  const order = orders[id]
  
  const paramString = genDataChain(order)
  console.log('---------');
  console.log(paramString);

  const aesEncrypt = create_mpg_aes_encrypt(order) // 交易資料
  console.log(aesEncrypt);

  const shaEncrypt = create_mpg_sha_encrypt(aesEncrypt) //驗證用
  console.log('shaEncrypt ',shaEncrypt);
  // create_mpg_sha_encrypt
  res.json({
    order,
    aesEncrypt,
    shaEncrypt
  })
})

router.get('/spgateway_notify', (req, res, next) => {
  const data = req.body
  console.log("spgateway_notify:",data);
  res.end()
})
router.get('/spgateway_return', (req, res, next) => {
  const data = req.body
  console.log("spgateway_return:",data);
  res.render('success', { title: 'Express' })
  res.end()
})

// 對應文件 P16：使用 aes 加密
// $edata1=bin2hex(openssl_encrypt($data1, "AES-256-CBC", $key, OPENSSL_RAW_DATA, $iv));
function create_mpg_aes_encrypt(TradeInfo) {
  const encrypt = crypto.createCipheriv('aes256', HashKey, HashId);
  const enc = encrypt.update(genDataChain(TradeInfo), 'utf8', 'hex');
  return enc + encrypt.final('hex');
}

// 對應文件 P17：使用 sha256 加密
// $hashs="HashKey=".$key."&".$edata1."&HashIV=".$iv;
function create_mpg_sha_encrypt(aesEncrypt) {
  const sha = crypto.createHash('sha256');
  const plainText = `HashKey=${HashKey}&${aesEncrypt}&HashIV=${HashId}`;

  return sha.update(plainText).digest('hex').toUpperCase();
}

module.exports = router
