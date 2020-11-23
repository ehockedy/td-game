import { GraphicButton } from "../ui_common/button.js"

export class GameSetting extends PIXI.Container {
    constructor(x, y, name, values, defaultValueIndex, fontSize, width_px, anchorX=0.5, anchorY=0.5) {
        super()
        this.x = x -(anchorX*(width_px))
        this.y = y
        this.name = name
        this.values = values
        this.value = this.values[defaultValueIndex]

        let defaultStyle = {
            align: 'left',
            fontFamily: 'Arial',
            fontSize: fontSize,
            fontWeight: 'bold',
            wordWrap: false
        }
        let configName = new PIXI.Text(this.name, defaultStyle);
        configName.anchor.set(0, 0)
                
        let valueChangerButtonUp = new GraphicButton(40, 15, width_px, (configName.height/2)-2, "\u{25B2}", 12, 0x884488, 1, 1)
        let valueChangerButtonDown = new GraphicButton(40, 15, width_px, (configName.height/2)+2, "\u{25BC}", 12, 0x884488, 1, 0)

        defaultStyle.align = 'right'
        let configCurrValue = new PIXI.Text(this.value, defaultStyle);
        configCurrValue.anchor.set(1, 0)
        configCurrValue.x = width_px - valueChangerButtonUp.width - 5

        this.addChild(configName)
        this.addChild(configCurrValue)
        this.addChild(valueChangerButtonUp)
        this.addChild(valueChangerButtonDown)
    }
}