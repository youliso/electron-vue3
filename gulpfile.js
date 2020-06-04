const isWin = /^win/.test(process.platform);
const fs = require('fs');
const path = require('path');
const gulp = require("gulp");
const minifyCss = require('gulp-minify-css');//压缩CSS为一行；
const htmlmin = require('gulp-htmlmin');//html压缩组件
const gulpRemoveHtml = require('gulp-remove-html');//标签清除
const removeEmptyLines = require('gulp-remove-empty-lines');//清除空白行
const compiler = require('google-closure-compiler').jsCompiler;
const closureCompiler = new compiler({
    compilation_level: 'SIMPLE',
    module_resolution: "NODE",
    language_in: "ECMASCRIPT_2018",
    language_out: "ECMASCRIPT_2018",
    jscomp_warning: "*",
    env: "CUSTOM"
});
const buildBasePath = 'dist/';//构建输出的目录
const config = require('./package');
const asar = false; //是否asar打包
const allowToChangeInstallationDirectory = true; //是否允许用户修改安装为位置
let nConf = {//基础配置
    'app-assembly': [],
    'app-views': [],
    'dialog-assembly': [],
    'dialog-views': [],
    'menu-assembly': [],
    'menu-views': [],
    "themeColor": "#333333", //主题色
    "appUrl": "http://127.0.0.1:3000/", //程序主访问地址
    "socketUrl": "http://127.0.0.1:3000/",// 程序socket访问地址
    "updateUrl": "http://127.0.0.1:3000/", //更新地址
    "updateFileUrl": "http://127.0.0.1:3000/public/dist/", //更新文件地址
    "appSize": [800, 500],
    "dialogSize": [400, 150],
    "menuSize": [80, 90]
};

function findFileBySuffix(dirs, fileName) {
    let files = []
    let dirArray = fs.readdirSync(dirs)
    for (let d of dirArray) {
        let filePath = path.resolve(dirs, d)
        let stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
            files = files.concat(findFileBySuffix(filePath, fileName))
        }
        if (stat.isFile() && path.extname(filePath) === fileName) {
            files.push(filePath)
        }
    }
    return files
}

gulp.task('retrieval', async () => {
    //app
    fs.readdirSync('src/main/views/app/vh').forEach((element) => {
        nConf["app-assembly"].push('../views/app/vh/' + element);
    });
    fs.readdirSync('src/main/views/app').forEach((element) => {
        if (element !== 'vh') {
            let {keepAlive} = require('./src/main/views/app/' + element);
            nConf["app-views"].push({keepAlive, v: '../views/app/' + element});
        }
    });
    //dialog
    fs.readdirSync('src/main/views/dialog/vh').forEach((element) => {
        nConf["dialog-assembly"].push('../views/dialog/vh/' + element);
    });
    fs.readdirSync('src/main/views/dialog').forEach((element) => {
        if (element !== 'vh') {
            let {keepAlive} = require('./src/main/views/dialog/' + element);
            if (keepAlive === undefined) keepAlive = true;
            nConf["dialog-views"].push({keepAlive, v: '../views/dialog/' + element});
        }
    });
    //menu
    fs.readdirSync('src/main/views/menu/vh').forEach((element) => {
        nConf["menu-assembly"].push('../views/menu/vh/' + element);
    });
    fs.readdirSync('src/main/views/menu').forEach((element) => {
        if (element !== 'vh') {
            let {keepAlive} = require('./src/main/views/menu/' + element);
            if (keepAlive === undefined) keepAlive = true;
            nConf["menu-views"].push({keepAlive, v: '../views/menu/' + element});
        }
    });

    fs.writeFileSync(__dirname + '/src/main/config.json', JSON.stringify(nConf));
    config.build.publish = [{
        "provider": "generic",
        "url": nConf.updateUrl
    }]
    config.build.asar = asar;
    config.build.nsis.allowToChangeInstallationDirectory = allowToChangeInstallationDirectory;
    fs.writeFileSync('./package.json', JSON.stringify(config));
});

gulp.task('compress', async () => {
    //cfg
    gulp.src(['src/main/**/*.json', 'src/main/**/*.ico'])
        .pipe(gulp.dest(buildBasePath));
    //css
    gulp.src('src/main/**/*.css')
        .pipe(minifyCss())//压缩css到一样
        .pipe(gulp.dest(buildBasePath));//输出到css目录
    //js
    gulp.src('src/main/**/*.js')
        .pipe(gulp.dest(buildBasePath));


    //html
    gulp.src('src/main/**/*.html')
        .pipe(gulpRemoveHtml())//清除特定标签
        .pipe(removeEmptyLines({removeComments: true}))//清除空白行
        .pipe(htmlmin({
            removeComments: true,//清除HTML注释
            collapseWhitespace: true,//压缩HTML
            collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
            removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
            minifyJS: true,//压缩页面JS
            minifyCSS: true//压缩页面CSS
        }))
        .pipe(gulp.dest(buildBasePath));

    //写入nsis
    let nsh = "; Script generated by the HM NIS Edit Script Wizard.\n" +
        "\n" +
        "; HM NIS Edit Wizard helper defines custom install default dir\n" +
        "!macro preInit\n" +
        "    SetRegView 64\n" +
        "    WriteRegExpandStr HKLM \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"C:\\" + config.name + "\"\n" +
        "    WriteRegExpandStr HKCU \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"C:\\" + config.name + "\"\n" +
        "    SetRegView 32\n" +
        "    WriteRegExpandStr HKLM \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"C:\\" + config.name + "\"\n" +
        "    WriteRegExpandStr HKCU \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"C:\\" + config.name + "\"\n" +
        "!macroend";

    //写入nsis  appData目录
    // let nsh = "; Script generated by the HM NIS Edit Script Wizard.\n" +
    //     "\n" +
    //     "; HM NIS Edit Wizard helper defines custom install default dir\n" +
    //     "!macro preInit\n" +
    //     "    SetRegView 64\n" +
    //     "    WriteRegExpandStr HKLM \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"$LOCALAPPDATA\\" + config.name + "\"\n" +
    //     "    WriteRegExpandStr HKCU \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"$LOCALAPPDATA\\" + config.name + "\"\n" +
    //     "    SetRegView 32\n" +
    //     "    WriteRegExpandStr HKLM \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"$LOCALAPPDATA\\" + config.name + "\"\n" +
    //     "    WriteRegExpandStr HKCU \"${INSTALL_REGISTRY_KEY}\" InstallLocation \"$LOCALAPPDATA\\" + config.name + "\"\n" +
    //     "!macroend";
    fs.writeFileSync(__dirname + '/src/resources/script/installer.nsh', nsh);

});

gulp.task('compiler', async () => {
    let files = [];
    for (let i of findFileBySuffix(isWin ? __dirname + '\\dist' : __dirname + '/dist', '.js')) {
        if (i.indexOf('min.js') === -1) {
            let cc = await closureCompiler.run([{
                path: i,
                src: fs.readFileSync(i).toString(),
                sourceMap: null
            }],);
            fs.writeFileSync(i, cc['compiledFiles'][0].src);
        }
    }
    //-jar closure-compiler-v20200406.jar --js ${'src/main' + i} --js_output_file ${'dist' + i} --language_in=ECMASCRIPT_2018 --language_out=ECMASCRIPT_2018 --compilation_level=SIMPLE --jscomp_warning=* --env=CUSTOM --module_resolution=NODE
})
