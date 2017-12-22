const puppeteer = require("puppeteer");
const fs = require("fs");
const recordPath = './.record'; // 記錄已上傳檔案用
const filesPath = './files' // 放要上傳檔案的資料夾(監控的資料夾)
const uploadURL = ''; // wiki的上傳檔案頁網址
const loginURL = ''; // wiki的登入頁網址
const username = ''; // wiki登入帳號
const password = ''; // wiki登入密碼
const allowTypes = ['png','gif','jpg','jpeg','doc','xls','mpp','pdf','ppt','tiff','bmp','docx','xlsx','pptx','ps','odt','ods','odp','odg']; // wiki預設允許的格式
const during = 20000; // 幾ms監控一次目標資料夾
var preList = '';

function run() {
    // 讀取記錄檔
    fs.readFile(recordPath, function (err, data) {
        if (err) throw err;

        let uploadRecord = data.toString().split(',');

        // 讀取上傳資料夾的檔案列表
        console.log('Read file list...');
        fs.readdir(filesPath, function (err, list) {
            if (err) throw err;

            if (list.join(',') === preList) {
                return;
            }

            let willUpload = [];
            for (let i = 0; i < list.length; i++) {

                let temp = list[i].split('.');
                let fileType = temp[temp.length-1];

                // 沒有記錄表示要上傳
                if (uploadRecord.indexOf(list[i]) < 0 && allowTypes.indexOf(fileType) >= 0) {
                    willUpload.push(list[i]);
                }
            }

            if (willUpload.length > 0) {
                // 開啟上傳
                //upload(willUpload)
                (async(willUpload) => {
                    console.log('Upload start...');
                    const browser = await puppeteer.launch({
                        headless: false
                    });
                    const page = await browser.newPage();
                
                    await page.goto(loginURL);
                    await page.type('#wpName1', username);
                    await page.type('#wpPassword1', password);
                    await page.click('#wpLoginAttempt');
                
                    await page.waitFor(1000);
                
                    for (let i = 0; i < willUpload.length; i++) {
                        await page.goto(uploadURL);
                        let uploadElement = await page.$('#wpUploadFile');
                        filePaths = [filesPath+'/'+willUpload[i]];
                        await uploadElement.uploadFile(...filePaths);

                        await page.waitFor(1000);
                        await page.click('#wpWatchthis');
                        await page.click('#mw-upload-form > span > input');
                        await page.waitFor(1000);
                    }

                    browser.close();
                    
                    // 寫入已上傳記錄
                    console.log('Write upload record...');
                    let writeData = uploadRecord + ',' + willUpload;
                    await fs.writeFile(recordPath, writeData, {
                        overwrite: false
                    }, function (err) {
                        if (err) throw err;
                        console.log('Record saved!');
                    });
                })(willUpload);
            }

            preList = list.join(',');

        });

    });
}

// run immediately
run();
setInterval(run, during);
