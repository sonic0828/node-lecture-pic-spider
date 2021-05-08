const http = require("http");
const https = require('https');
const fs = require("fs");
const iconv = require('iconv-lite');
const cheerio = require("cheerio");

let config = {
    domain : 'https://www.zcool.com.cn/work/ZMzM5OTA5MjA=.html',
	dirPath: __dirname + '/' + '_images/',  // 图片存储目录
    interval: 200,  // 单次请求的时间间隔
    selector: 'div.work-show-box img'
}

// 定时器
function _setTimeout(i) {
	var interval = i * config.interval + Math.random() * 100
	return new Promise(resolve => {
		setTimeout(() => {
			resolve()
		}, interval)
	})
}
// 获取图片url数组
function getPicsUrl(url) {
	console.log(`开始向${url}请求图片地址...`)
	var html = '';
	return new Promise(resolve => {
		// 监测地址是https或者http
		const hp = (url.indexOf('https') == -1) ? http : https;

		hp.get(url, res => {
			res.on('data', data => { html += data })
			res.on('end', data => {
				console.log("load html")
				var $ = cheerio.load(html)
                var $pics = $(config.selector);
				var pics = [].slice.call($pics).map(pic => {
					return pic.attribs.src
				})
				console.log(`图片链接获取完毕，共${pics.length}张图片。`)
				// console.log(`${pics}`)
				resolve(pics)
			})
		})
	})
}
// 获取图片数据`
function getPicData(urlStr) {
    var name = urlStr.split('/').pop();
    const diff = new Date().getTime().toString().substring(10);
    if (name.indexOf('.jpg') == -1) {
        name += `_${diff}.jpg`;
    }
    // console.log(name);

    // 监测地址是https或者http
    const hp = (urlStr.indexOf('https') == -1) ? http : https;
   
    return new Promise(resolve => {
        hp.get(urlStr, res => {
            let data = '';
            res.setEncoding('binary')
            res.on('data', chunk => { data += chunk })
            res.on('end', () => {
                resolve({name, data})
            })
        })
    })
}
// 下载图片至本地
function download(pic) {
	return new Promise(resolve => {
		fs.writeFile(config.dirPath + pic.name, pic.data, 'binary', err => {
			resolve({ err: err, name: pic.name })
		})
	})
}
// 检查目录是否为空
function fsExistsSync(path) {
    try{fs.accessSync(path,fs.F_OK);}catch(e){return false;}
    return true;
}
// 初始化
async function crawler() {
    if (!fsExistsSync(config.dirPath)) {
        fs.mkdirSync(config.dirPath);
    }

    var picsArr = await getPicsUrl(config.domain)  // 获取图片url数组
	for (let i = 0; i < picsArr.length; i++) {
        await _setTimeout();  // 定时器等待
        var pic = await getPicData(picsArr[i]);  // 获取图片数据
		var resJson = await download(pic);  // 下载图片至本地
		console.log(resJson.err || `√ ${resJson.name} downloaded!`);
	}
}
crawler()
