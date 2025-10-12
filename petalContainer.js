// basically the petal with the rarity box around it
let currentBiome = '';
let petalImages = {}
let petalImageMap = {}
let enemyImages = {}

function getAngleOnSquare(lineAngle, x, y, w) {
    let rectX = x - w / 2;
    let rectY = y - w / 2;
    let rectCenterX = x;
    let rectCenterY = y;
    let rectW = w;
    let rectH = w;
    let rectDiagAngle = Math.atan2(rectCenterY - rectY, rectX + rectW - rectCenterX);
    let oppositeLegLength;
    let adjacentLegLength;
    // angle <= 180°
    if (lineAngle <= Math.PI) {
        // The collision is between the top and the right edge    
        if (lineAngle < (Math.PI / 2.0)) {
            // The line collides with the right edge            
            if (lineAngle < rectDiagAngle) {
                // For this collision you have the x coordinate, is the same as the right edge x coordinate
                colX = rectX + rectW;
                // Now you need to find the y coordinate for the collision, to do that you just need the opposite leg
                oppositeLegLength = Math.tan(lineAngle) * (rectW / 2);
                colY = rectCenterY - oppositeLegLength;
            } else {
                // The line collides with the top edge
                // 
                // For this collision you have the y coordinate, is the same as the top edge y coordinate
                colY = rectY;
                // Now you need to find the x coordinate for the collision, to do that you just need the adjacent leg
                adjacentLegLength = (rectH / 2) / Math.tan(lineAngle);
                colX = rectCenterX + adjacentLegLength;
            }
        } else {
            // // The collision is between the top and the left edge    
            // 
            // The line collides with the top edge            
            if (lineAngle < (Math.PI - rectDiagAngle)) {
                // For this collision you have the y coordinate, is the same as the top edge y coordinate
                colY = rectY;
                adjacentLegLength = (rectH / 2) / Math.tan(Math.PI - lineAngle);
                colX = rectCenterX - adjacentLegLength;
            } else {
                // The line collides with the left edge
                // 
                // For this collision you have the x coordinate, is the same as the left edge x coordinate
                colX = rectX;
                oppositeLegLength = Math.tan(Math.PI - lineAngle) * (rectW / 2);
                colY = rectCenterY - oppositeLegLength;
            }
        }
    } else {
        // angle > 180°
        //
        // The collision is between the lower and the left edge
        if (lineAngle < (3.0 * Math.PI / 2.0)) {
            //  The line collides with the left edge
            if (lineAngle < (rectDiagAngle + Math.PI)) {
                // For this collision you have the x coordinate, is the same as the left edge x coordinate
                colX = rectX;
                oppositeLegLength = Math.tan(lineAngle - Math.PI) * (rectW / 2);
                colY = rectCenterY + oppositeLegLength;
            } else {
                // The line collides with the lower edge
                // 
                // For this collision you have the y coordinate, is the same as the lower edge y coordinate
                colY = rectY + rectH;
                // Now you need to find the x coordinate for the collision, to do that you just need the adjacent leg
                adjacentLegLength = (rectH / 2) / Math.tan(lineAngle - Math.PI);
                colX = rectCenterX - adjacentLegLength;
            }
        } else {
            // The collision is between the lower and the right edge
            // 
            // The line collides with the lower edge
            if (lineAngle < (2.0 * Math.PI - rectDiagAngle)) {
                // For this collision you have the y coordinate, is the same as the lower edge y coordinate
                colY = rectY + rectH;
                // Now you need to find the x coordinate for the collision, to do that you just need the adjacent leg
                adjacentLegLength = (rectH / 2) / Math.tan(2.0 * Math.PI - lineAngle);
                colX = rectCenterX + adjacentLegLength;
            } else {
                // The line collides with the lower right
                // 
                // For this collision you have the x coordinate, is the same as the right edge x coordinate
                colX = rectX + rectW;
                // Now you need to find the y coordinate for the collision, to do that you just need the opposite leg
                oppositeLegLength = Math.tan(2.0 * Math.PI - lineAngle) * (rectW / 2);
                colY = rectCenterY + oppositeLegLength;
            }
        }
    }
    return { x: colX, y: colY };
}
class PetalContainer {
    constructor(petals, { x, y, w, h, originalX, originalY, radius, toOscillate, isDragging, lastSlot, toRenderText, petalStats, customBiome }, id, amount, attempt) {
        // this.petals has to be an array because of stuff like tringers
        this.petals = petals;
        this.petalStats = petalStats;
        for (let i = 0; i < this.petals.length; i++) {
            this.petals[i].insidePetalContainer = true;
        }
        this.rarity = (this.petals[0] ?? { rarity: 0 }).rarity;
        this.type = (this.petals[0] ?? { type: 'Basic' }).type;
        if (this.type === "Custom" || this.type === "CustomProjectile") {
            this.type = this.petals[0].customType;
        }

        // for reload animation not looking the same for every petal
        this.randomAngle = Math.random() * Math.PI * 2;

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.radius = radius;

        this.render = { x: originalX ?? this.x, y: originalY ?? this.y, w: this.w/*w should be the same as height, idk why i wrote it this way*/ };

        this.amount = amount;// when dragged and dropped, amount will be 1. Amount 1 (x1) doesn't render the x[number] (x2, x3, etc.) in the corner but the same class does if amount != 1;

        this.attempt = attempt;

        this.id = id;

        this.spawnAnimation = 0;

        this.lastAmountChangedTime = -1000;
        this.collectTime = null;

        this.toOscillate = toOscillate !== false;
        if (this.toOscillate === true) {
            this.angleOffset = Math.PI * .05 * (Math.random() * 2 - 1);
        }

        this.creationTime = performance.now();

        this.isDraggingPetalContainer = isDragging ?? false;
        if (this.isDraggingPetalContainer === true) {
            this.lastPetalSlot = lastSlot ?? { index: -1, top: true };
        }

        if (toRenderText !== undefined) {
            this.toRenderText = false;
        }

        this.isHovered = false;
        this.statsBoxAlpha = 0;
        this.statsBox = null;

        if (customBiome !== undefined) {
            this.customBiome = customBiome;
            this.greyed = false;
        }

        // clonePC
        this.generatedIn1v1 = false;
    }
    get ecOverride() {
        if (!enemyOverrides[this.type]) return {}
        return enemyOverrides[this.type]
    }
    generatePetalImage(quality = 62.5, map, livePath=false) {
        const override = map.data.override

        let text = this.type;
        let petalSize = 10;
        let renderSize = 1.5;
        let mainAngle = 0;
        let multiRadius = 10;
        let multiAngle = 0;
        // let image = null;
        if (override?.customName) text = override?.customName
        if (override?.petalSize) petalSize = override?.petalSize
        if (override?.renderSize) renderSize = override?.renderSize
        if (override?.mainAngle) mainAngle = override?.mainAngle
        if (override?.multiRadius) multiRadius = override?.multiRadius
        if (override?.multiAngle) multiAngle = override?.multiAngle
        // if (override?.image) image = override?.image

        const petalData = {
            radius: petalSize,
            angle: 0,
            lastTicksSinceLastDamaged: 1000,
            ticksSinceLastDamaged: 1000,
            rarity: this.rarity,
            customType: this.type
        }

        let imageSize = quality / 100
        const textRatio = Math.min(1, ctx.measureText('Starfis').width / ctx.measureText(text).width)
        
        const count = map.data.count

        if (!override?.image || livePath === true) {

            let newCanvas;
            let newCtx;
            let oldCtx;
            if(livePath === false){
                newCanvas = new OffscreenCanvas(quality, quality);
                newCtx = newCanvas.getContext('2d');
                oldCtx = ctx;
                ctx = newCtx;
            } else if(this.imageLoaded === true){
                petalData.image = this.image;
                petalData.imageLoaded = this.imageLoaded;
                renderSize = .38;
            }

            ctx.setFillStyle = (fs) => {
                if (window.overrideBlendColor !== undefined) {
                    ctx.fillStyle = blendColor(fs, window.overrideBlendColor[1], window.overrideBlendColor[0]);
                    return;
                }
                ctx.fillStyle = fs;
            }
            ctx.setStrokeStyle = (ss) => {
                if (window.overrideBlendColor !== undefined) {
                    ctx.strokeStyle = blendColor(ss, window.overrideBlendColor[1], window.overrideBlendColor[0]);
                    return;
                }
                ctx.strokeStyle = ss;
            }
            ctx.setGlobalAlpha = (a, toIgnoreAlphaMult = false) => {
                if (window.alphaMult !== undefined && toIgnoreAlphaMult !== true) {
                    ctx.globalAlpha = window.alphaMult * a;
                    return;
                }
                ctx.globalAlpha = a;
            }
            ctx.setFillAlpha = (a) => {
                ctx.fillOpacity = a;
            }
            ctx.setStrokeAlpha = (a) => {
                ctx.strokeOpacity = a;
            }
            ctx.setLineWidth = (lw) => { ctx.lineWidth = lw; }

            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            ctx.scale(imageSize, imageSize)

            ctx.translate(50, 42.5)
            ctx.scale(renderSize, renderSize)
            ctx.rotate(mainAngle)
            if (count > 1) {
                const angle = Math.PI * 2 / count
                for (let i = 0; i < count; i++) {
                    ctx.rotate(i * angle)
                    ctx.translate(multiRadius, 0)
                    ctx.rotate(multiAngle)
                    if (petalRenderMap[this.type]) {
                        petalRenderMap[this.type](petalData)
                    } else {
                        petalRenderMap.Custom(petalData)
                    }
                    ctx.rotate(-multiAngle)
                    ctx.translate(-multiRadius, 0)
                    ctx.rotate(-i * angle)
                }
            } else {
                if (petalRenderMap[this.type]) {
                    petalRenderMap[this.type](petalData)
                } else {
                    petalRenderMap.Custom(petalData)
                }
            }
            ctx.rotate(-mainAngle)
            ctx.scale(1 / renderSize, 1 / renderSize)
            ctx.translate(-50, -42.5)

            ctx.font = `900 ${textRatio * 22.5}px Ubuntu`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            ctx.fillStyle = "white"
            ctx.strokeStyle = "black"
            ctx.lineWidth = textRatio * 3.25

            ctx.beginPath()
            ctx.strokeText(text, 50, 75)
            ctx.fillText(text, 50, 75)
            ctx.closePath()

            ctx.scale(1 / imageSize, 1 / imageSize)

            if(livePath === false){
                petalImages[`${this.type}${map.index}`] = newCanvas
                ctx = oldCtx
            } else if(petalData.image){
                this.image = petalData.image;
                this.image.onload = () => {
                    this.imageLoaded = true;
                }
            }
        } else {
            let image = new Image()
            image.src = override.image

            image.onload = () => {

                const newCanvas = new OffscreenCanvas(quality, quality)
                const newCtx = newCanvas.getContext('2d')
                const oldCtx = ctx
                ctx = newCtx

                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'

                ctx.scale(imageSize, imageSize)

                ctx.translate(50, 42.5)
                ctx.scale(renderSize, renderSize)
                ctx.rotate(mainAngle)
                if (count > 1) {
                    const angle = Math.PI * 2 / count
                    for (let i = 0; i < count; i++) {
                        ctx.rotate(i * angle)
                        ctx.translate(multiRadius, 0)
                        ctx.rotate(multiAngle)

                        ctx.scale(petalSize / image.width, petalSize / image.height)
                        ctx.drawImage(image, -image.width / 2, -image.height / 2)
                        ctx.scale(image.width / petalSize, image.height / petalSize)

                        ctx.rotate(-multiAngle)
                        ctx.translate(-multiRadius, 0)
                        ctx.rotate(-i * angle)
                    }
                } else {
                    ctx.scale(petalSize / image.width, petalSize / image.height)
                    ctx.drawImage(image, -image.width / 2, -image.height / 2)
                    ctx.scale(image.width / petalSize, image.height / petalSize)
                }
                ctx.rotate(-mainAngle)
                ctx.scale(1 / renderSize, 1 / renderSize)
                ctx.translate(-50, -42.5)

                ctx.font = `900 ${textRatio * 22.5}px Ubuntu`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                ctx.fillStyle = "white"
                ctx.strokeStyle = "black"
                ctx.lineWidth = textRatio * 3.25

                ctx.beginPath()
                ctx.strokeText(text, 50, 75)
                ctx.fillText(text, 50, 75)
                ctx.closePath()

                ctx.scale(1 / imageSize, 1 / imageSize)

                petalImages[`${this.type}${map.index}`] = newCanvas
                ctx = oldCtx
            }
        }
    }
    generateNamelessPetalImage(quality = 62.5, map) {
        const override = map.data.override

        let petalSize = 10
        let renderSize = 1.5
        let mainAngle = 0
        let multiRadius = 10
        let multiAngle = 0
        let image = null
        if (override?.petalSize) petalSize = override?.petalSize
        if (override?.renderSize) renderSize = override?.renderSize
        if (override?.mainAngle) mainAngle = override?.mainAngle
        if (override?.multiRadius) multiRadius = override?.multiRadius
        if (override?.multiAngle) multiAngle = override?.multiAngle
        if (override?.image) image = override?.image

        const petalData = {
            radius: petalSize,
            angle: 0,
            lastTicksSinceLastDamaged: 1000,
            ticksSinceLastDamaged: 1000,
            rarity: this.rarity,
            customType: this.type
        }

        const imageSize = quality / 100
                
        const count = map.data.count

        if (!override?.image) {

            const newCanvas = new OffscreenCanvas(quality, quality)
            const newCtx = newCanvas.getContext('2d')
            const oldCtx = ctx
            ctx = newCtx

            ctx.setFillStyle = (fs) => {
                if (window.overrideBlendColor !== undefined) {
                    ctx.fillStyle = blendColor(fs, window.overrideBlendColor[1], window.overrideBlendColor[0]);
                    return;
                }
                ctx.fillStyle = fs;
            }
            ctx.setStrokeStyle = (ss) => {
                if (window.overrideBlendColor !== undefined) {
                    ctx.strokeStyle = blendColor(ss, window.overrideBlendColor[1], window.overrideBlendColor[0]);
                    return;
                }
                ctx.strokeStyle = ss;
            }
            ctx.setGlobalAlpha = (a, toIgnoreAlphaMult = false) => {
                if (window.alphaMult !== undefined && toIgnoreAlphaMult !== true) {
                    ctx.globalAlpha = window.alphaMult * a;
                    return;
                }
                ctx.globalAlpha = a;
            }
            ctx.setFillAlpha = (a) => {
                ctx.fillOpacity = a;
            }
            ctx.setStrokeAlpha = (a) => {
                ctx.strokeOpacity = a;
            }
            ctx.setLineWidth = (lw) => { ctx.lineWidth = lw; }

            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            ctx.scale(imageSize, imageSize)

            ctx.translate(50, 50)
            ctx.scale(renderSize, renderSize)
            ctx.rotate(mainAngle)
            if (count > 1) {
                const angle = Math.PI * 2 / count
                for (let i = 0; i < count; i++) {
                    ctx.rotate(i * angle)
                    ctx.translate(multiRadius, 0)
                    ctx.rotate(multiAngle)
                    if (petalRenderMap[this.type]) {
                        petalRenderMap[this.type](petalData)
                    } else {
                        petalRenderMap.Custom(petalData)
                    }
                    ctx.rotate(-multiAngle)
                    ctx.translate(-multiRadius, 0)
                    ctx.rotate(-i * angle)
                }
            } else {
                if (petalRenderMap[this.type]) {
                    petalRenderMap[this.type](petalData)
                } else {
                    petalRenderMap.Custom(petalData)
                }
            }
            ctx.rotate(-mainAngle)
            ctx.scale(1 / renderSize, 1 / renderSize)
            ctx.translate(-50, -50)

            ctx.scale(1 / imageSize, 1 / imageSize)

            petalImages[`${this.type}${map.index}nameless`] = newCanvas
            ctx = oldCtx
        } else {
            let image = new Image()
            image.src = override.image

            image.onload = () => {

                const newCanvas = new OffscreenCanvas(quality, quality)
                const newCtx = newCanvas.getContext('2d')
                const oldCtx = ctx
                ctx = newCtx

                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'

                ctx.scale(imageSize, imageSize)

                ctx.translate(50, 50)
                ctx.scale(renderSize, renderSize)
                ctx.rotate(mainAngle)
                if (count > 1) {
                    const angle = Math.PI * 2 / count
                    for (let i = 0; i < count; i++) {
                        ctx.rotate(i * angle)
                        ctx.translate(multiRadius, 0)
                        ctx.rotate(multiAngle)

                        ctx.scale(petalSize / image.width, petalSize / image.height)
                        ctx.drawImage(image, -image.width / 2, -image.height / 2)
                        ctx.scale(image.width / petalSize, image.height / petalSize)

                        ctx.rotate(-multiAngle)
                        ctx.translate(-multiRadius, 0)
                        ctx.rotate(-i * angle)
                    }
                } else {
                    ctx.scale(petalSize / image.width, petalSize / image.height)
                    ctx.drawImage(image, -image.width / 2, -image.height / 2)
                    ctx.scale(image.width / petalSize, image.height / petalSize)
                }
                ctx.rotate(-mainAngle)
                ctx.scale(1 / renderSize, 1 / renderSize)
                ctx.translate(-50, -50)

                ctx.scale(1 / imageSize, 1 / imageSize)

                petalImages[`${this.type}${map.index}nameless`] = newCanvas
                ctx = oldCtx
            }
        }
    }
    generateEnemyImage(quality = 62.5) {
        const newCanvas = new OffscreenCanvas(quality, quality)
        const newCtx = newCanvas.getContext('2d')
        const oldCtx = ctx
        ctx = newCtx

        const override = this.ecOverride // we need the extra 0.001ms!!!! 

        let text = this.type
        let enemySize = 25
        let renderSize = 1
        let angle = -3 * Math.PI / 4
        let customRender = null
        if (override?.customName) text = override?.customName
        if (override?.enemySize) enemySize = override?.enemySize
        if (override?.renderSize) renderSize = override?.renderSize
        if (override?.angle) angle = override?.angle
        if (override?.customRender) customRender = override?.customRender

        const enemyData = {
            render: {
                radius: enemySize,
                angle: 0,
                time: 5000000,
                lastX: -100,
                lastY: -100,
                x: 100,
                y: 100
            },
            radius: enemySize,
            lastTicksSinceLastDamaged: 1000,
            ticksSinceLastDamaged: 1000,
            rarity: 0,
            isInEnemyBox: true,
            customType: this.type
        }

        const imageSize = quality / 100

        ctx.setFillStyle = (fs) => {
            if (window.overrideBlendColor !== undefined) {
                ctx.fillStyle = blendColor(fs, window.overrideBlendColor[1], window.overrideBlendColor[0]);
                return;
            }
            ctx.fillStyle = fs;
        }
        ctx.setStrokeStyle = (ss) => {
            if (window.overrideBlendColor !== undefined) {
                ctx.strokeStyle = blendColor(ss, window.overrideBlendColor[1], window.overrideBlendColor[0]);
                return;
            }
            ctx.strokeStyle = ss;
        }
        ctx.setGlobalAlpha = (a, toIgnoreAlphaMult = false) => {
            if (window.alphaMult !== undefined && toIgnoreAlphaMult !== true) {
                ctx.globalAlpha = window.alphaMult * a;
                return;
            }
            ctx.globalAlpha = a;
        }
        ctx.setFillAlpha = (a) => {
            ctx.fillOpacity = a;
        }
        ctx.setStrokeAlpha = (a) => {
            ctx.strokeOpacity = a;
        }
        ctx.setLineWidth = (lw) => { ctx.lineWidth = lw; }

        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.scale(imageSize, imageSize)

        ctx.translate(50, 50)
        ctx.scale(renderSize, renderSize)
        ctx.rotate(angle)
        if (!customRender) {
            if (enemyRenderMap[this.type]) {
                if (enemyDataMap[this.type]) enemyData.data = enemyDataMap[this.type](enemyData)
                enemyRenderMap[this.type](enemyData)
            } else {
                enemyRenderMap.Custom(enemyData)
            }
        } else {
            customRender()
        }
        ctx.rotate(-angle)
        ctx.scale(1 / renderSize, 1 / renderSize)
        ctx.translate(-50, -50)

        ctx.scale(1 / imageSize, 1 / imageSize)

        enemyImages[`${this.type}`] = newCanvas
        ctx = oldCtx
    }
    // TODO: polish animations! Have some flag for if the petal container is on the ground. If it is then render that oscillation animation and draw that semi opaq black border around it.
    updateInterpolate() {
        this.render.x = interpolate(this.render.x, this.x, 0.00672 * dt);
        this.render.y = interpolate(this.render.y, this.y, 0.00672 * dt);
        this.render.w = interpolate(this.render.w, this.w, 0.00672 * dt);
        if (this.collectTime) {
            this.spawnAnimation = interpolate(this.spawnAnimation, 0, 0.00672 * dt);
        } else {
            this.spawnAnimation = interpolate(this.spawnAnimation, 1, 0.00672 * dt);
        }
    }
    drawStatsBox(drawBelow = false) {
        if (window.statBoxes === false) {
            return;
        }
        if (this.isHovered === true) {
            if (this.statsBox === null) {
                let lastOscillating = this.toOscillate;
                let lastDimensions = { w: this.w, h: this.h };
                this.w = 58;
                this.h = 58;
                this.toOscillate = false;
                this.statsBox = generateStatsBox(this, true,
                    {
                        x: this.x,
                        y: this.y
                    }
                )
                this.w = lastDimensions.w;
                this.h = lastDimensions.h;
                this.toOscillate = lastOscillating;
            }
            this.statsBoxAlpha += 0.15 * dt / 18;
            if (this.statsBoxAlpha > 1) {
                this.statsBoxAlpha = 1;
            }

            ctx.globalAlpha = this.statsBoxAlpha;
        } else {
            this.statsBoxAlpha -= 0.15 * dt / 18;
            if (this.statsBoxAlpha < 0) {
                this.statsBoxAlpha = 0;
            }
        }
        if (this.statsBoxAlpha !== 0) {
            this.statsBox.x = this.render.x - this.statsBox.w / 2
            this.statsBox.y = drawBelow
                ? this.render.y + this.h / 2 + 11.5
                : this.render.y - this.statsBox.h - this.h / 2 - 11.5;
            ctx.globalAlpha = this.statsBoxAlpha;
            this.statsBox.pc.amount = this.amount;
            this.statsBox.draw();
            ctx.globalAlpha = 1;
        }
        this.isHovered = false;

        if (this.statsBox && this.statsBox.shouldRegenPC === true) {
            this.statsBox.shouldRegenPC = false;
        }
    }
    draw(inGame, number) {
        this.updateInterpolate();

        if (this.toOscillate === true && toRender({ x: this.render.x, y: this.render.y, radius: this.radius }, window.camera) === false && this.toSkipCulling !== true) {
            return;
        }

        const renderAnimationTimer = smoothstep(this.spawnAnimation);

        let scale = 1;
        let rotation = 0;

        ctx.lastTransform = ctx.getTransform();
        ctx.translate(this.render.x, this.render.y);
        scale *= renderAnimationTimer * this.render.w / 50;

        rotation -= (1 - renderAnimationTimer) * Math.PI * 3;
        if (this.isDraggingPetalContainer === true) {
            if (this.draggingTimer === undefined) this.draggingTimer = 0;
            this.draggingTimer += 1000 / 30 * dt / 16.66;
            rotation += Math.sin(this.draggingTimer / 280) * 0.28;
            if (this !== draggingPetalContainer) {
                this.isDraggingPetalContainer = false;
                this.undraggingPetalContainerTimer = 30;
                this.lastDraggingAngle = Math.sin(this.draggingTimer / 280) * 0.28;
            }
        } else if (this.undraggingPetalContainerTimer !== undefined) {
            if (this.interval === undefined) {
                this.lastDraggingAngle = interpolate(this.lastDraggingAngle, 0, 0.15);
                rotation += this.lastDraggingAngle;
                this.undraggingPetalContainerTimer--;
                if (this.undraggingPetalContainerTimer < 0) {
                    delete this.undraggingPetalContainerTimer;
                    delete this.lastDraggingAngle;
                    delete this.draggingTimer;
                }
            }
        }

        if (this.toOscillate === true) {
            scale *= 1 + Math.sin(performance.now() / 1000 / .076) / 52;
            rotation += this.angleOffset;
        }

        // ___ start ___ 
        if (rotation !== 0) ctx.rotate(rotation);
        if (scale !== 1) ctx.scale(scale, scale);
        if (this.toOscillate === true && this.isDisplayPetalContainer !== true) {
            // bigger grey border
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.roundRect(-30, -30, 60, 60, 5);
            ctx.fill();
            ctx.closePath();
            ctx.globalAlpha = 1;
        }

        // draw rect
        ctx.lineWidth = 4.5;

        // greyed if and only if its a custom petal in an official biome

        currentBiome = biomeManager.getCurrentBiome();
        this.greyed = (this.customBiome !== undefined && window.officialBiomes.includes(currentBiome) === true);
        if (this.type === 'soccer petal' && currentBiome !== 'Soccer!') this.greyed = true;
        if (this.greyed) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "#525252";
            ctx.strokeStyle = "#404040";
        } else {
            ctx.fillStyle = Colors.rarities[this.rarity].color;
            ctx.strokeStyle = Colors.rarities[this.rarity].border;

            if (staticGradients[this.rarity]) ctx.fillStyle = staticGradients[this.rarity];
        }

