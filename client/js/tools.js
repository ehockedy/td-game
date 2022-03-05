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

export function colourHash2Hex(colour_code) {
    return colour_code.replace("#", "0x")
}

// TODO add tests
function combineColourHexValues(v1, v2, combinationFn) {
    let result = "0x"  // Assum e hex string starts with '0x', might be '#'
    // Determine the starting digit indeex for each hex string - depends on whether its '0x' or '#'
    let v1_start = (v1[0] == '#') ? 1 : 2
    let v2_start = (v2[0] == '#') ? 1 : 2

    for (let offset = 0; offset < 6; offset += 2) {
        // One colour at a time - 2 hex digits
        // Convert both to decimal, sum them, then check if greater than 16 squared (0xFF), then convert back to hex string
        let v1_hex = v1.slice(v1_start + offset, v1_start + offset+2)
        let v1_dec = parseInt(v1_hex, 16);

        let v2_hex = v2.slice(v2_start + offset, v2_start + offset+2)
        let v2_dec = parseInt(v2_hex, 16);

        let sum_dec = Math.max(Math.floor(combinationFn(v1_dec, v2_dec)), 0)  // Make integer and > 0
        let sum_hex = (sum_dec > Math.pow(16, 2)) ? "FF" : sum_dec.toString(16).padStart(2, '0')
        result += sum_hex
    }
    return result
}

export function addColourHexValues(v1, v2) {
    return combineColourHexValues(v1, v2, (a, b)=>{ return a + b})
}

export function subtractColourHexValues(v1, v2) {
    return combineColourHexValues(v1, v2, (a, b)=>{ return a - b})
}

export function avgColourHexValues(v1, v2) {
    return combineColourHexValues(v1, v2, (a, b)=>{ return (a + b)/2})
}
