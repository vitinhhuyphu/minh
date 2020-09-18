const database = require("../lib/database");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment");
const request = require("request");
const delay = require("delay");
const isImageUrl = require("is-image-url");
let dir = path.join(__dirname, `../tool/db`);

function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + "/" + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

function getAllOldDatabase() {
    let domain = [{
            id: "YI1Ak1hiL",
            domain: "huyphu.com"
        },
        {
            id: "qyiPuvPhK",
            domain: "jola.vn"
        },
    ];
    var items = [];
    let files = getFiles(dir);
    for (let i = 0; i < files.length; i++) {
        const element = files[i];
        let item = fs.readJsonSync(files[i]);
        if (item.__Doc == "Product") {
            let d = domain.find((e) => e.id == item.domainId);
            if (d) {
                item.domain = d.domain;
                delete item.domainId;
                if (item.status == "auto") item.status = "HD";
                items.push(item);
            }
        }
        if (item.__Doc == "ProductCategory") {
            let d = domain.find((e) => e.id == item.domainId);
            if (d) {
                item.domain = d.domain;
                delete item.domainId;
                items.push(item);
            }
        }
        // if (item.__Doc == "Address") {
        //   items.push(item);
        // }
        if (item.__Doc == "Article") {
            let d = domain.find((e) => e.id == item.domainId);
            if (d) {
                item.domain = d.domain;
                delete item.domainId;
                items.push(item);
            }
        }
        if (item.__Doc == "ArticleCategory") {
            let d = domain.find((e) => e.id == item.domainId);
            if (d) {
                item.domain = d.domain;
                delete item.domainId;
                item.isSystemposts = false
                if (item.type == "systemposts") item.isSystemposts = true
                delete item.type;
                items.push(item);
            }
        }
        if (item.__Doc == "Brand") {
            let d = domain.find((e) => e.id == item.domainId);
            if (d) {
                item.domain = d.domain;
                delete item.domainId;
                items.push(item);
            }
        }
    }
    dowloadImage(items, 0, function () {
        console.log(items.length);
        fs.outputJsonSync(path.join(__dirname, `../database/data_1.json`), items);
        console.log("done");
    });
}
let isDouwload = true;
let indexDownload = 1;
getAllOldDatabase();

async function dowloadImage(items, index, callback) {
    console.log("Item thứ:",index)
    if (index >= items.length) {
        callback();
        return;
    }
    let item = items[index];
    if (item && item.__Doc == "Product") {
        dowloadImageProduct(item, function () {
            dowloadImage(items, index + 1, callback);
        });
    } else if (item && item.__Doc == "ProductCategory") {
        dowloadImageProductCategory(item, function () {
            dowloadImage(items, index + 1, callback);
        });
    } else if (item && item.__Doc == "Article") {
        dowloadImageArticle(item, function () {
            dowloadImage(items, index + 1, callback);
        });
    } else if (item && item.__Doc == "ArticleCategory") {
        dowloadImageArticleCategory(item, function () {
            dowloadImage(items, index + 1, callback);
        });
    } else if (item && item.__Doc == "Brand") {
        dowloadImageBrand(item, function () {
            dowloadImage(items, index + 1, callback);
        });
    } else {
        await delay(10)
        dowloadImage(items, index + 1, callback);
    }
}

