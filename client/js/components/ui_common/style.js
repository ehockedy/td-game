
export function generateStyle(tint, fontSize=48) {
    return {
        "fill": tint,
        "fontFamily": "\"Trebuchet MS\", Helvetica, sans-serif",
        "fontSize": fontSize,
        "fontVariant": "small-caps",
        "strokeThickness": Math.ceil(fontSize/10)
    }
}

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