        if ((currentBiome === '1v1' && this.generatedIn1v1 === false) || (currentBiome !== '1v1' && this.generatedIn1v1 === true)) {
            //if(typeof pregeneratedPvpStats === "undefined") generatePvpStats();
            let statsToTake;
            if (currentBiome === '1v1') {
                statsToTake = pvpStats;
            } else {
                statsToTake = Stats;
            }

            if (this.petals.length !== 0 && this.petals[0].team !== undefined) {
                statsToTake = statsToTake.enemies;
            } else {
                statsToTake = statsToTake.petals;
            }

            let petalAmount = 0;
            if (statsToTake[this.type] !== undefined && statsToTake[this.type][this.rarity] !== undefined) {
                const petalLayout = statsToTake[this.type][this.rarity].petalLayout;
                if (petalLayout === undefined) petalAmount = 1;
                else {
                    for (let i = 0; i < petalLayout.length; i++) {
                        for (let j = 0; j < petalLayout[i].length; j++) {
                            petalAmount++;
                        }
                    }
                }
            } else {
                petalAmount = 1;
            }

            if (petalAmount < this.petals.length) {
                this.petals.length = petalAmount;
            } else {
                while (this.petals.length < petalAmount) {
                    this.petals.push(new Petal(this.petals[Math.floor(Math.random() * this.petals.length)]));
                }
            }
            this.generatedIn1v1 = !this.generatedIn1v1;
        }

