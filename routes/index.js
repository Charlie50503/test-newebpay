var express = require('express')
var router = express.Router()
const crypto = require('crypto')
require('dotenv').config();
const {MerchantID,Version,NotifyURL,ReturnURL,HashKey,HashId} = process.env
const orders = {}
/* GET home page. */
const globalInfo = {
  Status: 'SUCCESS',
  MerchantID: 'MS139642518',
  Version: '1.5',
  TradeInfo:
    '54abf8a4c38e9373a20240e4407f2e6cc2793424ca50a227f199a936daa58c0c0924672914a22dab599619f1de31c3b4dadb6d858575eb8d71045d2f39fd5fff5afe0d7269ca72a109406227e65543572df9bb8f306ec78a87aa5eaf42d082749368a7dce72732520016b141f472f64b6a114046f22481bc5b911465d6bdeddbe2307ea33159ce9f5f3a0d826c669118d1130e49b8a7c8fa7e52d2a8045a3db3bd995779cb736a30ba614cc2fb9d94d23b255f69c4961b50ebb7b5f152494538ef3579877152fb73a59fce98dc05c1761ddcdeef10c94663060ba58f2a1f39afd17ba13f974d418685901a6b48ebb0845036f9e8b27cab04cf688c621328a954697485aad952144ca7b7de88082f3352212657d42e2655b94240854817f057868bed81bef6e3e5df03f805858703e4b160346f3b15297b35123896e26caec06014e8a2f3b0b92355c431b472159b2355ecd2182b608872103fb1b5033b72b10a5eac8881076ec812f8b73643cdf9189d485cfc6bda79b864245df278c7aa9723211e689ade7b67c2be4239cb315b237992526bea35d4a7143bff7e5dd37ec8a1f9d046a7e26f068d143d49a1b4a097e54107cc0b87430b839a6e7161f201a7024e2a48d7f6663776c2a6e8c2b9757ca9755e9bf954e09a1127997761dd3686a9c942e10183a0a9af4f6a225e513e083c1655a6a755711dcaab7be92f4ae5e5e3',
  TradeSha: 'B0197716D1A004A9F5FB8B0253CA47C340E09D2DA18AD8678055BDE6B8454F11',
};

const deInfo = create_mpg_aes_decrypt(globalInfo.TradeInfo)

console.log(deInfo);

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

router.post('/spgateway_notify', (req, res, next) => {
  const data = req.body
  console.log("spgateway_notify:",data);

  const info = create_mpg_aes_decrypt(data.TradeInfo)
  console.log('----------');
  console.log('info',info);
  console.log(orders[info.Result.MerchantOrderNo])

  res.end()
})
router.post('/spgateway_return', (req, res, next) => {
  const data = req.body
  console.log("spgateway_return:",data);
  res.render('success', { title: 'Express' })
  // res.end()
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

// 將 aes 解密
function create_mpg_aes_decrypt(TradeInfo) {
  const decrypt = crypto.createDecipheriv('aes256', HashKey, HashId);
  decrypt.setAutoPadding(false);
  const text = decrypt.update(TradeInfo, 'hex', 'utf8');
  const plainText = text + decrypt.final('utf8');
  const result = plainText.replace(/[\x00-\x20]+/g, '');
  return JSON.parse(result);
}

module.exports = router