function dowloadImageBrand(item, callback) {
    let folder = "Brand/"
    dImage(callback);

    function dImage(callback) {
        if (!item.image) return callback()
        let image = `http://admin.huyphu.com${item.image}`;
        if (item.image.indexOf("http") > -1) image = item.image;
        try {
            download(image, folder + item.id + "/", function (url) {
                item.image = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }
}

function dowloadImageArticleCategory(item, callback) {
    let folder = "ArticleCategory/"
    dImage(function () {
        dOgImage(callback);
    });

    function dOgImage(callback) {
        if (!item.ogImage) return callback();
        let image = `http://admin.huyphu.com${item.ogImage}`;
        if (item.ogImage.indexOf("http") > -1) image = item.ogImage;
        try {
            download(image, folder + item.id + "/", function (url) {
                item.ogImage = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }

    function dImage(callback) {
        if (!item.image) return callback()
        let image = `http://admin.huyphu.com${item.image}`;
        if (item.image.indexOf("http") > -1) image = item.image;
        try {
            download(image, folder + item.id + "/", function (url) {
                item.image = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }
}

function dowloadImageArticle(item, callback) {
    let folder = "Article/"
    dContentImage(function () {
        dImage(function () {
            dOgImage(callback);
        });
    })

    function dContentImage(callback) {
        if (!item.content) return callback();
        let urls = getUrlsFromText(item.content);
        dContentImageItem(callback);

        function dContentImageItem(callback) {
            if (urls.length <= 0) return callback();
            let url = urls.shift();
            try {
                let image = `http://admin.huyphu.com${url}`;
                if (url.indexOf("http") > -1) image = url;
                download(image, folder + item.id + "/", function (u) {
                    item.content = item.content.split(url).join(u);
                    dContentImageItem(callback);
                });
            } catch (error) {
                console.log(error);
                dContentImageItem(callback);
            }
        }
    }

    function dOgImage(callback) {
        if (!item.ogImage) return callback();
        let image = `http://admin.huyphu.com${item.ogImage}`;
        if (item.ogImage.indexOf("http") > -1) image = item.ogImage;
        try {
            download(image, folder + item.id + "/", function (url) {
                item.ogImage = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }

    function dImage(callback) {
        if (!item.image) return callback()
        let image = `http://admin.huyphu.com${item.image}`;
        if (item.image.indexOf("http") > -1) image = item.image;
        try {
            download(image, folder + item.id + "/", function (url) {
                item.image = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }
}

function dowloadImageProductCategory(item, callback) {
    dImage(function () {
        dOgImage(callback);
    });

    function dOgImage(callback) {
        if (!item.ogImage) return callback();
        let image = `http://admin.huyphu.com${item.ogImage}`;
        if (item.ogImage.indexOf("http") > -1) image = item.ogImage;
        try {
            download(image, "ProductCategory/" + item.id + "/", function (url) {
                item.ogImage = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }

    function dImage(callback) {
        if (!item.image) return callback()
        let image = `http://admin.huyphu.com${item.image}`;
        if (item.image.indexOf("http") > -1) image = item.image;
        try {
            download(image, "ProductCategory/" + item.id + "/", function (url) {
                item.image = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }
}

function dowloadImageProduct(item, callback) {
    dImage(function () {
        dContentImage(function () {
            dAmbum(0, function () {
                dOgImage(function () {
                    dMerchantImages(0, callback);
                });
            });
        });
    });

    function dMerchantImages(index, callback) {
        if (index >= item.merchantImages.length) return callback();
        let imageAlbum = item.merchantImages[index];
        try {
            let image = `http://admin.huyphu.com${imageAlbum.image}`;
            if (imageAlbum.image.indexOf("http") > -1) image = imageAlbum.image;
            download(image, "Product/" + item.id + "/", function (u) {
                imageAlbum.image = u;
                dMerchantImages(index + 1, callback);
            });
        } catch (error) {
            console.log(error);
            dMerchantImages(index + 1, callback);
        }
    }

    function dOgImage(callback) {
        if (!item.ogImage) return callback();
        let image = `http://admin.huyphu.com${item.ogImage}`;
        if (item.ogImage.indexOf("http") > -1) image = item.ogImage;
        try {
            download(image, "Product/" + item.id + "/", function (url) {
                item.ogImage = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }

    function dAmbum(index, callback) {
        if (index >= item.album.length) return callback();
        let imageAlbum = item.album[index];
        try {
            let image = `http://admin.huyphu.com${imageAlbum.image}`;
            if (imageAlbum.image.indexOf("http") > -1) image = imageAlbum.image;
            download(image, "Product/" + item.id + "/", function (u) {
                imageAlbum.image = u;
                dAmbum(index + 1, callback);
            });
        } catch (error) {
            console.log(error);
            dAmbum(index + 1, callback);
        }
    }

    function dContentImage(callback) {
        if (!item.content) return callback();
        let urls = getUrlsFromText(item.content);
        dContentImageItem(callback);

        function dContentImageItem(callback) {
            if (urls.length <= 0) return callback();
            let url = urls.shift();
            try {
                let image = `http://admin.huyphu.com${url}`;
                if (url.indexOf("http") > -1) image = url;
                download(image, "Product/" + item.id + "/", function (u) {
                    item.content = item.content.split(url).join(u);
                    dContentImageItem(callback);
                });
            } catch (error) {
                console.log(error);
                dContentImageItem(callback);
            }
        }
    }

    function dImage(callback) {
        if (!item.image) return callback()
        let image = `http://admin.huyphu.com${item.image}`;
        if (item.image.indexOf("http") > -1) image = item.image;
        try {
            download(image, "Product/" + item.id + "/", function (url) {
                item.image = url;
                callback();
            });
        } catch (error) {
            console.log(error);
            callback();
        }
    }
}
let noDownloadList = []
async function download(uri, url, callback) {
    let dirImage = path.join(__dirname, `../images/`);
    let filename = uri.split("/")[uri.split("/").length - 1];
    if (!(await fs.pathExists(dirImage + url))) fs.mkdirSync(dirImage + url, {
        recursive: true
    });
    indexDownload++
    if (noDownloadList.indexOf(uri) > -1 && isDouwload && !(await fs.pathExists(dirImage + url + filename))) {
        //console.log("dowload", indexDownload, uri);
        request.head(uri, function (err, res, body) {
            request(uri)
                .pipe(fs.createWriteStream(dirImage + url + filename))
                .on("close", function () {
                    callback("/" + url + filename);
                });
        });
    } else {
        //console.log(indexDownload, uri);
        await delay(10);
        callback("/" + url + filename);
    }

}

function getUrlsFromText(str) {
    str = str.split(' ').join('')
    let urls = [];
    let strs = str.split("src='");
    if(str.indexOf("src=`")>-1) console.log(str.indexOf("src=`"))
    for (let i = 1; i < strs.length; i++) {
        var element = strs[i].split("'");
        if (element.length > 1 && isImageUrl(element[0].indexOf("http") > -1 ? element[0] : `http://admin.huyphu.com${element[0]}`)) {
            urls.push(element[0].split("?")[0]);
        } else if (element.length > 1 && element[0].indexOf("youtube") == -1) {
            console.log("not dowload",element[0].indexOf("http") > -1 ? element[0] : `http://admin.huyphu.com${element[0]}`)
        }
    }
    strs = str.split(`src="`);
    for (let i = 1; i < strs.length; i++) {
        var element = strs[i].split('"');
        if (element.length > 1 && isImageUrl(element[0].indexOf("http") > -1 ? element[0] : `http://admin.huyphu.com${element[0]}`)) {
            urls.push(element[0].split("?")[0]);
        } else if (element.length > 1 && element[0].indexOf("youtube") == -1) {
            console.log("not dowload",element[0].indexOf("http") > -1 ? element[0] : `http://admin.huyphu.com${element[0]}`)
        }
    }
    return urls;
}