        let gradientFill;
        if (Colors.rarities[this.rarity].fancy !== undefined && window.hqp == true) {
            gradientFill = ctx.createLinearGradient(-30, -30, 30, 30);
            createFancyGradient(gradientFill, this.rarity);
            ctx.fillStyle = gradientFill;
            ctx.strokeStyle = Colors.rarities[this.rarity].fancy.border;
        }

        if (
            this.type === "Shattered Relic of Wrath" ||
            this.type === "Reinforced Relic of Wrath" ||
            this.type === "Subset Relic of the Guardian" ||
            this.type === "Division Relic of the Guardian" ||
            this.type === "Guard Relic of the Guardian" ||
            this.type === "Knight Relic of the Guardian" ||
            this.type === "Aid Relic of Serenity" ||
            this.type === "Subliminal Relic of Serenity" ||
            this.type === "Barrier Relic of Serenity"
        ) {
            ctx.fillStyle = `hsl(${(time / 10) % 360}, 30%, 60%)`
            ctx.strokeStyle = `hsl(${(time / 10) % 360}, 50%, 40%)`
        }

        ctx.beginPath();
        ctx.roundRect(-25, -25, 50, 50, .25);
        ctx.fill();
        ctx.closePath();

        if (Colors.rarities[this.rarity].fancy !== undefined && Colors.rarities[this.rarity].fancy.stars !== undefined && window.hqp == true) {
            //ctx.save();

            ctx.beginPath()
            ctx.roundRect(-27.25, -27.25, 54.5, 54.5, 1);
            //ctx.clip()
            ctx.closePath
            //shiny stars & stuff
            if (!this.stars) {
                this.stars = [];
                for (let starnum = 0; starnum < Colors.rarities[this.rarity].fancy.stars; starnum++) {
                    this.stars.push({ x: Math.random() * 50 - 25, y: Math.random() * 50 - 25 })
                }
            }
            ctx.fillStyle = "#ffffff";
            for (let star of this.stars) {
                star.x += 0.1;
                star.y += 0.1;
                if (star.x > 25 || star.y > 25) {
                    star.x = Math.random() * 800 - 20 - 30;
                    star.y = -30;

                }

                if (star.x < 25 && star.x > -25 && star.y < 25 && star.y > -25) {
                    ctx.beginPath();

                    var grad = ctx.createRadialGradient(star.x, star.y, 15, star.x, star.y, 0);
                    grad.addColorStop(0, "transparent");
                    grad.addColorStop(0.8, `rgba(255,255,255,${(Math.cos(Date.now() / 600 + star.x / 30 + star.y / 30) + 1) * 0.8})`);
                    grad.addColorStop(1, "white");

                    ctx.fillStyle = grad;
                    ctx.globalAlpha = 0.3;

                    ctx.fillRect(-25, -25, 50, 50);
                    ctx.globalAlpha = 1;

                    ctx.fillStyle = "#fff";

                    ctx.arc(star.x, star.y, 1, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath();
                }
            }
            //ctx.restore();
        }

        //draw reload stuff
        if (inGame) {
            if (petalReloadData[number]) {
                //console.log("drawing reload data");
                if (petalReloadData[number].reload > 0.001 && petalReloadData[number].reload < 0.999) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(-25, -25, 50, 50, .25);
                    ctx.clip();

                    ctx.globalAlpha = 0.3;
                    ctx.lineCap = "butt";

                    let offset = (1 - Math.pow(petalReloadData[number].reload, 0.7)) * Math.PI * 6 + this.randomAngle;

                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 50;
                    ctx.beginPath();
                    ctx.arc(0, 0, 25, offset - Math.PI * 2 * smoothstep(petalReloadData[number].reload), offset);
                    ctx.stroke();
                    ctx.closePath();

                    ctx.restore();
                }
            } else if (petalHpData[number]) {
                //console.log("hp data exists", petalHpData[number].hp);
                if (petalHpData[number].hp > 0.001 && petalHpData[number].hp < 0.999) {
                    //from 1 -> hp overlay pc
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(-23, -23, 46, 46, .25);
                    ctx.clip();

                    ctx.globalAlpha = 0.3;
                    ctx.lineCap = "butt";

                    ctx.fillStyle = "#000000";
                    ctx.beginPath();
                    ctx.rect(-25, -25, 50, 50 * (1 - petalHpData[number].hp));
                    ctx.fill();
                    ctx.closePath();

                    ctx.restore();
                }

            }
        }

