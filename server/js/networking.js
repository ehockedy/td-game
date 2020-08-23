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
    MIME_type = ""
    switch (filetype) {
        case "js":
        case "map":
            MIME_type = "text/javascript"
            break;
        case "css":
            MIME_type = "text/css"
            break;
        case "html":
            MIME_type = "text/html"
            break;
        case "png":
            MIME_type = "image/png"
            break;
        case "json":
            MIME_type = "application/json"
            break;
        default:
            break;
    }

    if (MIME_type == "") {
        console.log("ERROR: File type " + filetype + " not supported\n")
        res.writeHead(404);
        res.end("File type not supported");
        return
    }

    console.log("Sending requested file\n")
    fs.promises.readFile(root_dir + url)
        .then(contents => {
            res.setHeader("Content-Type", MIME_type);
            res.writeHead(200);
            res.end(contents);
        })

    return
}