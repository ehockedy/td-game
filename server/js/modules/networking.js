/*
    Set of functions used for server side neworking and communicating with the client(s)
*/
const fs = require('fs');

root_dir = ""

exports.setRootDir = function(path) {
    root_dir = path
}

// Function run any time request is made to the HTTP server
exports.requestListener = function (req, res) {
    url = req.url
    console.log(`\n${url} requested`);
    // TODO sanatize against directory navigation e.g. ..?

    if (url == '/') url = "/index.html"
    console.log(root_dir)
    // Check if requested file does not exist
    if (!fs.existsSync(root_dir + url)) {
        console.log(`ERROR: Invalid file ${root_dir + url}\n`)
        res.writeHead(404);
        res.end("Not found");
        return
    };

    // Check if it not a file with extension
    if (!url.includes('.')) {
        console.log("ERROR: Request did not have file extansion\n")
        res.writeHead(404);
        res.end("Not found");
        return
    }

    // Get file extension and use that to specify content type for response
    filetype = url.split(".").pop()
    content_type = ""
    switch (filetype) {
        case "js":
            content_type = "text/javascript"
            break;
        case "css":
            content_type = "text/css"
            break;
        case "html":
            content_type = "text/html"
            break;
        default:
            break;
    }

    if (content_type == "") {
        console.log("ERROR: File type " + filetype + " not supported\n")
        res.writeHead(404);
        res.end("File type not supported");
        return
    }

    console.log("Sending requested file\n")
    fs.promises.readFile(root_dir + url)
        .then(contents => {
            res.setHeader("Content-Type", content_type);
            res.writeHead(200);
            res.end(contents);
        })

    return
}