        ctx.beginPath();
        ctx.roundRect(-25, -25, 50, 50, .25);
        ctx.stroke();
        ctx.closePath();

        if (Colors.rarities[this.rarity].fancy !== undefined && window.hqp == true) {
            ctx.globalAlpha *= .5
            ctx.beginPath();
            ctx.roundRect(-27.25, -27.25, 54.5, 54.5, 1);
            ctx.fillStyle = gradientFill;
            ctx.fill()
            ctx.closePath();
            ctx.globalAlpha = 1
        }

        if (this.petals[0].constructor === Petal) {
            if (!petalImageMap[this.type]) setPcIndexes(this.type);
            const imageIndex = petalImageMap[this.type][this.rarity];
            if (!this.nameless) {
                if(window.hqp){
                    // high quality renders
                    let imgScale = this.render.w * (62 / this.render.w) / (62.5 * 1.15);
                    let lastTransform = ctx.getTransform();
                    let lastSS = ctx.strokeStyle;
                    let lastLW = ctx.lineWidth;
                    ctx.getTransform();
                    ctx.scale(imgScale, imgScale);
                    ctx.translate(-62.5/2, -62.5/2);
                    this.generatePetalImage(62.5, imageIndex, true);
                    ctx.setTransform(lastTransform);
                    ctx.strokeStyle = lastSS;
                    ctx.lineWidth = lastLW;
                } else {
                    if (!petalImages[`${this.type}${imageIndex.index}`]) this.generatePetalImage(62.5, imageIndex);
                    const image = petalImages[`${this.type}${imageIndex.index}`];

                    if (image) {
                        const imgScale = this.render.w * (62 / this.render.w) / (image.width * 1.15)

                        ctx.scale(imgScale, imgScale)
                        ctx.drawImage(image, -image.width / 2, -image.width / 2)
                        ctx.scale(1 / imgScale, 1 / imgScale)
                    }
                }
                
            } else {
                if (!petalImages[`${this.type}${imageIndex.index}nameless`]) this.generateNamelessPetalImage(62.5, imageIndex)
                const image = petalImages[`${this.type}${imageIndex.index}nameless`]

                if (image) {
                    const imgScale = this.render.w * (62 / this.render.w) / (image.width * 1.15)

                    ctx.scale(imgScale, imgScale)
                    ctx.drawImage(image, -image.width / 2, -image.width / 2)
                    ctx.scale(1 / imgScale, 1 / imgScale)
                }
            }
        }

