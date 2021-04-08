// 第一引数 "test"の場合テストモード

require('dotenv').config({ path: '../watch_composit_env' })
const env = process.env
//テストモード
const test_mode = (process.argv[2] === "test")
//require
const fs = require("fs")
const path = require("path")
const sys = require("./systemController")
const chokidar = require("chokidar")

require('date-utils')
//ログ記録
const log4js = require('log4js')
const { time } = require("console")
log4js.configure("log-config.json")
const eventLogger = log4js.getLogger('event')

//監視するフォルダーの相対パス
let watch_dir = env.WATCH_DIR
if (!fs.existsSync(watch_dir) ) {
    eventLogger.error(`写真供給側のネットワーク(${watch_dir})に接続されていません。`)
    watch_dir = "../watch"
    sys.check_dir(watch_dir)
}
//写真供給フォルダーのクリア
sys.clear_folder(watch_dir)

eventLogger.info(`写真供給フォルダー: ${watch_dir}`)

//合成画像が入るフォルダーの相対パス
let print_dir = env.PRINT_DIR
if (!fs.existsSync(print_dir) || test_mode) {
    if(!fs.existsSync(print_dir)) {
        eventLogger.error(`画像書込み側のネットワーク(${print_dir})に接続されていません。`)
    }
    print_dir = "../print"
    sys.check_dir(print_dir)
}
eventLogger.info(`画像書込みフォルダー: ${print_dir}`)

const sharp = require('sharp')
const frame_dir = '../frame'
const frameWidth = 4800
const frameHeight = 3200

//chokidarの初期化
const watcher = chokidar.watch(watch_dir+"/",{
    ignored:/[\/\\]\./,
    persistent:true
})

const composit = (src, dest, frames) => {
    const image = sharp(src)

    image
        .resize( frameWidth, frameHeight, {
            // fit: 'outside'
            fit: 'cover'
        } )
        .composite( frames )
        // .extract({left: 0, top: 0, width: frameWidth, height: frameHeight})
        .jpeg({quality: 100})
        .toFile(`${dest}`)
        .then( () => {
            sys.remove_file(src);
        })
        .catch(function(err) {
            console.log(err);
        })
}
//監視イベント
watcher.on('ready',function(){

    //準備完了
    // console.clear()
    console.log("フレーム合成プログラム稼働中。")
    if (test_mode) {
        eventLogger.trace("[ テストモード ]")
    }

    //ファイル受け取り
    watcher.on( 'add', function(file_name) {
        const new_name = path.basename(file_name)
        eventLogger.info(`追加されたファイル: ${new_name}`)          
        let exts = new_name.split(".")
        let src = watch_dir + "/" + new_name
        let dest = print_dir + "/" + new_name

        if(exts.length>1) {
            ext=exts[exts.length-1]
            if (ext.toUpperCase() ==="JPG" || ext.toUpperCase() === "JPEG") {
                const a = `${frame_dir}/frame01.png`
                composit(src, dest, [{input: a}])
           　}
        }
   })
}) //watcher.on('ready',function(){