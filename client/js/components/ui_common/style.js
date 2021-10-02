// Consistent across all text for whole application
function generateBaseTextStyle(tint, fontSize=64) {
    return {
        "fill": tint,
        "fontSize": fontSize,
        "fontFamily": "Turtles",
        "fontVariant": "small-caps",
        "letterSpacing": 0,
        "lineHeight" : Math.floor(fontSize*0.8),
        "padding": 5,
    }
}

// For use on buttons or titles
export function boldTextStyle(tint, fontSize=64) {
    const base = generateBaseTextStyle(tint, fontSize)
    const options = {
        "strokeThickness": Math.ceil(fontSize/10),
    }
    return {
        ...base,
        ...options,
    }
}

// For use in bits of infromation or bodies of text
export function plainTextStyle(tint, fontSize=64) {
    return generateBaseTextStyle(tint, fontSize)
}


// Common colour codes to reuse
export const COLOURS = {
    AIM_RED:         "0xDD3333",
    BLACK:           "0x000000",
    CANCEL_RED:      "0x990918",
    CANNOT_BUY_GREY: "0x555555",
    CONFIRM_GREEN:   "0x40D661",
    DENY_RED:        "0xD64061",
    INFO_LIGHT_GREY: "0xDDEECC",
    INFO_MID_GREY:   "0xAABB99",
    MENU_SANDY:      "0xCCBB88",
    MONEY:           "0xDDAA11",
    UPGRADE_GREEN:   "0x229933",
}