        if (this.petals[0].constructor === Enemy) {
            if (!enemyImages[`${this.type}`]) this.generateEnemyImage()
            const image = enemyImages[`${this.type}`]

            if (image) {
                const imgScale = this.render.w * (62 / this.render.w) / (image.width * 1.15)

                ctx.scale(imgScale, imgScale)
                ctx.drawImage(image, -image.width / 2, -image.width / 2)
                ctx.scale(1 / imgScale, 1 / imgScale)
            }
        }

        if (scale !== 1) ctx.scale(1 / scale, 1 / scale);
        if (rotation !== 0) ctx.rotate(-rotation);
        // ___ end ___

        if (this.amount !== 1 || (performance.now() - this.lastAmountChangedTime < 240)) {
            if (performance.now() - this.lastAmountChangedTime < 240) {
                ctx.globalAlpha = smoothstep((performance.now() - this.lastAmountChangedTime) / 240);
            }
            if (this.amount === 1) {
                ctx.globalAlpha = 1 - ctx.globalAlpha;
            }
            ctx.font = `600 ${13 * scale}px Ubuntu`;
            ctx.letterSpacing = "1px";
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.translate((70 / (2.5) + .5) * scale, (-42 / (2.5) + .5) * scale);
            ctx.rotate(Math.PI / 9.1);
            if (this.greyed) ctx.globalAlpha *= 0.3;
            ctx.strokeText('x' + (this.amount === 1 ? 2 : formatAmount(this.amount)), 0, 0);
            ctx.fillText('x' + (this.amount === 1 ? 2 : formatAmount(this.amount)), 0, 0);
            ctx.globalAlpha = 1;
        }

        if (this.greyed) ctx.globalAlpha = 1;

        ctx.setTransform(ctx.lastTransform);
        delete ctx.lastTransform;
    }
}

function formatAmount(amount) {
    if (amount < 1e3) {
        return amount;
    }

    ctx.letterSpacing = ".5px";

    const suffixes = [
        { value: 1e51, suffix: "sDc" }, // Sexdecillion
        { value: 1e48, suffix: "QDc" }, // Quindecillion
        { value: 1e45, suffix: "qDc" }, // Quattuordecillion
        { value: 1e42, suffix: "tDc" }, // Tredecillion
        { value: 1e39, suffix: "dDc" }, // Duodecillion
        { value: 1e36, suffix: "uDc" }, // Undecillion
        { value: 1e33, suffix: "Dc" }, // Decillion
        { value: 1e30, suffix: "No" }, // Nonillion
        { value: 1e27, suffix: "Oc" }, // Octillion
        { value: 1e24, suffix: "Sp" }, // Septillion
        { value: 1e21, suffix: "Sx" },
        { value: 1e18, suffix: "Qt" },
        { value: 1e15, suffix: "Qd" },
        { value: 1e12, suffix: "t" },
        { value: 1e9,  suffix: "b" },
        { value: 1e6,  suffix: "m" },
        { value: 1e3,  suffix: "k" }
    ];

    for (let i = 0; i < suffixes.length; i++) {
        if (amount >= suffixes[i].value) {
            let formatted = Math.floor(amount / (suffixes[i].value / 100)) / 100;
            return formatted + suffixes[i].suffix;
        }
    }

    return amount; // Fallback
}
function formatAmountHighPrecision(amountRaw) {
    const absAmount = Math.abs(amountRaw);
    const sign = Math.sign(amountRaw);

    // For small numbers, use more decimals
    if (absAmount < 10) {
        return Math.floor(absAmount * 100) / 100 * sign;
    } else if (absAmount < 100) {
        return Math.floor(absAmount * 10) / 10 * sign;
    } else if (absAmount < 1000) {
        return Math.floor(absAmount) * sign;
    }

    // Define thresholds and suffixes
    const suffixes = [
        { value: 1e51, suffix: "sDc" }, // Sexdecillion
        { value: 1e48, suffix: "QDc" }, // Quindecillion
        { value: 1e45, suffix: "qDc" }, // Quattuordecillion
        { value: 1e42, suffix: "tDc" }, // Tredecillion
        { value: 1e39, suffix: "dDc" }, // Duodecillion
        { value: 1e36, suffix: "uDc" }, // Undecillion
        { value: 1e33, suffix: "Dc" }, // Decillion
        { value: 1e30, suffix: "No" }, // Nonillion
        { value: 1e27, suffix: "Oc" }, // Octillion
        { value: 1e24, suffix: "Sp" }, // Septillion
        { value: 1e21, suffix: "Sx" },
        { value: 1e18, suffix: "Qt" },
        { value: 1e15, suffix: "Qd" },
        { value: 1e12, suffix: "t" },
        { value: 1e9,  suffix: "b" },
        { value: 1e6,  suffix: "m" },
        { value: 1e3,  suffix: "k" }
    ];

    for (let i = 0; i < suffixes.length; i++) {
        const { value, suffix } = suffixes[i];
        if (absAmount >= value) {
            let formatted = Math.floor(absAmount / (value / 100)) / 100;
            return (formatted * sign) + suffix;
        }
    }

    return amountRaw; // fallback, shouldn't hit
}

