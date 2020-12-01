/**
 * Info used on a toolbar, e.g.
 * Lives         100
 */
export class KeyValueInfo extends PIXI.Container {
    constructor (key, value, width_px, xMargin=20, fontSize=20) {
        super()
        let font = 'Arial'
        let keyStyle = {
            fontFamily: font,
            fontSize: fontSize,
            fontWeight: 'bold'
        }

        let valueStyle = {
            fontFamily: font,
            fontSize: fontSize
        }

        this.key = new PIXI.Text(key, keyStyle);
        this.key.x = Math.floor(xMargin)
        this.key.anchor.set(0, 0) // Shift down and left
        this.addChild(this.key);

        this.value = new PIXI.Text(value, valueStyle); // TODO get from config the starting lives value
        this.value.x = Math.floor(width_px - xMargin)
        this.value.anchor.set(1, 0) // Shift down and right
        this.addChild(this.value);
    }

    setValue(value) {
        this.value.text = value
    }
}