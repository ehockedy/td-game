// Tools used across files

/**
 * Prints out an array of arrays that represent the map
 * @param {Number[][]} map 
 */
export function printMap(map) {
    for (var i=0; i < map.length; i++) {
        var line = ""
        for (var j=0; j < map[i].length; j++) {
            line += map[i][j].toString() + " "
        }
        console.log(line)
    }
    console.log("\n")
}

/**
 * Generates a randomised hex string of the given length
 * @param {Number} len Length of string to generate
 */
export function randomHexString(len) {
    let randomString = ""
    for (let i=0; i < len; i++) {
        randomString += Math.floor((Math.random()*16)).toString(16)
    }
    return randomString
}

/**
 * Generates a randomised string of letters of the given length
 * @param {Number} len Length of string to generate
 */
export function randomAlphaCharString(len) {
    let alphabet = "ABCDEFGHIJKLMNPQRSTWXYZ" // Exclude O to avoid confusion with zero
    let randomString = ""
    for (let i=0; i < len; i++) {
        randomString += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return randomString
}