function smoothstep(t) {
    return interpolate(t * t, 1 - (1 - t) * (1 - t), t);
}

let petalOverrides = {
    "Plastic Egg": {
        0: {
            customName: "Egg",
            renderSize: 1.75,
            petalSize: 12.5
        }
    },
    "Jellyfish Egg": {
        0: {
            customName: "Egg",
            renderSize: 1.75,
            petalSize: 12.5
        }
    },
    "Egg": {
        0: {
            renderSize: 1.75,
            petalSize: 12.5
        }
    },
    "Fire Missile": {
        0: {
            customName: "Missile",
            mainAngle: 1.25 * Math.PI / 4,
            renderSize: 1.25
        }
    },
    "Amulet of Time": {
        0: {
            customName: "Amulet",
            renderSize: 2
        },
        11: {
            customName: "Amulet",
            renderSize: 2
        },
        12: {
            customName: "Amulet",
            renderSize: 2
        }
    },
    "Amulet of Grace": {
        0: {
            customName: "Amulet",
            mainAngle: Math.PI / 7.5,
            renderSize: 2
        },
        11: {
            customName: "Amulet",
            mainAngle: Math.PI / 7.5,
            renderSize: 2
        },
        12: {
            customName: "Amulet",
            mainAngle: Math.PI / 7.5,
            renderSize: 2
        }
    },
    "Amulet of Divergence": {
        0: {
            customName: "Amulet",
            mainAngle: Math.PI / 4,
            renderSize: 2
        },
        11: {
            customName: "Amulet",
            mainAngle: Math.PI / 4,
            renderSize: 2
        },
        12: {
            customName: "Amulet",
            mainAngle: Math.PI / 4,
            renderSize: 2
        },
        13: {
            customName: "Amulet",
            mainAngle: Math.PI / 4,
            renderSize: 2
        }
    },
    "Missile": {
        0: {
            mainAngle: 1.25 * Math.PI / 4,
            renderSize: 1.25
        }
    },
    "Dark Compass": {
        0: {
            customName: "Compass",
            mainAngle: -Math.PI / 4
        },
        10: {
            customName: "Compass",
        }
    },
    "Waterlogged Compass": {
        0: {
            customName: "Compass",
            mainAngle: -Math.PI / 4
        },
        10: {
            customName: "Compass",
        }
    },
    "Waterlogged Dark Compass": {
        0: {
            customName: "Compass",
            mainAngle: -Math.PI / 4
        },
        10: {
            customName: "Compass",
        }
    },
    "Compass": {
        0: {
            mainAngle: -Math.PI / 4
        },
        10: {}
    },
    "Shiny Bubble": {
        0: {
            customName: "Bubble",
            mainAngle: Math.PI / 12
        }
    },
    "Ikea": {
        0: {
            image: "https://archello.com/thumbs/images/2014/02/03/IKEA-Tampines.1506072620.5502.jpg?fit=crop&w=414&h=518",
            petalSize: 40
        }
    },
    "Thomas": {
        0: {
            image: "https://i.pinimg.com/originals/96/21/65/96216524958973ceffb8b7a2f29c9110.png",
            petalSize: 30
        }
    },
    "Stinger": {
        0: {
            petalSize: 7.5
        },
        6: {
            multiAngle: -Math.PI,
            petalSize: 7.5
        }
    },
    "Blood Jolt": {
        0: {
            customName: "Jolt"
        }
    },
    "Blood Stinger": {
        0: {
            petalSize: 7.5,
            customName: "Stinger"
        },
        6: {
            multiAngle: -Math.PI,
            petalSize: 7.5,
            customName: "Stinger"
        }
    },
    "Wing": {
        0: {
            renderSize: 2
        },
        12: {
            multiRadius: 4,
            renderSize: 2
        },
        14: {
            multiAngle: Math.PI/8,
            multiRadius: 4,
            renderSize: 2
        }
    },
    "Shiny Wing": {
        0: {
            renderSize: 2,
            customName: "Wing"
        },
        12: {
            multiRadius: 4,
            renderSize: 2,
            customName: "Wing"
        },
        14: {
            multiAngle: Math.PI/8,
            multiRadius: 4,
            renderSize: 2,
            customName: "Wing"
        }
    },
    "Claw": {
        0: {
            renderSize: 2
        }
    },
    "Fangs": {
        0: {
            renderSize: 2
        }
    },
    "Starfish": {
        0: {
            renderSize: 2.5
        },
        13: {
            mainAngle: 3 * Math.PI / 4,
            renderSize: 2.05,
            multiAngle: Math.PI / 8
        }
    },
    "Blade": {
        0: {
            multiAngle: -Math.PI
        }
    },
    "Bubble": {
        0: {
            renderSize: 1.825,
            mainAngle: 3 * Math.PI / 4
        }
    },
    "Shiny Bubble": {
        0: {
            renderSize: 1.75,
            mainAngle: 3 * Math.PI / 4
        }
    },
    "Toxin": {
        0: {
            renderSize: 2
        }
    },
    "Neurotoxin": {
        0: {
            renderSize: 2,
            customName: "Toxin"
        }
    },
    "Batrachotoxin": {
        0: {
            renderSize: 2,
            customName: "Toxin"
        }
    },
    "Clover": {
        0: {
            renderSize: 2.5
        },
        12: {
            renderSize: 2.5
        },
        13: {
            renderSize: 2.5
        },
        14: {
            renderSize: 2.5
        },
        15: {
            renderSize: 2.5
        },
        16: {
            renderSize: 2.5
        },
        17: {
            renderSize: 2.5
        },
        18: {
            renderSize: 2.5
        },
        19: {
            renderSize: 2.5
        },
        20: {
            renderSize: 2.5
        },
        21: {
            renderSize: 2.5
        },
        22: {
            renderSize: 2.5
        },
        23: {
            renderSize: 2.5
        },
        24: {
            renderSize: 2.5
        },
        25: {
            renderSize: 2.5
        },
        26: {
            renderSize: 2.5
        },
        27: {
            renderSize: 2.5
        },
        28: {
            renderSize: 2.5
        },
        29: {
            renderSize: 2.5
        },
    },
    "Bloom": {
        0: {
            petalSize: 12.5
        }
    },
    "Neutron Star": {
        0: {
            renderSize: 3
        }
    },
    "Card": {
        0: {
            petalSize: 15,
            mainAngle: -Math.PI / 4
        }
    },
    "Cash": {
        0: {
            petalSize: 25,
            mainAngle: -Math.PI / 4
        }
    },
    "Pentagon": {
        0: {
            renderSize: 2.5
        }
    },
    "Husk": {
        0: {
            petalSize: 12.5
        }
    },
    "Soil": {
        0: {
            petalSize: 12.5,
            renderSize: 1.25
        }
    },
    "Square": {
        0: {
            renderSize: 2.25,
            mainAngle: -Math.PI / 8,
            petalSize: 12.5
        }
    },
    "Trident": {
        0: {
            renderSize: 2.25
        }
    },
    "Coral": {
        0: {
            renderSize: 2.25
        }
    },
    "Rubber": {
        0: {
            renderSize: 2
        }
    },
    "Sponge": {
        0: {
            renderSize: 3
        }
    },
    "Jelly": {
        0: {
            renderSize: 2
        }
    },
    "Lightning": {
        0: {
            renderSize: 1.25
        }
    },
    "Pearl": {
        0: {
            renderSize: 2.5
        }
    },
    "Cactus": {
        0: {
            petalSize: 12.5
        },
        6: {
            image: './gfx/deteled.png',
            renderSize: 5
        },
        7: {
            petalSize: 12.5
        }
    },
    "Third Eye": {
        0: {
            renderSize: 1.5
        }
    },
    "Mandible": {
        0: {
            petalSize: 12.5,
            renderSize: 2
        },
        13: {
            petalSize: 12.5,
            renderSize: 1.75,
            multiRadius: 7.5,
        }
    },
    "Magnet": {
        0: {
            renderSize: 2.5
        },
        10: {
            renderSize: 2,
            multiRadius: 7.5
        },
        13: {
            renderSize: 2,
            multiRadius: 7.5,
            multiAngle: -Math.PI/1.5
        }
    },
    "Oranges": {
        12: {
            mainAngle: -Math.PI / 2
        }
    },
    "Fig": {
        0: {
            renderSize: 2.3
        }
    },
    "Coconut": {
        0: {
            renderSize: 2.4
        }
    },
    "Root": {
        0: {
            renderSize: 2.4
        }
    },
    "Heavy": {
        0: {
            renderSize: 2.5
        }
    },
    "Rog456": {
        0: {
            renderSize: 3
        }
    },
    "Rice": {
        0: {
            renderSize: 1.75,
            mainAngle: Math.PI / 4
        }
    },
    "Faster": {
        0: {
            petalSize: 7.5
        }
    },
    "Dandelion": {
        0: {
            mainAngle: Math.PI / 4
        },
        5: {
            multiAngle: Math.PI / 4 + Math.PI / 12
        },
        5: {
            multiAngle: 2 * Math.PI / 3 - Math.PI / 12
        },
        12: {
            multiAngle: Math.PI / 5 + Math.PI
        }
    },
    "Pollen": {
        0: {
            petalSize: 7.5
        }
    },
    "Yin Yang": {
        0: {
            petalSize: 15
        }
    },
    "Dahlia": {
        0: {
            petalSize: 7.5
        }
    },
    "Rose": {
        0: {
            petalSize: 12.5
        },
        12: {
            petalSize: 12.5
        }
    },
    "Light": {
        0: {
            petalSize: 7.5
        }
    },
    "Blood Light": {
        0: {
            petalSize: 7.5,
            customName: "Light",
        }
    },
    "Blood Rose": {
        0: {
            petalSize: 12.5,
            customName: "Rose",
        }
    },
    
    "Powder": {
        0: {
            petalSize: 8.25
        }
    },
    "Sand": {
        0: {
            petalSize: 7.5
        }
    },
    "Rock": {
        0: {
            petalSize: 12.5,
            renderSize: 1.75
        },
        7: {
            image: "https://memes.co.in/memes/update/uploads/2021/12/InShot_20211209_222013681-1024x1024.jpg",
            renderSize: 4.25
        },
        8: {
            petalSize: 12.5,
            renderSize: 1.75
        }
    },
    "Iris": {
        0: {
            petalSize: 7.5
        },
        13: {
            petalSize: 15
        },
        14: {
            petalSize: 20
        }
    },
    "Corn": {
        0: {
            petalSize: 15
        }
    },
    "Blood Corn": {
        0: {
            petalSize: 15,
            customName: "Corn",
        }
    },
    
    "Honey": {
        0: {
            petalSize: 12.5
        }
    },
    "Web": {
        0: {
            petalSize: 12.5
        }
    },
    "Bone": {
        0: {
            petalSize: 12.5
        }
    },
    "Dark Spine": {
        0: {
            renderSize: 2,
            mainAngle: -Math.PI / 4,
            customName: "Spine"
        }
    },
    "Peas": {
        0: {
            renderSize: 1.25
        },
        12: {}
    },
    "Grapes": {
        0: {
            renderSize: 1.25
        },
        12: {}
    },
    "Mini Flower": {
        0: {
            renderSize: 2
        }
    },
    "Horn": {
        0: {
            renderSize: 2
        }
    },
    "Blood Horn": {
        0: {
            renderSize: 2,
            customName: "Horn"
        }
    },
    "Blood Leaf": {
        0: {
            customName: "Leaf"
        }
    },
    "Shard of Divergence": {
        0: {
            customName: "Shard",
            mainAngle: Math.PI / 7.5,
            renderSize: 2
        }
    },
    "Shard of Time": {
        0: {
            customName: "Shard",
            mainAngle: Math.PI / 7.5,
            renderSize: 2
        }
    },
    "Shard of Grace": {
        0: {
            customName: "Shard",
            mainAngle: Math.PI / 7.5,
            renderSize: 2
        }
    },
    "Trinket of the Hivemind": {
        0: {
            customName: "Trinket",
            renderSize: 2.5
        }
    },
    "Trinket of the Sea": {
        0: {
            customName: "Trinket",
            renderSize: 2.5,
            mainAngle: Math.PI/4
        }
    },
    "Trinket of the Wild": {
        0: {
            customName: "Trinket",
            renderSize: 2.5
        }
    },
    "Ant Egg": {
        0: {
            customName: "Egg",
            multiRadius: 7.5,
            renderSize: 1.75
        }
    },
    "Shiny Leaf": {
        0: {
            customName: "Leaf",
        }
    },
    "Thorax": {
        0: {
            mainAngle: -Math.PI/4,
            renderSize: 2
        }
    },
    "Carapace": {
        0: {
            mainAngle: -Math.PI/4,
            renderSize: 2
        }
    },
    "Lilypad": {
        0: {
            mainAngle: -Math.PI/4,
            renderSize: 2.5 
        }
    },
    "Blossom": {
        0: {
            renderSize: 4,
        }
    },
    "Plank": {
       0: {
            mainAngle: -Math.PI/4,
            renderSize: 2.2
       }
    },
    "Carrot": {
       0: {
            mainAngle: Math.PI/4,
            renderSize: 2.5
       }
    },
    "Shattered Relic of Wrath": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Reinforced Relic of Wrath": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Subset Relic of the Guardian": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Division Relic of the Guardian": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Guard Relic of the Guardian": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Knight Relic of the Guardian": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Aid Relic of Serenity": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Subliminal Relic of Serenity": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    },
    "Barrier Relic of Serenity": {
       0: {
            customName: "Relic",
            renderSize: 2.5
       }
    }
}

