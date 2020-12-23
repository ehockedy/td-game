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

/**
 *
 * @param {Number[4]} pathPos server grid Point
 * @return {Number[2]} array of position of sprite in canvas [x, y]
 */
export function gridPosToMapPos(pathPos, spriteSize, subgridSize) {
    let subGridSideLen = spriteSize / subgridSize
    return [
        // Map square                       Square within map square      Midway through square
        pathPos.col * spriteSize + (pathPos.subcol * subGridSideLen + subGridSideLen / 2),
        pathPos.row * spriteSize + (pathPos.subrow * subGridSideLen + subGridSideLen / 2)
    ]
}

export function getPositionWithinEquallySpacedObjects(objectNumber, totalObjects, objectWidth, totalWidth) {
    // Equally space the objects across the menu where all the spaces are equal width
    // <space><object><space><object><space>
    // |__________________________________|
    //                  |
    //               <toolbar>
    // toolbar = 2*object + 3*space
    // space = (toolbar - 2*object) / 3
    // We know toolbar width and object width, so can work out space width. Then replace 2 and 3 with n and (n+1)
    let spacing = (totalWidth - (totalObjects*objectWidth)) / (totalObjects + 1)
    return (spacing + objectWidth/2) + ((spacing + objectWidth) * ((objectNumber-1) % totalObjects))
}
