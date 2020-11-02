import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";

export class InfoToolbar extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towerinfo", width_px, height_px, x, y)
    }

    loadData() {
        let _this = this
        let p = new Promise((resolve) => {
            $.getJSON("shared/json/towers.json", function (data) {
                _this.towerJson = data
                for (let i = 0; i < _this.towerJson.length; i++) {
                    _this.renderTowerInfo(i)
                }
                resolve()
            })
        })
        return p
    }

    showTowerInfo(towerType) {
        this.container.children.forEach(sprite => {
            if (sprite.name == "towerInfo" && sprite.type == towerType) {
                sprite.visible = true
            } else if(sprite.name == "towerInfo") {
                sprite.visible = false
            }
        });
    }

    removeTowerInfo() {
        this.container.children.forEach(sprite => {
            if(sprite.name == "towerInfo") {
                sprite.visible = false
            }
        })
    }

    renderTowerInfo(type) {
        let xMargin = 10

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: this.container.width - xMargin
        }
        let defaultX = this.container.width/2
        let defaultYGap = 20
        let defaultY = defaultYGap

        // Title
        let text = new PIXI.Text('Tower Info', defaultStyle);
        text.x = Math.floor(defaultX)
        text.y = Math.floor(defaultY)
        text.name = "towerInfo"
        text.anchor.set(0.5)
        text.type = type
        text.visible = false
        this.container.addChild(text);

        let towerInfo = this.towerJson[type]["displayInfo"]
        for (let key in towerInfo) {
            defaultY += defaultYGap

            // Description title
            text = new PIXI.Text(key, defaultStyle);
            text.x = Math.floor(xMargin)
            text.y = Math.floor(defaultY)
            text.type = type
            text.visible = false
            text.name = "towerInfo"
            text.style.fontSize = 16
            this.container.addChild(text);

            // Description content
            text = new PIXI.Text(towerInfo[key], defaultStyle);
            text.x = Math.floor(this.container.width - xMargin)
            text.y = Math.floor(defaultY)
            text.anchor.set(1, 0) // Shift right
            text.style.fontWeight = "normal"
            text.style.fontSize = 16
            text.type = type
            text.visible = false
            text.name = "towerInfo"
            this.container.addChild(text);
        }
    }

    // Externally called functions triggered by other components
    onTowerMenuPointerOver(towerType) {
        this.showTowerInfo(towerType)
    }

    onDraggableTowerClick(towerType) {
        this.showTowerInfo(towerType)
    }

    onTowerMenuPointerOff() {
        this.removeTowerInfo()
    }

    onDraggableTowerClickOff() {
        this.removeTowerInfo()
    }

}