let enemyOverrides = {
    Centipede: {
        customRender: () => {
            enemyRenderMap.Centipede({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true,
                isHead: true
            })
            ctx.translate(-50, 0)
            enemyRenderMap.Centipede({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true
            })
            ctx.translate(50, 0)
        },
        renderSize: 0.825
    },
    "Evil Centipede": {
        customRender: () => {
            enemyRenderMap["Evil Centipede"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true,
                isHead: true
            })
            ctx.translate(-50, 0)
            enemyRenderMap["Evil Centipede"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true
            })
            ctx.translate(50, 0)
        },
        renderSize: 0.825
    },
    "Desert Centipede": {
        customRender: () => {
            enemyRenderMap["Desert Centipede"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true,
                isHead: true
            })
            ctx.translate(-50, 0)
            enemyRenderMap["Desert Centipede"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true
            })
            ctx.translate(50, 0)
        },
        renderSize: 0.825
    },
    "Evil Desert Centipede": {
        customRender: () => {
            enemyRenderMap["Evil Desert Centipede"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true,
                isHead: true
            })
            ctx.translate(-50, 0)
            enemyRenderMap["Evil Desert Centipede"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 25,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0,
                isInEnemyBox: true
            })
            ctx.translate(50, 0)
        },
        renderSize: 0.825
    },
    DandelionMissile: {
        renderSize: 0.825
    },
    Dandelion: {
        customRender: () => {
            for (let i = 0, n = 10; i < n; i++) {
                ctx.rotate(i * Math.PI * 2 / n)
                ctx.translate(45, 0)
                enemyRenderMap.DandelionMissile({
                    render: {
                        radius: 10,
                        angle: 0,
                        time: 5000000,
                        lastX: -100,
                        lastY: -100,
                        x: 100,
                        y: 100
                    },
                    radius: 1,
                    lastTicksSinceLastDamaged: 1000,
                    ticksSinceLastDamaged: 1000,
                    rarity: 0
                })
                ctx.translate(-45, 0)
                ctx.rotate(-i * Math.PI * 2 / n)
            }

            enemyRenderMap.Dandelion({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 1,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0
            })
        },
        renderSize: 0.75
    },
    "Ant Burrow": {
        renderSize: 1.5
    },
    "Shiny Ant Burrow": {
        renderSize: 1.325
    },
    "Fire Ant Burrow": {
        renderSize: 1.325
    },
    "Sea Floor Burrow": {
        renderSize: 1.5
    },
    Spider: {
        renderSize: 0.625
    },
    Tarantula: {
        renderSize: 0.625
    },
    Leech: {
        angle: Math.PI * 2,
        renderSize: 1.25
    },
    "Dark Electric Eel": {
        angle: Math.PI * 2,
        renderSize: 1.25
    },
    "Electric Eel": {
        angle: Math.PI * 2,
        renderSize: 1.25
    },
    "1v1text": {
        angle: Math.PI
    },
    "Agar.io Cell": {
        angle: Math.PI
    },
    Sandstorm: {
        renderSize: 1.25
    },
    Hornet: {
        renderSize: 1.325
    },
    Root: {
        renderSize: 1.3,
    },
    "Worker Ant": {
        renderSize: 0.625
    },
    "Soldier Ant": {
        renderSize: 0.625
    },
    "Baby Ant": {
        renderSize: 0.625
    },
    "Soldier Fire Ant": {
        renderSize: 0.625
    },
    "Baby Fire Ant": {
        renderSize: 0.625
    },
    "Worker Fire Ant": {
        renderSize: 0.625
    },
    "Soldier Termite": {
        renderSize: 0.625
    },
    "Baby Termite": {
        renderSize: 0.625
    },
    "Worker Termite": {
        renderSize: 0.625
    },
    "Termite Mound": {
        renderSize: 1.5
    },
    "Soldier Shiny Ant": {
        renderSize: 0.625
    },
    Rock: {
        renderSize: 1.125
    },
    Sandstone: {
        renderSize: 1.125
    },
    Soil: {
        renderSize: 0.75
    },
    "Dark Beetle": {
        customRender: () => {
            ctx.translate(-7.5, 0)
            enemyRenderMap["Dark Beetle"]({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 1,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0
            })
            ctx.translate(7.5, 0)
        },
    },
    Beetle: {
        customRender: () => {
            ctx.translate(-7.5, 0)
            enemyRenderMap.Beetle({
                render: {
                    radius: 25,
                    angle: 0,
                    time: 5000000,
                    lastX: -100,
                    lastY: -100,
                    x: 100,
                    y: 100
                },
                radius: 1,
                lastTicksSinceLastDamaged: 1000,
                ticksSinceLastDamaged: 1000,
                rarity: 0
            })
            ctx.translate(7.5, 0)
        },
    },
    Scorpion: {
        renderSize: 1.125
    },
    Cactus: {
        renderSize: 1.25
    },
    "Sunlit Frog": {
        renderSize: 0.75
    },
    "Moonlit Frog": {
        renderSize: 0.75
    },
    "Ruby Frog": {
        renderSize: 0.75
    },
    "Poison Dart Frog": {
        renderSize: 0.75
    },
    Locust: {
        renderSize: 1.25
    },
    Starfish: {
        renderSize: 0.75
    },
    Shell: {
        renderSize: 1.25
    },
    Sponge: {
        renderSize: 1.25
    },
    Crab: {
        renderSize: 0.8
    },
    Coral: {
        renderSize: 1.25,
        angle: Math.PI * 2
    }
}

