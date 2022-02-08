## GoogleDrive 雲端上傳

使用方式

```
node upload.js para1 para2 para3

```

- para1 : 輸入 欲上傳檔案之<b>絕對路徑</b>
- ex : `/Users/username/Desktop/result.csv`
- para2 : 輸入 google Drive 對應資料夾名稱與上傳後檔名
- ex : `Reports/2022Reports` <br/>
  前為目標資料夾，後為檔名，如無特殊命名則檔名與原始檔名相同即可 <br/>
  目標資料夾可不用於雲端 Root 層，子層亦可抓取到，但資料夾名稱必須為唯獨，<br/><br/>
  此用法非指定路徑，而是搜尋指定資料夾，故資料夾名稱不可有重複。
- para3 : 1 執行檔案覆寫 , 0 檔案不複寫直接新增
  若參數為 1 將清除資料夾後重新上傳。

## credentials.json & token.json

credentials.json 為 api 憑證 <br/>
token.json 為 google 雲端硬碟驗證，現存於 Xinmedia 帳號

## 首次使用或更換上傳目標硬碟

- 刪除 token.json
- 執行 node upload.js 時若發現無 token.js 會觸發登入
- 登入欲使用的帳號，回填 google 提供之憑證碼。
