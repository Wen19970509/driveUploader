const { readFile, writeFile, createReadStream } = require("fs");
const { createInterface } = require("readline");
const { google } = require("googleapis");
const { argv } = require("process");
const { dirname, basename } = require("path");
const SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
];

const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), upload_file);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("點擊連結以獲取憑證: ", authUrl);
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("將頁面上的憑證碼輸入於此: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token 獲取完成", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
/**
 * 上傳指定檔案，檔案路徑為files資料夾
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function upload_file(auth) {
  const drive = google.drive({ version: "v3", auth });
  const searchFolder = (folder) =>
    new Promise((resolve) => {
      let pageToken = null;
      drive.files.list(
        {
          q: "mimeType = 'application/vnd.google-apps.folder'",
          pageSize: 100,
          fields: "nextPageToken, files(id, name)",
          spaces: "drive",
          pageToken: pageToken,
        },
        (err, res) => {
          if (err) return console.log("The API returned an error: " + err);
          const files = res.data.files;
          if (files.length) {
            const result = files.filter((file) => file.name == folder)[0];
            resolve(result);
          } else {
            console.log("No Folders found.");
          }
        }
      );
    });
  let folder = await searchFolder(argv[3] ? dirname(argv[3]) : "Reports");
  let fileMetadata = {
    name: basename(argv[3])
      ? basename(argv[3], ".csv")
      : basename(argv[2], ".csv"),
    parents: [folder.id],
    mimeType: "application/vnd.google-apps.spreadsheet",
  };
  let media = {
    mimeType: "text/csv",
    body: createReadStream(`${argv[2]}`),
  };

  if (argv[4] == 1) {
    console.log("======檔案覆寫======");
    let pageToken = null;
    drive.files.list(
      {
        q: `"${folder.id}"  in parents`,
        pageSize: 5,
        fields: "nextPageToken, files(id, name)",
        spaces: "drive",
        pageToken: pageToken,
      },
      (err, res) => {
        if (err) return console.log("The API returned an error: " + err);
        const files = res.data.files;
        if (files.length) {
          files.map((d) => {
            drive.files.delete(
              {
                fileId: d.id,
              },
              function (err, res) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("舊資料刪除成功");
                }
              }
            );
          });
        } else {
          console.log("No Files found.");
        }
      }
    );
  }
  console.log("======上傳開始======");
  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
      fields: "id",
    },
    function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        console.log("status", file.status);
        console.log("ID:", file.data.id);
        console.log("======上傳完成======");
      }
    }
  );
}