function clonePC(pc, paramsToAssign = undefined) {
    if (paramsToAssign !== undefined) {
        for (let key in paramsToAssign) {
            pc[key] = paramsToAssign[key];
        }
    }
    return new PetalContainer(pc.petals.map(p => new Petal(p)), { ...pc }, pc.id, pc.amount, pc.attempt);
}

function cloneEnemyPC(pc, paramsToAssign = undefined) {
    if (paramsToAssign !== undefined) {
        for (let key in paramsToAssign) {
            pc[key] = paramsToAssign[key];
        }
    }
    return new PetalContainer(pc.petals.map(p => new Enemy(p)), { ...pc }, pc.id, pc.amount, pc.attempt);
}

function setPcIndexes(type) {
    if (!Stats.petals[type] && currentBiome !== '1v1') window.calculateStats()
    if (!pvpStats.petals[type] && currentBiome === '1v1') if (petalRenderMap[type]) {
        window.calculateStats(true)
    }
    petalImageMap[type] = []
    let index = 0;
    let maxCount = 1;
    let maxOverrideRarity = petalOverrides[type];
    for (let i = 0; i < Stats.rarities.length; i++) {
        let data = {};
        let change = false;
        if (petalOverrides[type]) {
            for (let rarity in (petalOverrides[type])) {
                rarity = Number(rarity)

                if (i == rarity) {
                    maxOverrideRarity = i
                    data.override = petalOverrides[type][i]
                    change = true;
                } else if (i >= maxOverrideRarity) {
                    data.override = petalOverrides[type][maxOverrideRarity]
                }
            }
        }

        const stats = (currentBiome === '1v1' && petalRenderMap[type]) ? pvpStats.petals[type][i].petalLayout : Stats.petals[type][i].petalLayout;
        let count = 1

        if (stats[0].length !== 1) {
            count = stats[0].length
        } else {
            count = stats.length
        }

        if (count !== maxCount) {
            maxCount = count
            change = true;
        }

        data.count = count
        if (change === true) index++
        petalImageMap[type][i] = { index, data }
    }
}