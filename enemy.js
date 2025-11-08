const enemyInterpolateKeys = ['x', 'y', 'radius', 'hp', 'beforeStreakHp'];
const enemyInterpolateMagnitudes = [0.072, 0.072, 0.4, 0.22, 0.22];
// if we ever need a circle that encapsulates all of the enemy, this is where to get it (* radius). Default 1 for obvious reasons
// TODO: culling (this is still in use btw because of enemyBoxes)
const enemyCullingMults = {
	Spider: 1.5,
	Tarantula: 1.5,
	Hornet: 1.2,
	Rock: 1.1,
	Sandstone: 1.1,
	"Rock Tank": 1.5,
	"RockMissile": 1.1,
	"BigRockMissile": 1.1,
	Ladybug: 1.05,
	"Dark Ladybug": 1.05,
	Centipede: 1.12,
	"Evil Centipede": 1.12,
	"Desert Centipede": 1.12,
	"Evil Desert Centipede": 1.12,
}
// enemy boxes (some enemies are drawn smaller than a perfect circle that encapsulates it)
const enemyBoxSizeMults = {
	"Moonlit Frog": 2,
	"Sunlit Frog": 2,
	"Ruby Frog": 2,
	Spider: 2.3,
	Tarantula: 2.3,
	Hornet: 1.2,
	"Tree": 1.5,
	"Root": 1.5,
	Rock: 1.3,
	Sandstone: 1.3,
	Coral: 1.3,
	"Soil": 1.5,
	"Rock Tank": 1,
	Ladybug: 1.5,
	"Dark Ladybug": 1.5,
	"Shiny Ladybug": 1.5,
	"Ocean Ladybug": 1.5,
	Centipede: 1.7,
	"Evil Centipede": 1.7,
	"Desert Centipede": 1.7,
	"Evil Desert Centipede": 1.7,
	Bee: 1.35,
	Square: 1.5,
	Dandelion: 1.5,
	"Baby Ant": 1.85,
	"Worker Ant": 1.85,
	"Soldier Ant": 1.85,
	"Soldier Fire Ant": 1.85,
	"Soldier Shiny Ant": 1.85,
	"Beetle": 1.5,
	"Dark Beetle": 1.5,
	"Grasshopper": 1.5,
	"Stickbug": 1.5,
	"Scorpion": 1.2,
	"Cactus": 1.2,
	"Queen Ant": 2.32 * .6,
	"Queen Fire Ant": 2.32 * .6,
	"Queen Shiny Ant": 2.32 * .6,
	"Starfish": 1.5,
	"Crab": 1.7,
	"Bubble": 1.2,
	"Jellyfish": 1.2,
	"Shell": 1.1,
	"Sea Urchin": 1.3,
	'Invincible Urchin': 1.3
}
const enemyBoxOffsets = {
	"Queen Ant": {
		x: -0.15,
		y: -0.15
	},
	"Queen Fire Ant": {
		x: -0.15,
		y: -0.15
	},
	"Queen Shiny Ant": {
		x: -0.15,
		y: -0.15
	},
	"Queen Termite": {
		x: -0.15,
		y: -0.15
	}

}
const noRenderingUi = ["Invincible Urchin"];
const enemyPackKeys = ['id', 'x', 'y', /*'xv', 'yv', 'hp', 'radius',*/ 'angle'];

class Enemy {
	constructor(init) {
		if (enemyRenderMap[init.type] === undefined && editorEnemyShapesMap[init.type] !== undefined) {
			return new Enemy({
				...init,
				type: "Custom",
				customType: init.type
			});
		}
		this.beforeStreakHp = init.maxHp; // if flowers hit the enemy over and over again, we want to be able to render the red in the hp bar. This is the damage stored before the enemy gets a "streak" of hits dealt to it
		this.ticksSinceLastDamaged = 1001; // set to 0 when damaged. 


		this.damageCount = 0;
		this.damageCountCooldown = 0;

		this.type = init.type;
		this.rarity = init.rarity;

		for (let key in init) {
			this[key] = init[key];
		}

		this.toRenderUi = init.toRenderUi ?? !(noRenderingUi.includes(this.type) || this.type.includes("Missile"));

		this.radius = init.radius;
		this.baseRadius = init.radius;

		if (enemyDataMap[this.type] !== undefined) {
			this.data = enemyDataMap[this.type](this);
		}

		this.dead = false;
		this.deadAnimationTimer = 0;

		this.xv = 0;
		this.yv = 0;

		this.team = init.team;

		this.render = {};
		for (let i = 0; i < enemyInterpolateKeys.length; i++) {
			this.render[enemyInterpolateKeys[i]] = this[enemyInterpolateKeys[i]];
		}
		this.render.angle = this.angle;
		this.render.radius = 0;
		if ([
			'Tarantula', 
			'Spider', 
			'Worker Ant', 
			'Soldier Ant', 
			"Soldier Fire Ant", 
			'Beetle', 
			"Dark Beetle",
			'Scorpion', 
			"Grasshopper",
			"Stickbug",
			'Locust', 
			'Queen Ant', 
			'Queen Shiny Ant', 
			'Queen Fire Ant', 
			'Desert Moth', 
			'Swampy Moth', 
			'Fly', 
			'Firefly',
			'Starfish', 
			'Crab', 
			'Baby Ant', 
			'Worker Fire Ant', 
			'Baby Fire Ant', 
			"Soldier Shiny Ant",
			"Soldier Termite",
			"Baby Termite",
			"Worker Termite",
			"Queen Termite"
		].includes(this.type)) {
			this.render.lastX = this.render.x;
			this.render.lastY = this.render.y;
			this.render.time = 0;
		}
		if (['Jellyfish', 'Sea Urchin', 'Invincible Urchin'].includes(this.type)) {
			this.render.time = 0;
		}

		if (this.type === 'Locust') {
			this.createdTime = performance.now();
			this.locustLastMoveTime = 0;
		}

		this.isHovered = false;
		this.statsBoxAlpha = 0;
		this.statsBox = null;
	}
	update(data, startInd) {
		if (this.type === 'Locust' && performance.now() - this.createdTime > 200 /*to prevent initial spawning displacement*/ ) {
			// x and y
			this.xv = (data[startInd + 1] - this.x) / 10;
			this.yv = (data[startInd + 2] - this.y) / 10;
			if (Math.sqrt(this.xv ** 2 + this.yv ** 2) > 0.1) {
				this.locustLastMoveTime = performance.now();
			}
		}
		for (let i = startInd; i < enemyPackKeys.length + startInd; i++) {
			this[enemyPackKeys[i - startInd]] = data[i];
		}
		return startInd + enemyPackKeys.length;
		// let toInferAngle = Math.abs(this.xv) < .1 && Math.abs(this.yv) < .1;
		// if(toInferAngle === true && pack.x !== undefined && pack.y !== undefined){
		// 	// if(this.hasInitAngle !== true){
		// 	// 	this.hasInitAngle = true;
		// 	// 	this.angle = Math.atan2(pack.y - this.y, pack.x - this.x);
		// 	// } else {
		// 		this.angle = interpolateDirection(this.angle, Math.atan2(pack.y - this.y, pack.x - this.x), 0.2);
		// 	// }
		// }
		// if(pack.dead !== undefined){
		// 	console.log('die');
		// }
		// if (pack.hp !== undefined && pack.hp < this.hp) {
		// 	this.updateRenderDamage(pack.hp);
		// }
		// //temp before Serum fixes
		// for (let key in pack) {
		// 	this[key] = pack[key];
		// }

		// if(toInferAngle === false){
		// 	this.angle = Math.atan2(this.yv, this.xv);
		// }
		// this.render.x = this.x//pack.x;
		// this.render.y = this.y//pack.y;
		// this.render.radius = this.radius;
	}
	updateInterpolate() {
		for (let i = 0; i < enemyInterpolateKeys.length; i++) {
			this.render[enemyInterpolateKeys[i]] = interpolate(this.render[enemyInterpolateKeys[i]], this[enemyInterpolateKeys[i]], enemyInterpolateMagnitudes[i] * dt / 16.66);
		}
		this.render.angle = interpolateDirection(this.render.angle, this.angle, 0.12); // this should probably be a lot higher than 0.08, test it out to look the same as florr once we get random move and turn motion working
		if (this.render.radius < .01) {
			this.render.radius = .01;
		}
	}
	updateRenderDamage(damage) {
		this.ticksSinceLastDamaged = 0;
		this.lastTicksSinceLastDamaged = 0;
		this.previousTakenDamage = damage;
	}
	drawStatsBox(drawBelow = false, rarityOverride=false) {
		if (window.statBoxes === false) {
			return;
		}
		if (this.isHovered === true) {
			if (this.statsBox === null && window.enemyStats[this.customType ?? this.type] !== undefined) {
				const last = {
					rarity: this.rarity,
					x: this.x,
					y: this.y,
					radius: this.radius,
					render: {
						x: this.render.x,
						y: this.render.y,
						radius: this.render.radius
					}
				};
				this.x = this.render.x = this.y = this.render.y = 0;
				this.radius = this.render.radius = 17;

				const rarity = this.rarity = rarityOverride ? this.rarity : Math.max(3, Math.min(12, Math.floor(Math.random() * (maxRarityObtained+1.99))));
				const stats = window.structuredClone(window.enemyStats[this.customType ?? this.type]); // {health, damage, mass, speed}
				const scalars = enemyRarityScalars[rarity];

				stats.xp = scalars.xp;
				stats.health *= scalars.health;
				if (this.type == "Starfish") {
					stats.healing = Math.round(stats.health * 0.007 * 30 * 100) / 100 + "/s"
				}

				stats.damage *= scalars.damage;
				if (stats.detectionDistance){
					stats.detectionDistance *= scalars.detectionDistance;
				}
				stats.mass *= scalars.mass;
				this.statsBox = generateStatsBox(new PetalContainer([this], {
					x: 0,
					y: 0,
					w: 50,
					h: 50,
					toOscillate: false,
					amount: 1,
					petalStats: stats
				}, Math.random(), 1, 0), false, {
					x: 0,
					y: 0
				})
				this.statsBox.pc.amount = 1;
				this.x = last.x;
				this.render.x = last.render.x;
				this.y = last.y;
				this.render.y = last.render.y;
				this.radius = last.radius;
				this.render.radius = last.render.radius;
				this.rarity = last.rarity;
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
		if (this.statsBoxAlpha !== 0 && this.statsBox !== null) {
			this.statsBox.x = this.render.x - this.statsBox.w / 2
			this.statsBox.y = drawBelow ?
				this.render.y + this.radius / 2 + 11.5 :
				this.render.y - this.statsBox.h - this.radius - 11.5;
			if (drawBelow === false && this.statsBox.y < 0) {
				this.drawStatsBox(true);
				return;
			}
			ctx.globalAlpha = this.statsBoxAlpha;
			this.statsBox.draw();
			ctx.globalAlpha = 1;
		}
		this.isHovered = false;
	}
	draw() {
		this.updateInterpolate();

		if (this.isInEnemyBox === undefined && toRender({
				x: this.render.x,
				y: this.render.y,
				radius: this.render.radius * 4 /*for hp bar*/
			}, window.camera) === false && this.toRenderUi === true) {
			if (this.dead === true) {
				this.deadAnimationTimer += dt;
			}
			return;
		}

		// const hashDistance = 500;
		// ctx.globalAlpha = 0.5;
		// if(this.hashData !== undefined){
		//     // console.log(this.hashData);
		//     for(let x = this.hashData.top.x; x <= this.hashData.bottom.x; x++){
		//         for(let y = this.hashData.top.y; y <= this.hashData.bottom.y; y++){
		//             ctx.fillStyle = 'blue';
		//             ctx.beginPath();
		//             ctx.arc(x*hashDistance-4000,y*hashDistance-4000,8,0,Math.PI * 2);
		//             ctx.fill();
		//             ctx.closePath();
		//             ctx.globalAlpha = 0.1;
		//             ctx.fillRect(x*hashDistance-4000,y*hashDistance-4000,hashDistance,hashDistance);
		//             ctx.globalAlpha = 0.5;
		//         }
		//     }
		// }
		// ctx.globalAlpha = 1;

		this.lastTicksSinceLastDamaged = this.ticksSinceLastDamaged;
		if (this.ticksSinceLastDamaged == 0) {
			if (this.resetDamageCount) {
				this.damageCount = 0;
				this.resetDamageCount = false;
			}
			this.damageCount += this.previousTakenDamage;
			this.damageCountCooldown = 240;
		}
		if (this.damageCountCooldown < 0) {
			this.resetDamageCount = true;
		}
		this.damageCountCooldown -= dt;


		this.ticksSinceLastDamaged += dt;
		if (this.ticksSinceLastDamaged > 166) {
			this.beforeStreakHp = this.hp;
		}
		// we shouldn't need this because we wont be modifying this.render during the drawing? Idk js gc gives me nightmares
		// let translateX = this.render.x;
		// let translateY = this.render.y;
		ctx.translate(this.render.x, this.render.y);
		if (this.dead === true) {
			var scalar = 1 + smoothstep(Math.log10(this.deadAnimationTimer * 0.0432 + 1)) * 0.6;
			this.deadAnimationTimer += dt;
			ctx.scale(scalar, scalar);
			ctx.globalAlpha = smoothstep(Math.max(0, 1 - Math.cbrt(this.deadAnimationTimer * 0.0048)));
			if (this.type === 'Custom') {
				window.alphaMult = ctx.globalAlpha;
			}
		}

		let oldAlpha;
		if (this.opacityMultiplier != undefined){
			if (this.opacityMultiplier != 1){
				oldAlpha = ctx.globalAlpha;
				if (isNaN(oldAlpha)) oldAlpha = 1;
				ctx.globalAlpha = oldAlpha * this.opacityMultiplier
			}
		}
		// fade in animation stuff happens here
		if (enemyRenderMap[this.type]) {
			if (this.renderAsPlastic) {
				if (this.isShinyPlastic == undefined || this.isShinyPlastic == null) {
					this.isShinyPlastic = false;
					if (Math.random() < 0.01) {
						this.isShinyPlastic = true;
					}
				}
				if (this.isShinyPlastic == true) {
					enemyRenderMap["Shiny Plastic"](this);
				} else {
					enemyRenderMap["Plastic"](this);
				}
			}
			else{
				enemyRenderMap[this.type](this);
			}
		} else {
			enemyRenderMap.default(this);
		}
		if (this.toRenderUi === true && (this.rarity > 3 || this.team == "flower")) {
			let render = true;
			if (this.type == "Leech" && !this.isHead){
				render = false;
			}
			if (this.type == "Electric Eel" && !this.isHead){
				render = false;
			}
			if (this.type == "Dark Electric Eel" && !this.isHead){
				render = false;
			}
			if (this.type == "BudLeech" && !this.isHead){
				render = false;
			}
			
			if (render){
				enemyRenderMapText(this);
			}
		}

		if (oldAlpha){
			ctx.globalAlpha = oldAlpha;
		}

		if (this.dead === true) {
			ctx.scale(1 / scalar, 1 / scalar);
			ctx.globalAlpha = 1;
			if (this.type === 'Custom') {
				delete window.alphaMult;
			}
		}
		ctx.translate(-this.render.x, -this.render.y);
	}
	// basically predicting what'll happen on server side. This isn't correct but it'll work for now. Also x and y should always be sent if movement changes (if xv/yv != 0) so it wont desync
	// simulate(room) {
	// 	if (this.dead === true) {
	// 		return;
	// 	}

	// 	this.x += this.xv;
	// 	this.y += this.yv;
	// }
}

// client sided data for rendering enemies. For example, ladybugs have spots and rocks have bumps
// these are not the same for every client.
const enemyDataMap = {
	Ladybug: (e) => {
		if(window.isEditor === true){
			const data = [];
			for(let i = 0; i < 9; i++){
				data[i] = Math.random();
			}
			return data;
		}
		let data = [];
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
				data[i] = Math.random() * 0.9
				if (Math.round(Math.random()) === 1) { data[i + 1] = Math.random() * 0.9 } else { data[i + 1] = 0 - Math.random() * 0.9 }
				data[i + 2] = (Math.random() * e.rarity) / 5;
		}
		return data;
	},
	"Moonlit Frog": (e) => {
		return Math.floor(Math.random() * 100)
	},
	"Sunlit Frog": (e) => {
		return Math.floor(Math.random() * 100)
	},
	"Ruby Frog": (e) => {
		return Math.floor(Math.random() * 100)
	},
	"Poison Dart Frog": (e) => {
		let data = [];
		for (let i = 0; i < 15; i += 3) {
				data[i] = Math.random() * 0.9
				if (Math.round(Math.random()) === 1) { data[i + 1] = Math.random() * 0.9 } else { data[i + 1] = 0 - Math.random() * 0.9 }
				data[i + 2] = Math.random();
		}
		return [ 
			Math.floor(Math.random() * 100), // tongue
			["#2f3fce", "#ffeb0c", "#fe9509"][Math.random() * 3 | 0], // body colors
			data // spots
		]
	},
	"Dark Ladybug": (e) => {
		if(window.isEditor === true){
			const data = [];
			for(let i = 0; i < 9; i++){
				data[i] = Math.random();
			}
			return data;
		}
		let data = [];
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
				data[i] = Math.random() * 0.9
				if (Math.round(Math.random()) === 1) { data[i + 1] = Math.random() * 0.9 } else { data[i + 1] = 0 - Math.random() * 0.9 }
				data[i + 2] = (Math.random() * e.rarity) / 5;
		}
		return data;
	},
	"Shiny Ladybug": (e) => {
		if(window.isEditor === true){
			const data = [];
			for(let i = 0; i < 9; i++){
				data[i] = Math.random();
			}
			return data;
		}
		let data = [];
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
				data[i] = Math.random() * 0.9
				if (Math.round(Math.random()) === 1) { data[i + 1] = Math.random() * 0.9 } else { data[i + 1] = 0 - Math.random() * 0.9 }
				data[i + 2] = (Math.random() * e.rarity) / 5;
		}
		return data;
	},
	"Ocean Ladybug": (e) => {
		if(window.isEditor === true){
			const data = [];
			for(let i = 0; i < 9; i++){
				data[i] = Math.random();
			}
			return data;
		}
		let data = [];
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
				data[i] = Math.random() * 0.9
				if (Math.round(Math.random()) === 1) { data[i + 1] = Math.random() * 0.9 } else { data[i + 1] = 0 - Math.random() * 0.9 }
				data[i + 2] = (Math.random() * e.rarity) / 5;
		}
		return data;
	},
	
	Cactus: (e) => {
		const segments = Math.max(10, Math.ceil(e.radius * Math.PI * 2 / 48));
		return [Math.ceil(Math.PI * 2 / segments * 10000) / 10000, Math.PI * Math.random() * 2, Math.random() < 0.001 ? true : false];
	},
	Sponge: (e) => {
		return [Math.floor(Math.random() * 3.00001), Math.PI * Math.random() * 2]
	},
	Plastic: (e) => {
		return [Math.PI * Math.random() * 2]
	},
	"Shiny Plastic": (e) => {
		return [Math.PI * Math.random() * 2]
	},
	
	Starfish: (e) => {
		return [[1, 1, 1, 1, 1]]
	},
	Rock: (e) => {
		// let pointCount = Math.floor(Math.log(e.radius)*2);
		// let points = [];
		// for(let i = 0; i < pointCount; i++){
		// 	let intendedAngle = i/pointCount * Math.PI * 2;
		// 	let actualAngle = intendedAngle + (Math.random()-0.5) * i/pointCount * Math.PI * 0.3;
		// 	let actualRadius = (1.04-Math.random()*0.08);

		// 	points.push([actualAngle, actualRadius]);
		// }
		// return points;
		const verticies = [];

		// i is the angle in radians
		let inc = (Math.PI * 2) / Math.ceil( /*Math.sqrt(e.radius)*/ Math.log(e.radius) * 2 + 2 + Math.random() * 2);
		let offset = (e.radius + Math.random() * 3 - 1) / 5;
		if (e.rarity >= 6) { // ultra or super
			offset += 20;
		} // else if(e.rarity === 0){
		//     offset = 0;
		// }
		const angleOffset = Math.random() * Math.PI * 2;
		for (let i = angleOffset; i < Math.PI * 2 + angleOffset; i += inc) {
			// generate a point randomly offset
			verticies.push({
				x: Math.cos(i),
				y: Math.sin(i),
				randX: Math.random() * offset / e.radius,
				randY: Math.random() * offset / e.radius,
			})
		}

		e.maxVertexOffset = offset;

		// sometimes we're offset from the circle. We want to offset the position to make sure we're centered
		e.averageX = 0;
		e.averageY = 0;
		for (let i = 0; i < verticies.length; i++) {
			e.averageX += verticies[i].randX;
			e.averageY += verticies[i].randY;
		}
		e.averageX /= verticies.length;
		e.averageY /= verticies.length;

		for (let i = 0; i < verticies.length; i++) {
			verticies[i].randX -= e.averageX;
			verticies[i].randY -= e.averageY;
		}

		e.getVertexX = (i) => {
			return e.data[i].x * e.render.radius + e.data[i].randX * e.radius;
		}
		e.getVertexY = (i) => {
			return e.data[i].y * e.render.radius + e.data[i].randY * e.radius;
		}

		return verticies;
	},
	Coral: (e) => {
		return 4 + (Math.random() * 4 | 0)
	},
	Sandstone: (e) => {
		// let pointCount = Math.floor(Math.log(e.radius)*2);
		// let points = [];
		// for(let i = 0; i < pointCount; i++){
		// 	let intendedAngle = i/pointCount * Math.PI * 2;
		// 	let actualAngle = intendedAngle + (Math.random()-0.5) * i/pointCount * Math.PI * 0.3;
		// 	let actualRadius = (1.04-Math.random()*0.08);

		// 	points.push([actualAngle, actualRadius]);
		// }
		// return points;
		const verticies = [];

		// i is the angle in radians
		let inc = (Math.PI * 2) / Math.ceil( /*Math.sqrt(e.radius)*/ Math.log(e.radius) * 2 + 2 + Math.random() * 2);
		let offset = (e.radius + Math.random() * 3 - 1) / 5;
		if (e.rarity >= 6) { // ultra or super
			offset += 20;
		} // else if(e.rarity === 0){
		//     offset = 0;
		// }
		const angleOffset = Math.random() * Math.PI * 2;
		for (let i = angleOffset; i < Math.PI * 2 + angleOffset; i += inc) {
			// generate a point randomly offset
			verticies.push({
				x: Math.cos(i),
				y: Math.sin(i),
				randX: Math.random() * offset / e.radius,
				randY: Math.random() * offset / e.radius,
			})
		}

		e.maxVertexOffset = offset;

		// sometimes we're offset from the circle. We want to offset the position to make sure we're centered
		e.averageX = 0;
		e.averageY = 0;
		for (let i = 0; i < verticies.length; i++) {
			e.averageX += verticies[i].randX;
			e.averageY += verticies[i].randY;
		}
		e.averageX /= verticies.length;
		e.averageY /= verticies.length;

		for (let i = 0; i < verticies.length; i++) {
			verticies[i].randX -= e.averageX;
			verticies[i].randY -= e.averageY;
		}

		e.getVertexX = (i) => {
			return e.data[i].x * e.render.radius + e.data[i].randX * e.radius;
		}
		e.getVertexY = (i) => {
			return e.data[i].y * e.render.radius + e.data[i].randY * e.radius;
		}

		return verticies;
	},
	"Rock Tank": (e) => {
		// let pointCount = Math.floor(Math.log(e.radius)*2);
		// let points = [];
		// for(let i = 0; i < pointCount; i++){
		// 	let intendedAngle = i/pointCount * Math.PI * 2;
		// 	let actualAngle = intendedAngle + (Math.random()-0.5) * i/pointCount * Math.PI * 0.3;
		// 	let actualRadius = (1.04-Math.random()*0.08);

		// 	points.push([actualAngle, actualRadius]);
		// }
		// return points;
		const verticies = [];

		// i is the angle in radians
		let inc = (Math.PI * 2) / Math.ceil( /*Math.sqrt(e.radius)*/ Math.log(e.radius) * 2 + 2 + Math.random() * 2);
		let offset = (e.radius + Math.random() * 3 - 1) / 5;
		if (e.rarity >= 6) { // ultra or super
			offset += 20;
		} // else if(e.rarity === 0){
		//     offset = 0;
		// }
		const angleOffset = Math.random() * Math.PI * 2;
		for (let i = angleOffset; i < Math.PI * 2 + angleOffset; i += inc) {
			// generate a point randomly offset
			verticies.push({
				x: Math.cos(i),
				y: Math.sin(i),
				randX: Math.random() * offset / e.radius,
				randY: Math.random() * offset / e.radius,
			})
		}

		e.maxVertexOffset = offset;

		// sometimes we're offset from the circle. We want to offset the position to make sure we're centered
		e.averageX = 0;
		e.averageY = 0;
		for (let i = 0; i < verticies.length; i++) {
			e.averageX += verticies[i].randX;
			e.averageY += verticies[i].randY;
		}
		e.averageX /= verticies.length;
		e.averageY /= verticies.length;

		for (let i = 0; i < verticies.length; i++) {
			verticies[i].randX -= e.averageX;
			verticies[i].randY -= e.averageY;
		}

		e.getVertexX = (i) => {
			return e.data[i].x * e.render.radius + e.data[i].randX * e.radius;
		}
		e.getVertexY = (i) => {
			return e.data[i].y * e.render.radius + e.data[i].randY * e.radius;
		}

		return verticies;
	},
	"RockMissile": (e) => {
		// let pointCount = Math.floor(Math.log(e.radius)*2);
		// let points = [];
		// for(let i = 0; i < pointCount; i++){
		// 	let intendedAngle = i/pointCount * Math.PI * 2;
		// 	let actualAngle = intendedAngle + (Math.random()-0.5) * i/pointCount * Math.PI * 0.3;
		// 	let actualRadius = (1.04-Math.random()*0.08);

		// 	points.push([actualAngle, actualRadius]);
		// }
		// return points;
		const verticies = [];

		// i is the angle in radians
		let inc = (Math.PI * 2) / Math.ceil( /*Math.sqrt(e.radius)*/ Math.log(e.radius) * 2 + 2 + Math.random() * 2);
		let offset = (e.radius + Math.random() * 3 - 1) / 5;
		if (e.rarity >= 6) { // ultra or super
			offset += 20;
		} // else if(e.rarity === 0){
		//     offset = 0;
		// }
		const angleOffset = Math.random() * Math.PI * 2;
		for (let i = angleOffset; i < Math.PI * 2 + angleOffset; i += inc) {
			// generate a point randomly offset
			verticies.push({
				x: Math.cos(i),
				y: Math.sin(i),
				randX: Math.random() * offset / e.radius,
				randY: Math.random() * offset / e.radius,
			})
		}

		e.maxVertexOffset = offset;

		// sometimes we're offset from the circle. We want to offset the position to make sure we're centered
		e.averageX = 0;
		e.averageY = 0;
		for (let i = 0; i < verticies.length; i++) {
			e.averageX += verticies[i].randX;
			e.averageY += verticies[i].randY;
		}
		e.averageX /= verticies.length;
		e.averageY /= verticies.length;

		for (let i = 0; i < verticies.length; i++) {
			verticies[i].randX -= e.averageX;
			verticies[i].randY -= e.averageY;
		}

		e.getVertexX = (i) => {
			return e.data[i].x * e.render.radius + e.data[i].randX * e.radius;
		}
		e.getVertexY = (i) => {
			return e.data[i].y * e.render.radius + e.data[i].randY * e.radius;
		}

		return verticies;
	},
	"BigRockMissile": (e) => {
		// let pointCount = Math.floor(Math.log(e.radius)*2);
		// let points = [];
		// for(let i = 0; i < pointCount; i++){
		// 	let intendedAngle = i/pointCount * Math.PI * 2;
		// 	let actualAngle = intendedAngle + (Math.random()-0.5) * i/pointCount * Math.PI * 0.3;
		// 	let actualRadius = (1.04-Math.random()*0.08);

		// 	points.push([actualAngle, actualRadius]);
		// }
		// return points;
		const verticies = [];

		// i is the angle in radians
		let inc = (Math.PI * 2) / Math.ceil( /*Math.sqrt(e.radius)*/ Math.log(e.radius) * 2 + 2 + Math.random() * 2);
		let offset = (e.radius + Math.random() * 3 - 1) / 5;
		if (e.rarity >= 6) { // ultra or super
			offset += 20;
		} // else if(e.rarity === 0){
		//     offset = 0;
		// }
		const angleOffset = Math.random() * Math.PI * 2;
		for (let i = angleOffset; i < Math.PI * 2 + angleOffset; i += inc) {
			// generate a point randomly offset
			verticies.push({
				x: Math.cos(i),
				y: Math.sin(i),
				randX: Math.random() * offset / e.radius,
				randY: Math.random() * offset / e.radius,
			})
		}

		e.maxVertexOffset = offset;

		// sometimes we're offset from the circle. We want to offset the position to make sure we're centered
		e.averageX = 0;
		e.averageY = 0;
		for (let i = 0; i < verticies.length; i++) {
			e.averageX += verticies[i].randX;
			e.averageY += verticies[i].randY;
		}
		e.averageX /= verticies.length;
		e.averageY /= verticies.length;

		for (let i = 0; i < verticies.length; i++) {
			verticies[i].randX -= e.averageX;
			verticies[i].randY -= e.averageY;
		}

		e.getVertexX = (i) => {
			return e.data[i].x * e.render.radius + e.data[i].randX * e.radius;
		}
		e.getVertexY = (i) => {
			return e.data[i].y * e.render.radius + e.data[i].randY * e.radius;
		}

		return verticies;
	},
	"Agar.io Cell": (e) => {
		// let pointCount = Math.floor(Math.log(e.radius)*2);
		// let points = [];
		// for(let i = 0; i < pointCount; i++){
		// 	let intendedAngle = i/pointCount * Math.PI * 2;
		// 	let actualAngle = intendedAngle + (Math.random()-0.5) * i/pointCount * Math.PI * 0.3;
		// 	let actualRadius = (1.04-Math.random()*0.08);
		// 	points.push([actualAngle, actualRadius]);
		// }
		// return points;
		e.offsets = [];
		e.velocities = [];
		for(let i = 0; i < 46; i++){
			e.offsets[i] = ((Math.random()-0.5) * 2) * 3;
			e.velocities[i] = ((Math.random()-0.5) * 2) / 3.56;
		}
		function randomColor() {
			var letters = '0123456789ABCDEF';
			var color = '#';
			for (var i = 0; i < 6; i++) {
			  color += letters[Math.floor(Math.random() * 16)];
			}
			return color;
		}
		e.col = randomColor();
		e.positions = new Array(46);
	},
	Lilypad: (e) => {
		return [ 1.5 + Math.random() * 0.325, Math.random() * Math.PI * 2]
	},
	"Flowering Lilypad": (e) => {
		return [ 1.5 + Math.random() * 0.325, Math.random() * Math.PI * 2]
	},
	"Shiny Lilypad": (e) => {
		return [ 1.5 + Math.random() * 0.325, Math.random() * Math.PI * 2]
	},
	"Coconut": (e) => {
		return Math.random() * Math.PI * 2
	},
	Tree: (e) => {
		return [ 
			Math.random() * -Math.PI, 
			0.4 + Math.random() * 0.4, 
			Math.random() * Math.PI, 
			0.4 + Math.random() * 0.4 
		]
	},
}

function blendAmount(e) {
	return Math.max(0, 1 - e.ticksSinceLastDamaged / 166.5);
}

function checkForFirstFrame(e) {
	return (e.lastTicksSinceLastDamaged < 13 && !damageFlash)
}

attemptDrawCache = function attemptDrawCache(e, angle, sz = 2) {
    if (e.cachedImage && !checkForFirstFrame(e) && blendAmount(e) <= 0) {
        ctx.rotate(angle);
        ctx.scale(Math.max(0.01, e.radius / e.cachedRadius), Math.max(0.01, e.radius / e.cachedRadius))
        ctx.drawImage(e.cachedImage, -sz * e.cachedRadius, -sz * e.cachedRadius);
        ctx.scale(1 / (Math.max(0.01, e.radius / e.cachedRadius)), 1 / (Math.max(0.01, e.radius / e.cachedRadius)))
        ctx.rotate(-angle);
        return true;
    }
    return false;
}

checkToCache = function checkToCache(e, sz = 2) {
    if (!e.cachedImage && e.render.radius == e.radius) { //worth caching!
        e.render.radius = e.radius;
        e.cachedRadius = e.radius;
        e.cachedImage = new OffscreenCanvas(Math.max(1, 2 * sz * e.render.radius), Math.max(1, 2 * sz * e.render.radius));
        let realctx = ctx;
        ctx = e.cachedImage.getContext("2d");
        ctx.lineCap = realctx.lineCap;
        ctx.lineJoin = realctx.lineJoin;
        ctx.translate(sz * e.render.radius, sz * e.render.radius);
        return realctx;
    }
    return null;
}

function finishCache(e, rctx, sz = 2){
	if(rctx){
		rctx.drawImage(e.cachedImage, -sz*e.render.radius, -sz*e.render.radius);
		ctx = rctx;
	}
}
let normalEnemyRenderMap = {
	Ladybug: (e) => {
		if(attemptDrawCache(e, e.render.angle + Math.PI)) return;

		let bodyColor = blendColor("#EB4034", "#FF0000", Math.max(0, blendAmount(e)));
		let headColor = blendColor("#111111", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			headColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle + Math.PI);
		let realctx = checkToCache(e);
		ctx.strokeStyle = blendColor(headColor, "#000000", 0.19);
		ctx.fillStyle = headColor;
		ctx.lineWidth = e.render.radius / 5; //7 * ((e.render.radius / 30) ** 0.9);

		// head (little black thing sticking out)
		ctx.beginPath();
		ctx.arc(-e.render.radius / 2, 0, e.render.radius / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.closePath();

		ctx.fill();
		ctx.save();
		ctx.clip();

		// ladybug spots
		ctx.fillStyle = headColor;
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
			ctx.beginPath();
			ctx.arc((-0.5 + e.data[i]) * e.render.radius / 30 * 35, (-0.5 + e.data[i + 1] * e.render.radius / 30 * 35), e.render.radius / 30 * (5 + e.data[i + 2] * 5), 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.stroke();
		ctx.closePath();

		finishCache(e, realctx);

		ctx.rotate(-e.render.angle - Math.PI);
	},
	"Dark Ladybug": (e) => {
		if(attemptDrawCache(e, e.render.angle + Math.PI)) return;

		let bodyColor = blendColor("#962921", "#FF0000", Math.max(0, blendAmount(e)));
		let dotColor = blendColor("#be342a", "#FF0000", Math.max(0, blendAmount(e)));
		let headColor = blendColor("#111111", "#FF0000", Math.max(0, blendAmount(e)));

		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			headColor = "#FFFFFF";
			dotColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle + Math.PI);
		let realctx = checkToCache(e);
		ctx.strokeStyle = blendColor(headColor, "#000000", 0.19);
		ctx.fillStyle = headColor;
		ctx.lineWidth = e.render.radius / 5; //7 * ((e.render.radius / 30) ** 0.9);

		// head (little black thing sticking out)
		ctx.beginPath();
		ctx.arc(-e.render.radius / 2, 0, e.render.radius / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.closePath();

		ctx.fill();
		ctx.save();
		ctx.clip();

		// ladybug spots
		ctx.fillStyle = dotColor;
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
			ctx.beginPath();
			ctx.arc((-0.5 + e.data[i]) * e.render.radius / 30 * 35, (-0.5 + e.data[i + 1] * e.render.radius / 30 * 35), e.render.radius / 30 * (5 + e.data[i + 2] * 5), 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.stroke();
		ctx.closePath();
		finishCache(e, realctx);
		ctx.rotate(-e.render.angle - Math.PI);
	},
	"Shiny Ladybug": (e) => {
		if(attemptDrawCache(e, e.render.angle + Math.PI)) return;
		let bodyColor = blendColor("#ebeb34", "#FF0000", Math.max(0, blendAmount(e)));
		let dotColor = blendColor("#111111", "#FF0000", Math.max(0, blendAmount(e)));
		let headColor = blendColor("#111111", "#FF0000", Math.max(0, blendAmount(e)));

		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			headColor = "#FFFFFF";
			dotColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle + Math.PI);
		let realctx = checkToCache(e);
		ctx.strokeStyle = blendColor(headColor, "#000000", 0.19);
		ctx.fillStyle = headColor;
		ctx.lineWidth = e.render.radius / 5; //7 * ((e.render.radius / 30) ** 0.9);

		// head (little black thing sticking out)
		ctx.beginPath();
		ctx.arc(-e.render.radius / 2, 0, e.render.radius / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.closePath();

		ctx.fill();
		ctx.save();
		ctx.clip();

		// ladybug spots
		ctx.fillStyle = dotColor;
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
			ctx.beginPath();
			ctx.arc((-0.5 + e.data[i]) * e.render.radius / 30 * 35, (-0.5 + e.data[i + 1] * e.render.radius / 30 * 35), e.render.radius / 30 * (5 + e.data[i + 2] * 5), 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.stroke();
		ctx.closePath();
		finishCache(e, realctx);
		ctx.rotate(-e.render.angle - Math.PI);
	},
	
	"Ocean Ladybug": (e) => {
		if(attemptDrawCache(e, e.render.angle + Math.PI)) return;
		let bodyColor = blendColor("#2ae8e5", "#FF0000", Math.max(0, blendAmount(e)));
		let dotColor = blendColor("#111111", "#FF0000", Math.max(0, blendAmount(e)));
		let headColor = blendColor("#111111", "#FF0000", Math.max(0, blendAmount(e)));

		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			headColor = "#FFFFFF";
			dotColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle + Math.PI);
		let realctx = checkToCache(e);
		ctx.strokeStyle = blendColor(headColor, "#000000", 0.19);
		ctx.fillStyle = headColor;
		ctx.lineWidth = e.render.radius / 5; //7 * ((e.render.radius / 30) ** 0.9);

		// head (little black thing sticking out)
		ctx.beginPath();
		ctx.arc(-e.render.radius / 2, 0, e.render.radius / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.closePath();

		ctx.fill();
		ctx.save();
		ctx.clip();

		// ladybug spots
		ctx.fillStyle = dotColor;
		for (let i = 0; i < (Math.ceil(Math.min(e.rarity, 5) ** 1.5) * 3) + 9; i += 3) {
			ctx.beginPath();
			ctx.arc((-0.5 + e.data[i]) * e.render.radius / 30 * 35, (-0.5 + e.data[i + 1] * e.render.radius / 30 * 35), e.render.radius / 30 * (5 + e.data[i + 2] * 5), 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, (5.9375 / 5) * Math.PI, (4.0625 / 5) * Math.PI);
		ctx.quadraticCurveTo(-10, 0, Math.cos((5.9375 / 5) * Math.PI) * e.render.radius, Math.sin((5.9375 / 5) * Math.PI) * e.render.radius);
		ctx.stroke();
		ctx.closePath();
		finishCache(e, realctx);
		ctx.rotate(-e.render.angle - Math.PI);
	},
	Soil: (e) => {
		ctx.beginPath();
		ctx.fillStyle = blendColor("#695118", '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor("#554213", '#FF0000', blendAmount(e));
		ctx.lineWidth = e.render.radius / 3;
		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "#FFFFFF"
		}
		//1.28, -0.25then 0.88, 0.7 then -0.04, 1.15 then -0.97, 0.71 then -1.23, -0.35 then -0.56, -1.23 then 0.6, -1.12
		ctx.moveTo(e.render.radius * 1.28, e.render.radius * -0.25),
		ctx.lineTo(e.render.radius * 0.88, e.render.radius * 0.7),
		ctx.lineTo(e.render.radius * -0.04, e.render.radius * 1.15),
		ctx.lineTo(e.render.radius * -0.97, e.render.radius * 0.71),
		ctx.lineTo(e.render.radius * -1.23, e.render.radius * -0.35),
		ctx.lineTo(e.render.radius * -0.56, e.render.radius * -1.23),
		ctx.lineTo(e.render.radius * 0.6, e.render.radius * -1.12),
		
		ctx.fill();
		ctx.lineTo(e.render.radius * 1.28, e.render.radius * -0.25),
		ctx.stroke();
		ctx.closePath();
	},
	"Sunlit Frog": (e) => {
		// render by @rubyflarm :D pro
		let bodyColor = blendColor("#d3c66d", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.rotate(e.render.angle)
		
		ctx.fillStyle = bodyColor
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.18)
		ctx.lineWidth = 0.2 * e.render.radius


		// toes and fingers
		ctx.beginPath()

		ctx.moveTo(-0.1*e.render.radius, 1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, 1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, 1.2*e.render.radius, 0.2*e.render.radius, 1.125*e.render.radius)
		
		ctx.moveTo(-0.1*e.render.radius, -1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, -1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, -1.2*e.render.radius, 0.2*e.render.radius, -1.125*e.render.radius)

		ctx.moveTo(e.render.radius, 0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, 0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, 0.6*e.render.radius, 1.4*e.render.radius, 0.7*e.render.radius)
		ctx.lineTo(e.render.radius, 0.65 * e.render.radius)

		ctx.moveTo(e.render.radius, -0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, -0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, -0.6*e.render.radius, 1.4*e.render.radius, -0.7*e.render.radius)
		ctx.lineTo(e.render.radius, -0.65 * e.render.radius)
		
		ctx.stroke()
		ctx.closePath()

		// legs
		ctx.beginPath()
		ctx.ellipse(-0.7*e.render.radius, 0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, 25 * Math.PI / 180, 0, Math.PI*2)
		ctx.ellipse(-0.7*e.render.radius, -0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, -25 * Math.PI / 180, 0, Math.PI*2)		
		ctx.fill()
		ctx.stroke()
		ctx.closePath()

		if (e.data == 0) {
			ctx.strokeStyle = blendColor("#ff8da1", "#FF0000", Math.max(0, blendAmount(e)));
			ctx.lineWidth = 0.4 * e.render.radius

			ctx.beginPath()
			ctx.moveTo(0, 0)
			ctx.lineTo(1.5*e.render.radius, 0)
			ctx.stroke()
			ctx.closePath()
		}

		// body stroke
		ctx.fillStyle = blendColor(bodyColor, "#000000", 0.18)

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.3*e.render.radius, 1.1*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// body fill
		ctx.fillStyle = bodyColor

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.1*e.render.radius, 0.9*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.fillStyle = blendColor(bodyColor, "#ffffff", 0.18)

		ctx.beginPath()
		ctx.ellipse(-0.2*e.render.radius, 0, 0.8*e.render.radius, 0.6*e.render.radius, 0, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// eyes
		ctx.fillStyle = "#000000"
		ctx.beginPath()
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.rotate(-e.render.angle)

		ctx.strokeStyle = "#000000"
		ctx.lineWidth = .5
		
		ctx.beginPath()
		ctx.ellipse(0, 0, e.render.radius, e.render.radius, 0, 0, Math.PI*2)
		//ctx.stroke()
		ctx.closePath()
	},
	
	"Moonlit Frog": (e) => {
		// render by @rubyflarm :D pro
		let bodyColor = blendColor("#4a1cad", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.rotate(e.render.angle)
		
		ctx.fillStyle = bodyColor
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.18)
		ctx.lineWidth = 0.2 * e.render.radius


		// toes and fingers
		ctx.beginPath()

		ctx.moveTo(-0.1*e.render.radius, 1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, 1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, 1.2*e.render.radius, 0.2*e.render.radius, 1.125*e.render.radius)
		
		ctx.moveTo(-0.1*e.render.radius, -1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, -1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, -1.2*e.render.radius, 0.2*e.render.radius, -1.125*e.render.radius)

		ctx.moveTo(e.render.radius, 0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, 0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, 0.6*e.render.radius, 1.4*e.render.radius, 0.7*e.render.radius)
		ctx.lineTo(e.render.radius, 0.65 * e.render.radius)

		ctx.moveTo(e.render.radius, -0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, -0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, -0.6*e.render.radius, 1.4*e.render.radius, -0.7*e.render.radius)
		ctx.lineTo(e.render.radius, -0.65 * e.render.radius)
		
		ctx.stroke()
		ctx.closePath()

		// legs
		ctx.beginPath()
		ctx.ellipse(-0.7*e.render.radius, 0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, 25 * Math.PI / 180, 0, Math.PI*2)
		ctx.ellipse(-0.7*e.render.radius, -0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, -25 * Math.PI / 180, 0, Math.PI*2)		
		ctx.fill()
		ctx.stroke()
		ctx.closePath()

		if (e.data == 0) {
			ctx.strokeStyle = blendColor("#ff8da1", "#FF0000", Math.max(0, blendAmount(e)));
			ctx.lineWidth = 0.4 * e.render.radius

			ctx.beginPath()
			ctx.moveTo(0, 0)
			ctx.lineTo(1.5*e.render.radius, 0)
			ctx.stroke()
			ctx.closePath()
		}

		// body stroke
		ctx.fillStyle = blendColor(bodyColor, "#000000", 0.18)

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.3*e.render.radius, 1.1*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// body fill
		ctx.fillStyle = bodyColor

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.1*e.render.radius, 0.9*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.fillStyle = blendColor(bodyColor, "#ffffff", 0.18)

		ctx.beginPath()
		ctx.ellipse(-0.2*e.render.radius, 0, 0.8*e.render.radius, 0.6*e.render.radius, 0, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// eyes
		ctx.fillStyle = "#000000"
		ctx.beginPath()
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.rotate(-e.render.angle)

		ctx.strokeStyle = "#000000"
		ctx.lineWidth = .5
		
		ctx.beginPath()
		ctx.ellipse(0, 0, e.render.radius, e.render.radius, 0, 0, Math.PI*2)
		//ctx.stroke()
		ctx.closePath()
	},
	"Ruby Frog": (e) => {
		// render by @rubyflarm :D pro
		let bodyColor = blendColor("#d63838", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.rotate(e.render.angle)
		
		ctx.fillStyle = bodyColor
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.18)
		ctx.lineWidth = 0.2 * e.render.radius


		// toes and fingers
		ctx.beginPath()

		ctx.moveTo(-0.1*e.render.radius, 1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, 1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, 1.2*e.render.radius, 0.2*e.render.radius, 1.125*e.render.radius)
		
		ctx.moveTo(-0.1*e.render.radius, -1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, -1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, -1.2*e.render.radius, 0.2*e.render.radius, -1.125*e.render.radius)

		ctx.moveTo(e.render.radius, 0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, 0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, 0.6*e.render.radius, 1.4*e.render.radius, 0.7*e.render.radius)
		ctx.lineTo(e.render.radius, 0.65 * e.render.radius)

		ctx.moveTo(e.render.radius, -0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, -0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, -0.6*e.render.radius, 1.4*e.render.radius, -0.7*e.render.radius)
		ctx.lineTo(e.render.radius, -0.65 * e.render.radius)
		
		ctx.stroke()
		ctx.closePath()

		// legs
		ctx.beginPath()
		ctx.ellipse(-0.7*e.render.radius, 0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, 25 * Math.PI / 180, 0, Math.PI*2)
		ctx.ellipse(-0.7*e.render.radius, -0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, -25 * Math.PI / 180, 0, Math.PI*2)		
		ctx.fill()
		ctx.stroke()
		ctx.closePath()

		if (e.data == 0) {
			ctx.strokeStyle = blendColor("#ff8da1", "#FF0000", Math.max(0, blendAmount(e)));
			ctx.lineWidth = 0.4 * e.render.radius

			ctx.beginPath()
			ctx.moveTo(0, 0)
			ctx.lineTo(1.5*e.render.radius, 0)
			ctx.stroke()
			ctx.closePath()
		}

		// body stroke
		ctx.fillStyle = blendColor(bodyColor, "#000000", 0.18)

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.3*e.render.radius, 1.1*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// body fill
		ctx.fillStyle = bodyColor

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.1*e.render.radius, 0.9*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.fillStyle = blendColor(bodyColor, "#ffffff", 0.18)

		ctx.beginPath()
		ctx.ellipse(-0.2*e.render.radius, 0, 0.8*e.render.radius, 0.6*e.render.radius, 0, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// eyes
		ctx.fillStyle = "#000000"
		ctx.beginPath()
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.rotate(-e.render.angle)

		ctx.strokeStyle = "#000000"
		ctx.lineWidth = .5
		
		ctx.beginPath()
		ctx.ellipse(0, 0, e.render.radius, e.render.radius, 0, 0, Math.PI*2)
		//ctx.stroke()
		ctx.closePath()
	},
	"Poison Dart Frog": (e) => {
		// render by @rubyflarm :D pro
		let bodyColor = blendColor(e.data[1], "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.rotate(e.render.angle)
		
		ctx.fillStyle = "#2f3fce"
		ctx.strokeStyle = blendColor("#2f3fce", "#000000", 0.18)
		ctx.lineWidth = 0.2 * e.render.radius


		// toes and fingers
		ctx.beginPath()

		ctx.moveTo(-0.1*e.render.radius, 1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, 1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, 1.2*e.render.radius, 0.2*e.render.radius, 1.125*e.render.radius)
		
		ctx.moveTo(-0.1*e.render.radius, -1.25 * e.render.radius)
		ctx.lineTo(0.15*e.render.radius, -1.35 * e.render.radius)
		ctx.quadraticCurveTo(0.1*e.render.radius, -1.2*e.render.radius, 0.2*e.render.radius, -1.125*e.render.radius)

		ctx.moveTo(e.render.radius, 0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, 0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, 0.6*e.render.radius, 1.4*e.render.radius, 0.7*e.render.radius)
		ctx.lineTo(e.render.radius, 0.65 * e.render.radius)

		ctx.moveTo(e.render.radius, -0.65 * e.render.radius)
		ctx.lineTo(1.35*e.render.radius, -0.9 * e.render.radius)
		ctx.quadraticCurveTo(1.2*e.render.radius, -0.6*e.render.radius, 1.4*e.render.radius, -0.7*e.render.radius)
		ctx.lineTo(e.render.radius, -0.65 * e.render.radius)
		
		ctx.stroke()
		ctx.closePath()

		// legs
		ctx.beginPath()
		ctx.ellipse(-0.7*e.render.radius, 0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, 25 * Math.PI / 180, 0, Math.PI*2)
		ctx.ellipse(-0.7*e.render.radius, -0.8*e.render.radius, 0.75*e.render.radius, 0.45*e.render.radius, -25 * Math.PI / 180, 0, Math.PI*2)		
		ctx.fill()
		ctx.stroke()
		ctx.closePath()

		if (e.data[0] == 0) {
			ctx.strokeStyle = blendColor("#ff8da1", "#FF0000", Math.max(0, blendAmount(e)));
			ctx.lineWidth = 0.4 * e.render.radius

			ctx.beginPath()
			ctx.moveTo(0, 0)
			ctx.lineTo(1.5*e.render.radius, 0)
			ctx.stroke()
			ctx.closePath()
		}

		// body stroke
		ctx.fillStyle = blendColor(bodyColor, "#000000", 0.18)

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.3*e.render.radius, 1.1*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.55*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// body fill
		ctx.fillStyle = bodyColor

		ctx.beginPath()
		ctx.ellipse(0, 0, 1.1*e.render.radius, 0.9*e.render.radius, 0, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.35*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		ctx.fillStyle = blendColor(bodyColor, "#ffffff", 0.18)

		ctx.beginPath()
		ctx.ellipse(-0.2*e.render.radius, 0, 0.8*e.render.radius, 0.6*e.render.radius, 0, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		// eyes
		ctx.fillStyle = "#000000"
		ctx.beginPath()
		ctx.arc(0.6*e.radius, 0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)
		ctx.arc(0.6*e.radius, -0.6*e.radius, 0.25*e.render.radius, 0, Math.PI*2)		
		ctx.fill()
		ctx.closePath()

		for (let i = 0; i < 15; i += 3) {
			ctx.beginPath();
			ctx.arc((-0.5 + e.data[2][i]) * (e.render.radius * 0.8) - 0.2 * e.render.radius, (-0.5 + e.data[2][i + 1] * e.render.radius * 0.8), e.render.radius / 30 * (5 + e.data[2][i + 2] * 5), 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}

		ctx.rotate(-e.render.angle)
	},
	"Agar.io Cell": (e) => {
		let bodyColor = blendColor(e.col, "#FF0000", Math.max(0, blendAmount(e)));
		let borderColor = blendColor(blendColor(e.col, "#000000", 0.3), "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			borderColor = "#FFFFFF";
		}
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = borderColor;
		ctx.lineWidth = e.render.radius / 7;
		// simulate wiggle
		// Hooke's law (yes we are bringing in physics to make silly flower game)
		for(let i = 0; i < e.offsets.length; i++){
			e.velocities[i] -= e.offsets[i] * 0.03;// -kx
			e.offsets[i] += e.velocities[i];
			const angle = (i / e.offsets.length) * Math.PI * 2;
			e.positions[i] = [
				Math.cos(angle) * e.render.radius * (1 + 0.003 * e.offsets[i]),
				Math.sin(angle) * e.render.radius * (1 + 0.003 * e.offsets[i]),//0.002
			]; 
		}
		ctx.beginPath();
		ctx.moveTo(e.positions[0][0], e.positions[0][1]);
		for(let i = 1; i < e.offsets.length; i++){
			ctx.lineTo(e.positions[i][0], e.positions[i][1]);
		}
		ctx.lineTo(e.positions[0][0], e.positions[0][1]);
		// ctx.arc(0,0,e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.lineWidth = e.render.radius / 30;
		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'black';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `600 ${e.render.radius / 3}px 'Ubuntu'`;
		ctx.strokeText("An unnamed cell",0,0);
		ctx.fillText("An unnamed cell",0,0);
	},
	"1v1text": (e) => {
		let outerColor = '#000000';
		let innerColor = blendColor("#FFFFFF", "#FF0000", Math.max(0, blendAmount(e)));
		if(e.txt === undefined){
			const arr = ['1v1', '1v1', 'pvp', 'Good luck!', 'glhf', 'skissue?'];
			const rareArr = ['Bike is short for biachael.', 'hawaii', 'street fighter in flowr??', 'skill issue detected 🤖','Agar.io, Diep.io, and Florr.io are by the same developer!','May the winners be the winners'];
			if(Math.random() < 0.985)e.txt = arr[Math.floor(Math.random() * arr.length)];
			else e.txt = rareArr[Math.floor(Math.random() * rareArr.length)];
		}
		if (checkForFirstFrame(e)) {
			outerColor = "#FFFFFF";
			innerColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle + Math.PI);
		ctx.strokeStyle = outerColor;
		ctx.fillStyle = innerColor;
		ctx.lineWidth = 4;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `600 25px 'Ubuntu'`;
		ctx.strokeText(e.txt,0,0);
		ctx.fillText(e.txt,0,0);
		ctx.rotate(-e.render.angle - Math.PI);
	},
	Rock: (e) => {
		// ctx.beginPath();
		// ctx.fillStyle = "#606060";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * e.render.radius * i[1], Math.sin(i[0]) * e.render.radius * i[1]);
		// }
		// ctx.fill();
		// ctx.closePath();
		// ctx.beginPath();
		// ctx.fillStyle = "#777777";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * (e.render.radius * i[1] - 10), Math.sin(i[0]) * (e.render.radius * i[1] - 10));
		// }
		// ctx.fill();
		// ctx.closePath();

		ctx.lineWidth = e.render.radius / 10;

		// e.ticksSinceLastDamaged = 1;

		ctx.fillStyle = blendColor('#777777', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#606060', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();

		ctx.moveTo(e.getVertexX(0), e.getVertexY(0));
		for (let i = 0; i < e.data.length; i++) {
			ctx.lineTo(e.getVertexX(i), e.getVertexY(i));
		}
		ctx.lineTo(e.getVertexX(0), e.getVertexY(0));
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

	},
	Sandstone: (e) => {
		// ctx.beginPath();
		// ctx.fillStyle = "#606060";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * e.render.radius * i[1], Math.sin(i[0]) * e.render.radius * i[1]);
		// }
		// ctx.fill();
		// ctx.closePath();
		// ctx.beginPath();
		// ctx.fillStyle = "#777777";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * (e.render.radius * i[1] - 10), Math.sin(i[0]) * (e.render.radius * i[1] - 10));
		// }
		// ctx.fill();
		// ctx.closePath();

		ctx.lineWidth = e.render.radius / 9;

		// e.ticksSinceLastDamaged = 1;

		ctx.fillStyle = blendColor('#dfc85c', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#d6ba36', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();

		ctx.moveTo(e.getVertexX(0), e.getVertexY(0));
		for (let i = 0; i < e.data.length; i++) {
			ctx.lineTo(e.getVertexX(i), e.getVertexY(i));
		}
		ctx.lineTo(e.getVertexX(0), e.getVertexY(0));
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

	},
	"Rock Tank": (e) => {
		ctx.rotate(e.render.angle);
		// barrel
		ctx.fillStyle = "#999999";
		ctx.strokeStyle = "#797979";

		ctx.lineWidth = 0.12 * e.render.radius;

		ctx.beginPath();
		ctx.rect(0, -e.render.radius * 0.4, e.render.radius * 1.6, e.render.radius * 0.4 * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// body
		normalEnemyRenderMap.Rock(e);
		ctx.rotate(-e.render.angle);
	},
	"RockMissile": (e) => {
		if(e.isFunny === undefined) e.isFunny = Math.random() < 0.001 ? true : false;

		if(e.isFunny){
			const p = e;
			if(p.image === undefined || p.image.onload === undefined){
				p.image = new Image();
				p.image.src = 'https://memes.co.in/memes/update/uploads/2021/12/InShot_20211209_222013681-1024x1024.jpg';
				p.image.onload = () => {
					p.imageLoaded = true;
				}
			}
			
			if(p.imageLoaded === true){
				ctx.drawImage(p.image, -p.radius, - p.radius, p.radius * 2, p.radius * 2);
			}
			
			return;
		}

		normalEnemyRenderMap.Rock(e);
	},
	"BigRockMissile": (e) => {
		if(e.isFunny === undefined) e.isFunny = Math.random() < 0.01 ? true : false;

		if(e.isFunny){
			const p = e;
			if(p.image === undefined || p.image.onload === undefined){
				p.image = new Image();
				p.image.src = 'https://memes.co.in/memes/update/uploads/2021/12/InShot_20211209_222013681-1024x1024.jpg';
				p.image.onload = () => {
					p.imageLoaded = true;
				}
			}
			
			if(p.imageLoaded === true){
				ctx.drawImage(p.image, -p.radius, - p.radius, p.radius * 2, p.radius * 2);
			}
			
			return;
		}

		normalEnemyRenderMap.Rock(e);
	},
	"BossRose": (e) => {
		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = blendColor('#ff94c9', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cf78a3', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	"BossRose2": (e) => {
		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = blendColor('#ff94c9', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cf78a3', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	"BossTrident": (e) => {

		ctx.lineWidth = e.radius * 0.2;
		ctx.beginPath();
		ctx.fillStyle = blendColor('#25dbe8', '#FF0000', blendAmount(e));

		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF"; 
		}
		
		//Shaft
		ctx.beginPath();
		ctx.moveTo(e.radius * -0.15, e.radius * 1.4);
		ctx.lineTo(e.radius * 0.15, e.radius * 1.4);
		ctx.lineTo(e.radius * 0.15, e.radius * -0.6);
		ctx.lineTo(e.radius * -0.15, e.radius * -0.6);
		ctx.fill()
		ctx.closePath();

		//Top Arrow
		ctx.beginPath();
		ctx.moveTo(e.radius * 0.35, e.radius * -0.6);
		ctx.lineTo(e.radius * -0.35, e.radius * -0.6);
		ctx.lineTo(e.radius * 0, e.radius * -1.2);
		ctx.fill()
		ctx.closePath();

		//Right bottom
		ctx.beginPath();
		ctx.lineTo(e.radius * 0.15, e.radius * 0.75);
		ctx.quadraticCurveTo(e.radius * 0.35, e.radius * 0.72, e.radius * 0.62, e.radius * 0.81);
		ctx.lineTo(e.radius * 0.42, e.radius * 0.5);
		ctx.lineTo(e.radius * 0.15, e.radius * 0.5);
		ctx.fill()
		ctx.closePath();

		//Right right
		ctx.beginPath();
		ctx.lineTo(e.radius * 0.62, e.radius * 0.81)
		ctx.quadraticCurveTo(e.radius * 0.66, e.radius * -0.12, e.radius * 1.22, e.radius * -0.84);
		ctx.lineTo(e.radius * 0.71, e.radius * -0.5)
		ctx.quadraticCurveTo(e.radius * 0.5, e.radius * -0.26, e.radius * 0.42, e.radius * 0.5)
		ctx.fill();
		ctx.closePath();

		//Right top
		ctx.beginPath();
		ctx.lineTo(e.radius * 0.71, e.radius * -0.5)
		ctx.lineTo(e.radius * 0.56, e.radius * -0.54)
		ctx.quadraticCurveTo(e.radius * 0.84, e.radius * -0.81, e.radius * 1.22, e.radius * -0.84)
		ctx.fill();
		ctx.closePath();

		//Left bottom
		ctx.beginPath();
		ctx.lineTo(e.radius * -0.15, e.radius * 0.75);
		ctx.quadraticCurveTo(e.radius * -0.35, e.radius * 0.72, e.radius * -0.62, e.radius * 0.81);
		ctx.lineTo(e.radius * -0.42, e.radius * 0.5);
		ctx.lineTo(e.radius * -0.15, e.radius * 0.5);
		ctx.fill()
		ctx.closePath();

		//Left right
		ctx.beginPath();
		ctx.lineTo(e.radius * -0.62, e.radius * 0.81)
		ctx.quadraticCurveTo(e.radius * -0.66, e.radius * -0.12, e.radius * -1.22, e.radius * -0.84);
		ctx.lineTo(e.radius * -0.71, e.radius * -0.5)
		ctx.quadraticCurveTo(e.radius * -0.5, e.radius * -0.26, e.radius * -0.42, e.radius * 0.5)
		ctx.fill();
		ctx.closePath();

		//Left top
		ctx.beginPath();
		ctx.lineTo(e.radius * -0.71, e.radius * -0.5)
		ctx.lineTo(e.radius * -0.56, e.radius * -0.54)
		ctx.quadraticCurveTo(e.radius * -0.84, e.radius * -0.81, e.radius * -1.22, e.radius * -0.84)
		ctx.fill();
		ctx.closePath();
	},
	"BossBud": (e) => {
		
		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = blendColor('#c02dd6', '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor('#9c24ad', '#FF0000', blendAmount(e));
		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF"; 
				ctx.strokeStyle = "#FFFFFF";
		}
		for(let i = 5; i--; i>0){
				ctx.beginPath();
				ctx.arc(e.radius * Math.sin(i * 6.28318/5), e.radius * Math.cos(i * 6.28318/5), e.radius*0.7, 0, Math.PI*2);
				ctx.fill();
				ctx.stroke();
				ctx.closePath();    
		}

		
		ctx.lineWidth = e.render.radius / 3;
		ctx.fillStyle = blendColor('#ebac00', '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor('#b38302', '#FF0000', blendAmount(e));
		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF"; 
				ctx.strokeStyle = "#FFFFFF";
		}
		
		ctx.beginPath();
		ctx.arc(0, 0, e.radius * 5/6, 0, Math.PI*2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	Coral: (e) => {
		let coralStroke = blendColor('#b04646', "#FF0000", Math.max(0, blendAmount(e)));
		let coralFill = blendColor('#f76767', "#FF0000", Math.max(0, blendAmount(e)));
		let mainFill = blendColor('#988eba', '#FF0000', Math.max(0, blendAmount(e)));
		let mainStroke = blendColor('#7c7498', '#FF0000', Math.max(0, blendAmount(e)));

		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.rotate(e.render.angle)


		let rockRadius = e.render.radius * (e.baseRadius/e.radius) * 0.7;
		if (e.isInEnemyBox || e.isMenuEnemy){
			rockRadius = e.render.radius;
		}
		ctx.fillStyle = mainFill
		ctx.strokeStyle = mainStroke
		ctx.lineWidth = .2 * rockRadius

		let sides = e.data
		let angle = Math.PI*2/sides

		ctx.beginPath()
		ctx.moveTo(Math.cos(-0.5 * angle)*rockRadius*.6, Math.sin(-0.5 * angle)*rockRadius*.6)
		for (let i = 0; i <= sides; i++) {
			ctx.quadraticCurveTo(Math.cos(angle * i)*rockRadius, Math.sin(angle*i)*rockRadius, Math.cos(angle*i+.5)*rockRadius*.6, Math.sin(angle*i+.5)*rockRadius*.6)
		}
		ctx.closePath()
		ctx.fill()
		ctx.stroke()

		ctx.strokeStyle = coralStroke
		ctx.lineWidth = .3 * e.render.radius
		
		ctx.beginPath()
		ctx.moveTo(0, 0)
		ctx.quadraticCurveTo(e.render.radius * 0.25, e.render.radius * 0.11, e.render.radius * 0.41, e.render.radius * 0.47)
		ctx.moveTo(e.render.radius * 0.65, e.render.radius * 0.34)
		ctx.quadraticCurveTo(e.render.radius * 0.33, e.render.radius * 0.41, e.render.radius * 0.24, e.render.radius * 0.78)
		ctx.moveTo(e.render.radius * 0.68, e.render.radius * 0.35)
		ctx.quadraticCurveTo(e.render.radius * 0.96, e.render.radius * 0.06, e.render.radius * 0.97, e.render.radius * -0.21)
		ctx.moveTo(e.render.radius * 0.68, e.render.radius * 0.35)
		ctx.quadraticCurveTo(e.render.radius * 1.08, e.render.radius * 0.26, e.render.radius * 1.23, e.render.radius * 0.04)
		ctx.moveTo(0, 0)
		ctx.quadraticCurveTo(e.render.radius * -0.33, e.render.radius * 0.19, e.render.radius * -0.61, e.render.radius * -0.01)
		ctx.moveTo(e.render.radius * -0.42, e.render.radius * 0.7)
		ctx.quadraticCurveTo(e.render.radius * -0.51, e.render.radius * 0.45, e.render.radius * -0.34, e.render.radius * 0.07)
		ctx.moveTo(e.render.radius * -0.61, e.render.radius * -0.04)
		ctx.quadraticCurveTo(e.render.radius * -0.93, e.render.radius * -0.26, e.render.radius * -1.21, e.render.radius * -0.24)
		ctx.moveTo(e.render.radius * -0.61, e.render.radius * -0.04)
		ctx.quadraticCurveTo(e.render.radius * -1.01, e.render.radius * -0.03, e.render.radius * -1.22, e.render.radius * 0.12)
		ctx.moveTo(e.render.radius * -0.89, e.render.radius * -0.18)
		ctx.quadraticCurveTo(e.render.radius * -0.76, e.render.radius * -0.41, e.render.radius * -0.38, e.render.radius * -0.55)
		ctx.moveTo(0, 0)
		ctx.quadraticCurveTo(e.render.radius * 0.09, e.render.radius * -0.37, e.render.radius * 0.44, e.render.radius * -0.43)
		ctx.moveTo(e.render.radius * 0.44, e.render.radius * -0.43)
		ctx.quadraticCurveTo(e.render.radius * 0.78, e.render.radius * -0.78, e.render.radius * 0.73, -e.render.radius)
		ctx.moveTo(e.render.radius * 0.44, e.render.radius * -0.43)
		ctx.quadraticCurveTo(e.render.radius * 0.83, e.render.radius * -0.52, e.render.radius * 0.99, e.render.radius * -0.74)
		ctx.moveTo(e.render.radius * 0.17, e.render.radius * -0.31)
		ctx.quadraticCurveTo(e.render.radius * 0.01, e.render.radius * -0.66, e.render.radius * -0.23, e.render.radius * -0.78)
		ctx.closePath()		
		ctx.stroke()

		ctx.strokeStyle = coralFill
		ctx.lineWidth = 0.15 * e.render.radius
		ctx.stroke()

		ctx.rotate(-e.render.angle)
	},
	"Tanksmith": (e) => {
		ctx.fillStyle = blendColor(Colors.rarities[e.rarity] ? Colors.rarities[e.rarity].color : "#790000", "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor(Colors.rarities[e.rarity] ? Colors.rarities[e.rarity].border : "#550000", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#FFFFFF";
			ctx.strokeStyle = "#FFFFFF";
		}
		ctx.lineWidth = 4;
		// main body
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(e.render.angle);
        
		ctx.lineWidth = 5;
		const renderType = e.tsRenderType ?? e.render.tsRenderType;
		if(renderType === 'Heal'){
			if(e.render.radius < 50) ctx.lineWidth = e.render.radius / 50 * 5;
			// healing cross
			ctx.fillStyle = blendColor('#fa0028', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.strokeStyle = blendColor('#af001c', "#FF0000", Math.max(0, blendAmount(e)));
			const l = e.render.radius * 0.72;
			const s = e.render.radius * 0.27;
			ctx.beginPath();
			ctx.moveTo(l, s);
			ctx.lineTo(s, s);
			ctx.lineTo(s, l);
			ctx.lineTo(-s, l);
			ctx.lineTo(-s, s);
			ctx.lineTo(-l, s);
			ctx.lineTo(-l, -s);
			ctx.lineTo(-s, -s);
			ctx.lineTo(-s, -l);
			ctx.lineTo(s, -l);
			ctx.lineTo(s, -s);
			ctx.lineTo(l, -s);
			ctx.lineTo(l, s);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
		else if(renderType === 'TankHeal'){
			if(e.render.radius < 50) ctx.lineWidth = e.render.radius / 50 * 5;
			// healing cross
			ctx.fillStyle = blendColor('#0400fa', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.strokeStyle = blendColor('#0300ad', "#FF0000", Math.max(0, blendAmount(e)));
			const l = e.render.radius * 0.72;
			const s = e.render.radius * 0.27;
			ctx.beginPath();
			ctx.moveTo(l, s);
			ctx.lineTo(s, s);
			ctx.lineTo(s, l);
			ctx.lineTo(-s, l);
			ctx.lineTo(-s, s);
			ctx.lineTo(-l, s);
			ctx.lineTo(-l, -s);
			ctx.lineTo(-s, -s);
			ctx.lineTo(-s, -l);
			ctx.lineTo(s, -l);
			ctx.lineTo(s, -s);
			ctx.lineTo(l, -s);
			ctx.lineTo(l, s);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		} else if(renderType === 'Bud'){
			// TODO draw bud
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Bud'](e);
			e.radius = last;
		} else if(renderType === 'Bloom'){
			// TODO draw bud
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Bloom'](e);
			e.radius = last;
		} else if(renderType === 'Magnet'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Magnet'](e);
			e.radius = last;
		} else if(renderType === 'Egg'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Egg'](e);
			e.radius = last;
		} else if(renderType === 'Jellyfish Egg'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Jellyfish Egg'](e);
			e.radius = last;
		} else if(renderType === 'Square'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Square'](e);
			e.radius = last;
		} else if(renderType === 'Pentagon'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Pentagon'](e);
			e.radius = last;
		} else if(renderType === 'Plastic Egg'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Plastic Egg'](e);
			e.radius = last;
		} else if(renderType === 'Ant Egg'){
			const last = e.radius;
			e.radius = e.render.radius / 1.99;
			petalRenderMap['Ant Egg'](e);
			e.radius = last;
		} else {
			// barrel
			ctx.fillStyle = blendColor('#bfbfbf', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.strokeStyle = blendColor('#868686', "#FF0000", Math.max(0, blendAmount(e)));
			for(let i = 0; i < e.barrelNum; i++){
				let r = Math.PI * 2 / e.barrelNum * i;
				if(e.barrelData !== undefined && e.barrelData[i] !== undefined){
					r = e.barrelData[i].angle;
				}
				ctx.rotate(r);
				ctx.beginPath();
				ctx.roundRect(0, -e.render.radius * 0.33, e.render.radius * 1.3, e.render.radius * 0.33 * 2, 2);
				ctx.fill();
				ctx.stroke();
				ctx.closePath();
				ctx.rotate(-r);
			}
			
			ctx.beginPath();
			ctx.arc(0, 0, e.render.radius/2, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
		// barrel
		ctx.rotate(-e.render.angle);
	},
	Square: (e) => {
		// ctx.beginPath();
		// ctx.fillStyle = "#606060";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * e.render.radius * i[1], Math.sin(i[0]) * e.render.radius * i[1]);
		// }
		// ctx.fill();
		// ctx.closePath();
		// ctx.beginPath();
		// ctx.fillStyle = "#777777";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * (e.render.radius * i[1] - 10), Math.sin(i[0]) * (e.render.radius * i[1] - 10));
		// }
		// ctx.fill();
		// ctx.closePath();

		ctx.lineWidth = e.render.radius / 5;

		// e.ticksSinceLastDamaged = 1;

		ctx.fillStyle = blendColor('#ffe869', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cfbc55', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.shadowColor = ctx.fillStyle;
		ctx.shadowBlur = 56 + 40 * Math.sin(time / 300);

		if (e.renderRotation === undefined) {
			e.renderRotation = 2 * Math.PI * Math.random();
		}
		e.renderRotation += 0.002;
		ctx.rotate(e.renderRotation);

		ctx.beginPath();
		ctx.roundRect(-e.render.radius, -e.render.radius, e.render.radius * 2, e.render.radius * 2, e.render.radius / 12);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.renderRotation);

		ctx.shadowBlur = 0;
	},
	Pentagon: (e) => {
		// ctx.beginPath();
		// ctx.fillStyle = "#606060";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * e.render.radius * i[1], Math.sin(i[0]) * e.render.radius * i[1]);
		// }
		// ctx.fill();
		// ctx.closePath();
		// ctx.beginPath();
		// ctx.fillStyle = "#777777";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * (e.render.radius * i[1] - 10), Math.sin(i[0]) * (e.render.radius * i[1] - 10));
		// }
		// ctx.fill();
		// ctx.closePath();

		ctx.lineWidth = e.render.radius / 5;

		// e.ticksSinceLastDamaged = 1;

		ctx.fillStyle = blendColor('#768dfc', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#586bbd', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.shadowColor = ctx.fillStyle;
		ctx.shadowBlur = 56 + 40 * Math.sin(time / 300);

		if (e.renderRotation === undefined) {
			e.renderRotation = 2 * Math.PI * Math.random();
		}
		e.renderRotation += 0.002;
		ctx.rotate(e.renderRotation);

		ctx.beginPath();
		for(let i = 0; i < 5; i++){
			ctx.lineTo(Math.cos(i * Math.PI * 2/5) * e.render.radius, Math.sin(i * Math.PI * 2/5) * e.render.radius)
		}
		ctx.lineTo(e.render.radius, 0)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.renderRotation);

		ctx.shadowBlur = 0;
	},
	
	Hexagon: (e) => {
		// ctx.beginPath();
		// ctx.fillStyle = "#606060";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * e.render.radius * i[1], Math.sin(i[0]) * e.render.radius * i[1]);
		// }
		// ctx.fill();
		// ctx.closePath();
		// ctx.beginPath();
		// ctx.fillStyle = "#777777";
		// for(let i of e.data){
		// 	ctx.lineTo(Math.cos(i[0]) * (e.render.radius * i[1] - 10), Math.sin(i[0]) * (e.render.radius * i[1] - 10));
		// }
		// ctx.fill();
		// ctx.closePath();

		ctx.lineWidth = e.render.radius / 5;

		// e.ticksSinceLastDamaged = 1;

		ctx.fillStyle = blendColor('#b50e11', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#80090b', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.shadowColor = ctx.fillStyle;
		ctx.shadowBlur = 56 + 40 * Math.sin(time / 300);

		if (e.renderRotation === undefined) {
			e.renderRotation = 2 * Math.PI * Math.random();
		}
		e.renderRotation += 0.002;
		ctx.rotate(e.renderRotation);

		ctx.beginPath();
		for(let i = 0; i < 6; i++){
			ctx.lineTo(Math.cos(i * Math.PI * 2/6) * e.render.radius, Math.sin(i * Math.PI * 2/6) * e.render.radius)
		}
		ctx.lineTo(e.render.radius, 0)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.renderRotation);

		ctx.shadowBlur = 0;
	},
	Dandelion: (e) => {
		// e.ticksSinceLastDamaged = 1;

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that stems dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// stems
		ctx.strokeStyle = "black";
		ctx.lineWidth = e.render.radius / 3;

		ctx.rotate(e.render.angle);
		for (let i = 5; i--; i > 0) {
			let rotateAmount = i * Math.PI * 2 / 5;
			ctx.rotate(rotateAmount);
			ctx.beginPath();
			ctx.moveTo(-e.render.radius * 1, 0);
			ctx.lineTo(e.render.radius * 1, 0);
			ctx.stroke();
			ctx.rotate(-rotateAmount);
			ctx.closePath();
		}
		ctx.rotate(-e.render.angle);

		if (isOpaq === true) {
			ctx.restore();
		}
		ctx.lineWidth = e.render.radius / 5;

		ctx.fillStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cfcfcf', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

	},
	DandelionMissile: (e) => {

		// e.ticksSinceLastDamaged = 1;

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that stems dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// stems
		ctx.strokeStyle = "black";
		ctx.lineWidth = e.render.radius;

		ctx.rotate(e.render.angle);
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 2, 0);
		ctx.lineTo(0, 0);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.render.angle);

		if (isOpaq === true) {
			ctx.restore();
		}
		ctx.lineWidth = e.render.radius / 2.5;

		ctx.fillStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cfcfcf', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

	},
	"Baby Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#555555", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#454545", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);

		ctx.translate(e.render.radius * -0.15, 0)

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.translate(e.render.radius * 0.15, 0)

		ctx.rotate(-e.render.angle);
	},
	"Worker Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#555555", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#454545", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Soldier Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#555555", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#454545", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);


		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();


		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.05;
		ctx.fillStyle = "#ffffff";
		ctx.globalAlpha *= 0.3

		ctx.beginPath();

		ctx.rotate(wingAngle);
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * -0.54, e.render.radius * 0.79, e.render.radius * 0.42, 15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(-wingAngle)

		ctx.rotate(-wingAngle)
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * 0.54, e.render.radius * 0.79, e.render.radius * 0.42, -15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(wingAngle)

		ctx.fill();
		ctx.closePath();

		ctx.globalAlpha *= 1 / 0.3

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Queen Ant": (e) => {
		ctx.lastTransform73408 = ctx.getTransform();
		ctx.scale(.8, .8);
		// Made by the_unfunny_2
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 1.84390889146 /*Math.sqrt(3.4) which is the difference between radii of same rarity soldier and queen*/ / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#555555', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#454545', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// "legs" no they are jaws you dumbbum-
		ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = "#ffffff";
		}
		ctx.lineWidth = e.render.radius / 3.75;

		ctx.rotate(e.render.angle);

		ctx.translate(-e.render.radius * 0.52, 0);

		let angle = Math.cos(time / 180 + e.render.time / 90) * 0.12 * 0.5;
		ctx.translate(e.render.radius * 1.2, e.render.radius * 0.4); // 1
		ctx.rotate(angle);
		ctx.beginPath();
		ctx.lineTo(-e.render.radius * 0.4, e.render.radius * 0.05);
		ctx.quadraticCurveTo(e.render.radius * 0.7, e.render.radius * 0.05, e.render.radius * 0.9, -e.render.radius * 0.125);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-angle);
		ctx.translate(-e.render.radius * 1.2, -e.render.radius * 0.4); // 0

		ctx.translate(e.render.radius * 1.2, -e.render.radius * 0.4); // 1
		ctx.rotate(-angle);
		ctx.beginPath();
		ctx.lineTo(-e.render.radius * 0.4, -e.render.radius * 0.05);
		ctx.quadraticCurveTo(e.render.radius * 0.7, -e.render.radius * 0.05, e.render.radius * 0.9, e.render.radius * 0.125);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(angle);
		ctx.translate(-e.render.radius * 1.2, e.render.radius * 0.4); // 0

		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		ctx.beginPath();
		ctx.arc(-e.render.radius * 3 / 4, 0, e.render.radius * 13 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * 1 / 4, 0, e.render.radius * 11.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Wings
		ctx.globalAlpha *= 0.3;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 95) / 7 - 0.05;
		// console.log(e.render.time, wingAngle);
		ctx.translate(e.render.radius * 0.4, 0); // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.4)) // -0.4
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.4)) // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.4, 0); // 0
		ctx.globalAlpha *= (1 / 0.3);

		ctx.rotate(-e.render.angle);

		ctx.lineWidth = e.render.radius / 5;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.rotate(e.render.angle);
		// head
		ctx.beginPath();
		ctx.arc(e.render.radius, 0, e.render.radius * 9.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.setTransform(ctx.lastTransform73408);

		// ctx.translate(e.render.radius * 0.52, 0);

		// ctx.rotate(-e.render.angle); // it took me way too long to realize that i had to move this line down here.

		// ctx.scale(1/.8, 1/.8);
	},
	"Baby Termite": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#c7a037", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#a1822f", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);

		ctx.translate(e.render.radius * -0.15, 0)

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.rotate(angle - Math.PI / 75)
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * -0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * -0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * -0.23)
		ctx.rotate(-(angle - Math.PI / 75))

		ctx.rotate(-(angle - Math.PI / 75))
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * 0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * 0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * 0.23)
		ctx.rotate(angle - Math.PI / 75)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.translate(e.render.radius * 0.15, 0)

		ctx.rotate(-e.render.angle);
	},
	"Worker Termite": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#c7a037", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#a1822f", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.rotate(angle - Math.PI / 75)
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * -0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * -0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * -0.23)
		ctx.rotate(-(angle - Math.PI / 75))

		ctx.rotate(-(angle - Math.PI / 75))
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * 0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * 0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * 0.23)
		ctx.rotate(angle - Math.PI / 75)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Soldier Termite": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#c7a037", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#a1822f", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);


		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.rotate(angle - Math.PI / 75)
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * -0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * -0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * -0.23)
		ctx.rotate(-(angle - Math.PI / 75))

		ctx.rotate(-(angle - Math.PI / 75))
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * 0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * 0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * 0.23)
		ctx.rotate(angle - Math.PI / 75)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.05;
		ctx.fillStyle = "#ffffff";
		ctx.globalAlpha *= 0.3

		ctx.beginPath();

		ctx.rotate(wingAngle);
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * -0.54, e.render.radius * 0.79, e.render.radius * 0.42, 15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(-wingAngle)

		ctx.rotate(-wingAngle)
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * 0.54, e.render.radius * 0.79, e.render.radius * 0.42, -15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(wingAngle)

		ctx.fill();
		ctx.closePath();

		ctx.globalAlpha *= 1 / 0.3

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Queen Termite": (e) => {
		ctx.lastTransform73408 = ctx.getTransform();
		ctx.scale(.8, .8);
		// Made by the_unfunny_2
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 1.84390889146 /*Math.sqrt(3.4) which is the difference between radii of same rarity soldier and queen*/ / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#c7a037", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor(e.team === "flower" ? "#cfbd53" : "#a1822f", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// "legs" no they are jaws you dumbbum-
		ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = "#ffffff";
		}
		ctx.lineWidth = e.render.radius / 3.75;

		ctx.rotate(e.render.angle);

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.translate(e.render.radius * 5 / 8, 0)

		ctx.beginPath();

		ctx.rotate(angle - Math.PI / 75)
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * -0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * -0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * -0.23)
		ctx.rotate(-(angle - Math.PI / 75))

		ctx.rotate(-(angle - Math.PI / 75))
		ctx.moveTo(e.render.radius * 0.76, e.render.radius * 0.3)
		ctx.lineTo(e.render.radius * 1.07, e.render.radius * 0.5)
		ctx.lineTo(e.render.radius * 1.41, e.render.radius * 0.23)
		ctx.rotate(angle - Math.PI / 75)

		ctx.stroke();
		ctx.closePath();

		ctx.translate(-e.render.radius * 5 / 8, 0)

		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 3 / 4, 0, e.render.radius * 13 / 12.5 * 1.2, e.render.radius * 13 / 12.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.ellipse(e.render.radius * 1 / 4, 0, e.render.radius * 11.5 / 12.5 * 1.2, e.render.radius * 11.5 / 12.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Wings
		ctx.globalAlpha *= 0.3;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 95) / 7 - 0.05;
		// console.log(e.render.time, wingAngle);
		ctx.translate(e.render.radius * 0.4, 0); // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.4)) // -0.4
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.4)) // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.4, 0); // 0
		ctx.globalAlpha *= (1 / 0.3);

		ctx.rotate(-e.render.angle);

		ctx.lineWidth = e.render.radius / 5;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.rotate(e.render.angle);
		// head
		ctx.beginPath();
		ctx.arc(e.render.radius, 0, e.render.radius * 9.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.setTransform(ctx.lastTransform73408);

		// ctx.translate(e.render.radius * 0.52, 0);

		// ctx.rotate(-e.render.angle); // it took me way too long to realize that i had to move this line down here.

		// ctx.scale(1/.8, 1/.8);
	},
	"Termite Mound": (e) => {
		let colors = ["#a39d43", "#858033", "#605d28"].map(p => blendColor(p, "#FF0000", Math.max(0, blendAmount(e))));
		if (checkForFirstFrame(e)) {
			colors[0] = "#FFFFFF";
			colors[1] = "#FFFFFF";
			colors[2] = "#FFFFFF";
		}
		ctx.fillStyle = colors[0];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[1];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 2 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[2]
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 1 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	},
	"Termite Egg": (e) => {
		/*
		if (isOpaq === true) {
			ctx.restore();
		}
		*/
		ctx.lineWidth = e.render.radius / 4.5;

		ctx.fillStyle = blendColor('#ffe586', "#FFFFFF", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#d0b968', "#FFFFFF", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath(); // wow, what a unique and original enemy design! sure havent seen this one anywhere!
	},
	"Queen Shiny Ant": (e) => {
		ctx.lastTransform73408 = ctx.getTransform();
		ctx.scale(.8, .8);
		// Made by the_unfunny_2
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 1.84390889146 /*Math.sqrt(3.4) which is the difference between radii of same rarity soldier and queen*/ / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#cfd14d', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#a7a83e', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// "legs" no they are jaws you dumbbum-
		ctx.strokeStyle = blendColor('#7a7a2d', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = "#ffffff";
		}
		ctx.lineWidth = e.render.radius / 3.75;

		ctx.rotate(e.render.angle);

		ctx.translate(-e.render.radius * 0.52, 0);

		let angle = Math.cos(time / 180 + e.render.time / 90) * 0.12 * 0.5;
		ctx.translate(e.render.radius * 1.2, e.render.radius * 0.4); // 1
		ctx.rotate(angle);
		ctx.beginPath();
		ctx.lineTo(-e.render.radius * 0.4, e.render.radius * 0.05);
		ctx.quadraticCurveTo(e.render.radius * 0.7, e.render.radius * 0.05, e.render.radius * 0.9, -e.render.radius * 0.125);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-angle);
		ctx.translate(-e.render.radius * 1.2, -e.render.radius * 0.4); // 0

		ctx.translate(e.render.radius * 1.2, -e.render.radius * 0.4); // 1
		ctx.rotate(-angle);
		ctx.beginPath();
		ctx.lineTo(-e.render.radius * 0.4, -e.render.radius * 0.05);
		ctx.quadraticCurveTo(e.render.radius * 0.7, -e.render.radius * 0.05, e.render.radius * 0.9, e.render.radius * 0.125);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(angle);
		ctx.translate(-e.render.radius * 1.2, e.render.radius * 0.4); // 0

		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		ctx.beginPath();
		ctx.arc(-e.render.radius * 3 / 4, 0, e.render.radius * 13 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * 1 / 4, 0, e.render.radius * 11.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Wings
		ctx.globalAlpha *= 0.3;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 95) / 7 - 0.05;
		// console.log(e.render.time, wingAngle);
		ctx.translate(e.render.radius * 0.4, 0); // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.4)) // -0.4
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.4)) // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.4, 0); // 0
		ctx.globalAlpha *= (1 / 0.3);

		ctx.rotate(-e.render.angle);

		ctx.lineWidth = e.render.radius / 5;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.rotate(e.render.angle);
		// head
		ctx.beginPath();
		ctx.arc(e.render.radius, 0, e.render.radius * 9.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.setTransform(ctx.lastTransform73408);

		// ctx.translate(e.render.radius * 0.52, 0);

		// ctx.rotate(-e.render.angle); // it took me way too long to realize that i had to move this line down here.

		// ctx.scale(1/.8, 1/.8);
	},
	"Soldier Shiny Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		if (e.splitShockwaveWarningTime){
			if (time < e.splitShockwaveWarningTime + 1333 && (!e.splitShockwaveTime || time > e.splitShockwaveTime + 1333)){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = ((time - e.splitShockwaveWarningTime)/1333);
				ctx.strokeStyle = "red";

				ctx.lineWidth = 3000;	
				ctx.lineCap = "butt";

				for(let i = 4; i--; i>0){
					ctx.beginPath();
					ctx.arc(0, 0, 1500, e.splitShockwaveAngle - 0.3 + i * Math.PI/2, e.splitShockwaveAngle + 0.3 + i * Math.PI/2);
					ctx.stroke();
					ctx.closePath();
				}

				ctx.globalAlpha = savedAlpha;
				ctx.lineCap = "round"
			} else {
				delete e.splitShockwaveWarningTime
			}
		}
		if (e.splitShockwaveTime){
			if (time < e.splitShockwaveTime + 250){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = 0.5-((time - e.splitShockwaveTime)/500);
				ctx.strokeStyle = "white";

				ctx.lineWidth = 3000;	
				ctx.lineCap = "butt";

				for(let i = 4; i--; i>0){
					ctx.beginPath();
					ctx.arc(0, 0, 1500, e.splitShockwaveAngle - 0.3 + i * Math.PI/2, e.splitShockwaveAngle + 0.3 + i * Math.PI/2);
					ctx.stroke();
					ctx.closePath();
				}

				ctx.globalAlpha = savedAlpha;
				ctx.lineCap = "round"
			} else {
				delete e.splitShockwaveTime
			}
		}

		if (e.singleShockwaveWarningTime){
			if (time < e.singleShockwaveWarningTime + 4000 && (!e.singleShockwaveTime || time > e.singleShockwaveWarningTime + 4000)){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = ((time - e.singleShockwaveWarningTime)/4000);
				ctx.strokeStyle = "red";

				ctx.lineWidth = 5000;	
				ctx.lineCap = "butt";

				ctx.beginPath();
				ctx.arc(0, 0, 1, e.render.angle - 0.03, e.render.angle + 0.03);
				ctx.stroke();
				ctx.closePath();

				ctx.globalAlpha = savedAlpha;
				ctx.lineCap = "round"
			} else {
				delete e.singleShockwaveWarningTime
			}
		}
		if (e.singleShockwaveTime){
			if (time < e.singleShockwaveTime + 1000){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = 0.5-((time - e.singleShockwaveTime)/2000);
				ctx.strokeStyle = "white";

				ctx.lineWidth = 5000;	
				ctx.lineCap = "butt";

				ctx.beginPath();
				ctx.arc(0, 0, 1, e.render.angle - 0.03, e.render.angle + 0.03);
				ctx.stroke();
				ctx.closePath();

				ctx.globalAlpha = savedAlpha;
				ctx.lineCap = "round"
			} else {
				delete e.singleShockwaveTime
			}
		}

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#cfd14d", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#a7a83e", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#7a7a2d";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);


		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();


		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.05;
		ctx.fillStyle = "#ffffff";
		ctx.globalAlpha *= 0.3

		ctx.beginPath();

		ctx.rotate(wingAngle);
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * -0.54, e.render.radius * 0.79, e.render.radius * 0.42, 15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(-wingAngle)

		ctx.rotate(-wingAngle)
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * 0.54, e.render.radius * 0.79, e.render.radius * 0.42, -15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(wingAngle)

		ctx.fill();
		ctx.closePath();

		ctx.globalAlpha *= 1 / 0.3

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Queen Fire Ant": (e) => {
		ctx.lastTransform8279134 = ctx.getTransform();
		ctx.scale(.8, .8);
		// Made by the_unfunny_2
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 1.84390889146 /*Math.sqrt(3.4) which is the difference between radii of same rarity soldier and queen*/ / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#a82a00', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#882200', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// "legs" no they are jaws you dumbbum-
		ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = "#ffffff";
		}
		ctx.lineWidth = e.render.radius / 3.75;

		ctx.rotate(e.render.angle);

		ctx.translate(-e.render.radius * 0.52, 0);

		let angle = Math.cos(time / 180 + e.render.time / 90) * 0.12 * 0.5;
		ctx.translate(e.render.radius * 1.2, e.render.radius * 0.4); // 1
		ctx.rotate(angle);
		ctx.beginPath();
		ctx.lineTo(-e.render.radius * 0.4, e.render.radius * 0.05);
		ctx.quadraticCurveTo(e.render.radius * 0.7, e.render.radius * 0.05, e.render.radius * 0.9, -e.render.radius * 0.125);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-angle);
		ctx.translate(-e.render.radius * 1.2, -e.render.radius * 0.4); // 0

		ctx.translate(e.render.radius * 1.2, -e.render.radius * 0.4); // 1
		ctx.rotate(-angle);
		ctx.beginPath();
		ctx.lineTo(-e.render.radius * 0.4, -e.render.radius * 0.05);
		ctx.quadraticCurveTo(e.render.radius * 0.7, -e.render.radius * 0.05, e.render.radius * 0.9, e.render.radius * 0.125);
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(angle);
		ctx.translate(-e.render.radius * 1.2, e.render.radius * 0.4); // 0

		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		ctx.beginPath();
		ctx.arc(-e.render.radius * 3 / 4, 0, e.render.radius * 13 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * 1 / 4, 0, e.render.radius * 11.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Wings
		ctx.globalAlpha *= 0.3;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 95) / 7 - 0.05;
		// console.log(e.render.time, wingAngle);
		ctx.translate(e.render.radius * 0.4, 0); // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.4)) // -0.4
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.4); // -0.5
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 1.1, e.render.radius * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.4)) // -0.4
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.4, 0); // 0
		ctx.globalAlpha *= (1 / 0.3);

		ctx.rotate(-e.render.angle);

		ctx.lineWidth = e.render.radius / 5;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.rotate(e.render.angle);
		// head
		ctx.beginPath();
		ctx.arc(e.render.radius, 0, e.render.radius * 9.5 / 12.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.setTransform(ctx.lastTransform8279134);

		// ctx.translate(e.render.radius * 0.52, 0);

		// ctx.rotate(-e.render.angle); // it took me way too long to realize that i had to move this line down here.

		// ctx.scale(1/.8, 1/.8);
	},
	"Ant Egg": (e) => {
		/*
		if (isOpaq === true) {
			ctx.restore();
		}
		*/
		ctx.lineWidth = e.render.radius / 4.5;

		ctx.fillStyle = blendColor('#fff0b8', "#FFFFFF", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cfc295', "#FFFFFF", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath(); // wow, what a unique and original enemy design! sure havent seen this one anywhere!
	},
	"Fire Ant Egg": (e) => {
		/*
		if (isOpaq === true) {
			ctx.restore();
		}
		*/
		ctx.lineWidth = e.render.radius / 4.5;

		ctx.fillStyle = blendColor('#ffd1b8', "#FFFFFF", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cdaa96', "#FFFFFF", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath(); // wow, what a unique and original enemy design! sure havent seen this one anywhere!
	},
	"Shiny Ant Egg": (e) => {
		/*
		if (isOpaq === true) {
			ctx.restore();
		}
		*/
		ctx.lineWidth = e.render.radius / 4.5;

		ctx.fillStyle = blendColor('#fff0b8', "#FFFFFF", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#cfc295', "#FFFFFF", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath(); // wow, what a unique and original enemy design! sure havent seen this one anywhere!
	},
	"Sea Floor Burrow": (e) => {
		let colors = ["#777777", "#555555", "#333333"].map(p => blendColor(p, "#FF0000", Math.max(0, blendAmount(e))));
		if (checkForFirstFrame(e)) {
			colors[0] = "#FFFFFF";
			colors[1] = "#FFFFFF";
			colors[2] = "#FFFFFF";
		}
		ctx.fillStyle = colors[0];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[1];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 2 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[2]
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 1 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	},
	"Ant Burrow": (e) => {
		let colors = ["#B48404", "#946C04", "#6C4C04"].map(p => blendColor(p, "#FF0000", Math.max(0, blendAmount(e))));
		if (checkForFirstFrame(e)) {
			colors[0] = "#FFFFFF";
			colors[1] = "#FFFFFF";
			colors[2] = "#FFFFFF";
		}
		ctx.fillStyle = colors[0];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[1];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 2 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[2]
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 1 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	},
	
	"Shiny Ant Burrow": (e) => {
		let colors = ["#ffff17", "#d1d132", "#adad44"].map(p => blendColor(p, "#FF0000", Math.max(0, blendAmount(e))));
		if (checkForFirstFrame(e)) {
			colors[0] = "#FFFFFF";
			colors[1] = "#FFFFFF";
			colors[2] = "#FFFFFF";
		}
		ctx.fillStyle = colors[0];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[1];
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 2 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = colors[2]
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 1 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	},
	"Soldier Fire Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#a82a00", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#882200", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);


		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();


		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.05;
		ctx.fillStyle = "#ffffff";
		ctx.globalAlpha *= 0.3

		ctx.beginPath();

		ctx.rotate(wingAngle);
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * -0.54, e.render.radius * 0.79, e.render.radius * 0.42, 15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(-wingAngle)

		ctx.rotate(-wingAngle)
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * 0.54, e.render.radius * 0.79, e.render.radius * 0.42, -15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(wingAngle)

		ctx.fill();
		ctx.closePath();

		ctx.globalAlpha *= 1 / 0.3

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Worker Fire Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#a82a00", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#882200", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);


		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();


		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.91, e.render.radius * 0, e.render.radius * 0.65, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	"Baby Fire Ant": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor(e.team === "flower" ? "#fbea6f" : "#a82a00", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor(e.team === "flower" ? "#cfbd53" : "#882200", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);

		ctx.translate(e.render.radius * -0.15, 0)

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.translate(e.render.radius * 0.15, 0)

		ctx.rotate(-e.render.angle);
	},
	Hornet: (e) => {
		let bodyColor = blendColor("#ffd363", "#FF0000", Math.max(0, blendAmount(e)));
		let stripesColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			stripesColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		ctx.rotate(e.render.angle + Math.PI / 2);

		// stinger/ tail thing
		ctx.strokeStyle = stripesColor;
		ctx.fillStyle = stripesColor;
		ctx.lineWidth = e.render.radius / 6;
		ctx.beginPath();
		ctx.moveTo(0, e.render.radius * 1.55);
		ctx.lineTo(-e.render.radius * .31, e.render.radius * .4);
		ctx.lineTo(e.render.radius * .31, e.render.radius * .4);
		ctx.lineTo(0, e.render.radius * 1.55);
		ctx.stroke();
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = bodyColor;
		//ctx.save();

		// body fill
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.fill();

		//ctx.clip();

		// stripes
		/*
		ctx.fillStyle = stripesColor;
		ctx.fillRect(-e.render.radius, -e.render.radius * 2 / 3, e.render.radius * 2, e.render.radius / 3);
		ctx.fillRect(-e.render.radius, 0, e.render.radius * 2, e.render.radius / 3);
		ctx.fillRect(-e.render.radius, e.render.radius * 2 / 3, e.render.radius * 2, e.render.radius / 3);
		*/
		ctx.fillStyle = stripesColor;
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 0.45, -e.render.radius * 2 / 3);
		ctx.lineTo(-e.render.radius * 0.55, -e.render.radius * 1 / 3);
		ctx.lineTo(e.render.radius * 0.55, -e.render.radius * 1 / 3);
		ctx.lineTo(e.render.radius * 0.45, -e.render.radius * 2 / 3);
		ctx.fill();
		ctx.fillRect(-e.render.radius * 0.65, 0, e.render.radius * 2 * 0.65, e.render.radius / 3);
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 0.45, e.render.radius * 2 / 3);
		ctx.lineTo(-e.render.radius * 0.15, e.render.radius);
		ctx.lineTo(e.render.radius * 0.15, e.render.radius);
		ctx.lineTo(e.render.radius * 0.45, e.render.radius * 2 / 3);
		ctx.fill();

		//ctx.restore();

		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = '#FFFFFF';
		}
		ctx.lineWidth = e.render.radius * .15;

		// body stroke
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();

		// antennae
		ctx.fillStyle = stripesColor;
		ctx.strokeStyle = stripesColor;
		ctx.lineWidth = e.render.radius / 10;
		ctx.beginPath();
		ctx.moveTo(e.render.radius * .16, -e.render.radius * .85);
		ctx.quadraticCurveTo(e.render.radius * .18, -e.render.radius * 1.36, e.render.radius * .49, -e.render.radius * 1.68);
		ctx.quadraticCurveTo(e.render.radius * .3, -e.render.radius * 1.26, e.render.radius * .16, -e.render.radius * .85);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(-e.render.radius * .16, -e.render.radius * .85);
		ctx.quadraticCurveTo(-e.render.radius * .18, -e.render.radius * 1.36, -e.render.radius * .49, -e.render.radius * 1.68);
		ctx.quadraticCurveTo(-e.render.radius * .3, -e.render.radius * 1.26, -e.render.radius * .16, -e.render.radius * .85);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	Grasshopper: (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		ctx.rotate(e.render.angle);

		let bodyColor = blendColor("#5cb85c", "#FF0000", Math.max(0, blendAmount(e)));
		let edgeColor = blendColor("#3d7a3d", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			edgeColor = "#FFFFFF";
		}

		ctx.strokeStyle = "#333333";
		ctx.lineWidth = e.render.radius / 6;

		ctx.rotate(Math.PI / 2); // rotate frame so legs anchor naturally

		// === BACK LEGS ==
		ctx.strokeStyle = "#333333";
		ctx.lineWidth = e.render.radius / 6;

		for (let i = 4; i--; i > 0) {
			let rotateAmount = i * 0.52359 - 0.52359 - 0.26179938 + Math.cos(e.render.time / 17 + i) * 0.2; //i * Math.PI/6 - Math.PI/6 + Math.PI/12 + Math.cos(e.time/75 + i/2)*0.4;
			ctx.rotate(rotateAmount);
			ctx.beginPath();
			ctx.moveTo(-e.render.radius * 1, 0);
			ctx.quadraticCurveTo(-e.render.radius, e.render.radius * 1 / 6, 0, 0);
			ctx.quadraticCurveTo(e.render.radius, -e.render.radius * 1 / 6, e.render.radius * 1, 0);
			ctx.stroke();
			ctx.rotate(-rotateAmount);
			ctx.closePath();
		}

		ctx.rotate(-Math.PI / 2); // reset rotation

		// === ANTENNAE ===
		ctx.strokeStyle = "#333333";
		ctx.lineWidth = e.render.radius / 12;
		for (let i = 0; i < 2; i++) {
			let side = i === 0 ? 1 : -1;
			ctx.beginPath();
			ctx.moveTo(e.render.radius * 0.9, side * e.render.radius * 0.4);
			ctx.quadraticCurveTo(
				e.render.radius * 1.6, side * e.render.radius * 0.8 + Math.sin(e.render.time/20)*5,
				e.render.radius * 2.2, side * e.render.radius * 0.2 + Math.cos(e.render.time/25)*5
			);
			ctx.stroke();
			ctx.closePath();
		}

		// === MAIN BODY ===
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = edgeColor;
		ctx.lineJoin = "round";
		ctx.lineWidth = e.render.radius * 0.18;

		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 1.1, e.render.radius * 0.7, 0, 0, Math.PI*2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// === HEAD ===
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.arc(e.render.radius * 0.9, 0, e.render.radius * 0.4, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// === EYES ===
		ctx.fillStyle = "#000000";
		for (let i = 0; i < 2; i++) {
			let side = i === 0 ? 1 : -1;
			ctx.beginPath();
			ctx.arc(e.render.radius * 1.05, side * e.render.radius * 0.2, e.render.radius * 0.12, 0, Math.PI*2);
			ctx.fill();
			ctx.closePath();
		}

		// === WINGS === (transparent, fluttering)

		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.05;
		ctx.fillStyle = "#ffffff";
		ctx.globalAlpha *= 0.3

		ctx.beginPath();

		ctx.rotate(wingAngle);
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * -0.54, e.render.radius * 0.79, e.render.radius * 0.42, 15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(-wingAngle)

		ctx.rotate(-wingAngle)
		ctx.ellipse(e.render.radius * -0.98, e.render.radius * 0.54, e.render.radius * 0.79, e.render.radius * 0.42, -15 * ((Math.PI * 2) / 360), 0, Math.PI * 2)
		ctx.rotate(wingAngle)

		ctx.fill();
		ctx.closePath();

		ctx.globalAlpha *= 1 / 0.3

		// restore rotation
		ctx.rotate(-e.render.angle);


		if (e.jumpTo != undefined){
			e.jumpToTime += dt;
			let alpha = Math.min(e.jumpToTime / 3000, 1);
			let oldAlpha = ctx.globalAlpha;
			ctx.globalAlpha = alpha;

			ctx.beginPath();
			ctx.fillStyle = "#1e7830";
			ctx.arc(e.jumpTo[0] - e.render.x, e.jumpTo[1] - e.render.y, (Math.min(e.jumpToTime / 2000, 0.5) + 0.5) * e.render.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.globalAlpha = oldAlpha;

			if (e.jumpToTime > 2500){
				// Something went wrong
				e.jumpTo = undefined;
				e.jumpToTime = 0;
			}
		}
	},
	Stickbug: (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		if (e.angerTime != undefined){
			e.angerTime += dt;
		}

		ctx.rotate(e.render.angle);

		// color
		let bodyColor = blendColor("#89b52f", "#FF0000", Math.max(0, blendAmount(e)));
		let edgeColor = blendColor("#6e9124", "#FF0000", Math.max(0, blendAmount(e)));
		let legColor = blendColor("#375e24", "#FF0000", Math.max(0, blendAmount(e)))

		if (!e.anger) e.anger = 1;

		if (e.anger != 1){
			let darkness = Math.pow(1 - (1 / (e.anger * 0.8 + 0.6)), 1.6);
			bodyColor = blendColor(bodyColor, "#000000", darkness)
			edgeColor = blendColor(bodyColor, "#000000", darkness)
			legColor = blendColor(bodyColor, "#000000", darkness)
		}
		
		
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			edgeColor = "#FFFFFF";
		}

		// leg	
		ctx.strokeStyle = legColor;
		ctx.lineWidth = e.render.radius / 8;

		ctx.rotate(Math.PI / 2);

		for (let i = 6; i--; i > 0) {
			let rotateAmount = i * 0.52359 - 0.52359 - 0.26179938 + Math.cos(e.render.time / 52 + i) * 0.2; //i * Math.PI/6 - Math.PI/6 + Math.PI/12 + Math.cos(e.time/75 + i/2)*0.4;
			ctx.rotate(rotateAmount);
			ctx.beginPath();
			ctx.moveTo(-e.render.radius * 2.2, 0);
			ctx.quadraticCurveTo(-e.render.radius, e.render.radius * 1 / 6, 0, 0);
			ctx.quadraticCurveTo(e.render.radius, -e.render.radius * 1 / 6, e.render.radius * 2.2, 0);
			ctx.stroke();
			ctx.rotate(-rotateAmount);
			ctx.closePath();
		}

		ctx.rotate(-Math.PI / 2);

		// antennae
		ctx.strokeStyle = "#333333";
		ctx.lineWidth = e.render.radius / 14;
		for (let i = 0; i < 2; i++) {
			let side = i === 0 ? 1 : -1;
			ctx.beginPath();
			ctx.moveTo(e.render.radius * 0.9, side * e.render.radius * 0.1);
			ctx.quadraticCurveTo(
				e.render.radius * 1.8, side * e.render.radius * 0.5 + Math.sin(e.render.time/40)*4,
				e.render.radius * 2.6, side * e.render.radius * 0.2 + Math.cos(e.render.time/50)*4
			);
			ctx.stroke();
			ctx.closePath();
		}

		// body
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = edgeColor;
		ctx.lineJoin = "round";
		ctx.lineWidth = e.render.radius * 0.1;

		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 1.8, e.render.radius * 0.25, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// head
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.ellipse(e.render.radius * 1.5, 0, e.render.radius * 0.35, e.render.radius * 0.25, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// eyes
		ctx.fillStyle = "#000000";
		for (let i = 0; i < 2; i++) {
			let side = i === 0 ? 1 : -1;
			ctx.beginPath();
			ctx.arc(e.render.radius * 1.65, side * e.render.radius * 0.12, e.render.radius * 0.07, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}

		ctx.rotate(-e.render.angle);
	},
	Bee: (e) => {
		let bodyColor = blendColor("#ffe763", "#FF0000", Math.max(0, blendAmount(e)));
		let stripesColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			stripesColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		ctx.rotate(e.render.angle + Math.PI / 2);

		// stinger/ tail thing
		ctx.strokeStyle = stripesColor;
		ctx.fillStyle = stripesColor;
		ctx.lineWidth = e.render.radius / 6;
		ctx.beginPath();
		ctx.moveTo(0, e.render.radius * 1.23);
		ctx.lineTo(-e.render.radius * .41, e.render.radius * .65);
		ctx.lineTo(e.render.radius * .41, e.render.radius * .65);
		ctx.lineTo(0, e.render.radius * 1.23);
		ctx.stroke();
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = bodyColor;
		//ctx.save();

		// body fill
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.fill();

		//ctx.clip();

		// stripes
		/*
		ctx.fillStyle = stripesColor;
		ctx.fillRect(-e.render.radius, -e.render.radius * 2 / 3, e.render.radius * 2, e.render.radius / 3);
		ctx.fillRect(-e.render.radius, 0, e.render.radius * 2, e.render.radius / 3);
		ctx.fillRect(-e.render.radius, e.render.radius * 2 / 3, e.render.radius * 2, e.render.radius / 3);
		*/
		ctx.fillStyle = stripesColor;
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 0.45, -e.render.radius * 2 / 3);
		ctx.lineTo(-e.render.radius * 0.55, -e.render.radius * 1 / 3);
		ctx.lineTo(e.render.radius * 0.55, -e.render.radius * 1 / 3);
		ctx.lineTo(e.render.radius * 0.45, -e.render.radius * 2 / 3);
		ctx.fill();
		ctx.fillRect(-e.render.radius * 0.65, 0, e.render.radius * 2 * 0.65, e.render.radius / 3);
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 0.45, e.render.radius * 2 / 3);
		ctx.lineTo(-e.render.radius * 0.15, e.render.radius);
		ctx.lineTo(e.render.radius * 0.15, e.render.radius);
		ctx.lineTo(e.render.radius * 0.45, e.render.radius * 2 / 3);
		ctx.fill();

		//ctx.restore();

		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.lineWidth = e.render.radius * .15;

		// body stroke
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();

		// antennae
		ctx.strokeStyle = stripesColor;
		ctx.lineWidth = e.render.radius * .09;

		// antennae
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * .155, -e.render.radius * .81);
		ctx.quadraticCurveTo(-e.render.radius * .23, -e.render.radius * 1.1, -e.render.radius * .5, -e.render.radius * 1.3);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(e.render.radius * .155, -e.render.radius * .81);
		ctx.quadraticCurveTo(e.render.radius * .23, -e.render.radius * 1.1, e.render.radius * .5, -e.render.radius * 1.3);
		ctx.stroke();
		ctx.closePath();

		// little bulbs at the ends
		ctx.fillStyle = ctx.strokeStyle;
		ctx.beginPath();
		ctx.arc(-e.render.radius * .5, -e.render.radius * 1.3, e.render.radius * .165, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * .5, -e.render.radius * 1.3, e.render.radius * .165, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	"Desert Moth": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#ccb639', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#9c8b2c', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}



		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(e.render.angle);


		//Wings
		ctx.globalAlpha *= 0.4;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.5;
		ctx.translate(e.render.radius * -0.2, 0);
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.2);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 0.95, e.render.radius * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.2))
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.2);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 0.95, e.render.radius * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.2))
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * 0.2, 0);
		ctx.globalAlpha *= (1 / 0.4);


		ctx.rotate(-e.render.angle);



		// antennae
		ctx.strokeStyle = "black";
		ctx.lineWidth = e.render.radius * .09;

		ctx.rotate(e.render.angle + Math.PI / 2);

		// antennae
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * .155, -e.render.radius * .81);
		ctx.quadraticCurveTo(-e.render.radius * .23, -e.render.radius * 1.1, -e.render.radius * .5, -e.render.radius * 1.3);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(e.render.radius * .155, -e.render.radius * .81);
		ctx.quadraticCurveTo(e.render.radius * .23, -e.render.radius * 1.1, e.render.radius * .5, -e.render.radius * 1.3);
		ctx.stroke();
		ctx.closePath();

		// little bulbs at the ends
		ctx.fillStyle = ctx.strokeStyle;
		ctx.beginPath();
		ctx.arc(-e.render.radius * .5, -e.render.radius * 1.3, e.render.radius * .165, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * .5, -e.render.radius * 1.3, e.render.radius * .165, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	"Swampy Moth": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#487332', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#3b5e29', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}



		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(e.render.angle);


		//Wings
		ctx.globalAlpha *= 0.4;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.5;
		ctx.translate(e.render.radius * -0.2, 0);
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.2);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 0.95, e.render.radius * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.2))
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.2);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 0.95, e.render.radius * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.2))
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * 0.2, 0);
		ctx.globalAlpha *= (1 / 0.4);


		ctx.rotate(-e.render.angle);



		// antennae
		ctx.strokeStyle = "black";
		ctx.lineWidth = e.render.radius * .09;

		ctx.rotate(e.render.angle + Math.PI / 2);

		// antennae
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * .155, -e.render.radius * .81);
		ctx.quadraticCurveTo(-e.render.radius * .23, -e.render.radius * 1.1, -e.render.radius * .5, -e.render.radius * 1.3);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(e.render.radius * .155, -e.render.radius * .81);
		ctx.quadraticCurveTo(e.render.radius * .23, -e.render.radius * 1.1, e.render.radius * .5, -e.render.radius * 1.3);
		ctx.stroke();
		ctx.closePath();

		// little bulbs at the ends
		ctx.fillStyle = ctx.strokeStyle;
		ctx.beginPath();
		ctx.arc(-e.render.radius * .5, -e.render.radius * 1.3, e.render.radius * .165, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * .5, -e.render.radius * 1.3, e.render.radius * .165, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	"Firefly": (e) => {

let savedAlpha = ctx.globalAlpha;
		if (e.lastShocked == 0) {
			e.renderShock = [];
			for (let i = 0; i < e.shock.length; i++) {
				let value = e.shock[i];
				if (i == 0) {
					e.renderShock.push(value);
				} else {
					let average1 = {};
					average1.x = value.x * 1 / 3 + e.shock[i - 1].x * 2 / 3;
					average1.y = value.y * 1 / 3 + e.shock[i - 1].y * 2 / 3;
					let average2 = {};
					average2.x = value.x * 2 / 3 + e.shock[i - 1].x * 1 / 3;
					average2.y = value.y * 2 / 3 + e.shock[i - 1].y * 1 / 3;
					let diff = Math.sqrt((value.y - e.shock[i - 1].y) ** 2 + (value.x - e.shock[i - 1].x) ** 2)
					average1.x += (Math.random() * diff / 5 - diff / 10)
					average1.y += (Math.random() * diff / 5 - diff / 10)
					e.renderShock.push(average1);
					e.renderShock.push(average2);
					e.renderShock.push(value);
				}
			}
		}
		e.lastShocked += dt;

		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#555555', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#454545', "#FF0000", Math.max(0, blendAmount(e)));
		let bulb = blendColor('#f9ec77', "#FF0000", Math.max(0, blendAmount(e)));
		let bulbOutline = blendColor('#cabf60', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
			bulb = "#ffffff"; //"#FFFFFF";
			bulbOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.lineWidth = e.render.radius / 3;


		ctx.rotate(e.render.angle);

		ctx.fillStyle = bulb;
		ctx.strokeStyle = bulbOutline;

		ctx.beginPath()
		ctx.ellipse(e.render.radius * -0.5, 0, e.render.radius * 0.8, e.render.radius * 0.6, 0, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath()
		ctx.moveTo(e.render.radius * -0.75, e.render.radius * -0.45)
		ctx.lineTo(e.render.radius * -0.75, e.render.radius * 0.45)
		ctx.stroke();
		ctx.closePath();

		//Wings
		ctx.globalAlpha *= 0.4;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.5;

		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.12, e.render.radius * 0.12);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.5, 0, e.render.radius * 0.65, e.render.radius * 0.525, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.12), -(e.render.radius * 0.12))
		ctx.rotate(-wingAngle);

		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.12, -e.render.radius * 0.12);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.5, 0, e.render.radius * 0.65, e.render.radius * 0.525, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.12), (e.render.radius * 0.12))
		ctx.rotate(wingAngle);

		ctx.globalAlpha /= 0.4;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;

		ctx.beginPath()
		ctx.arc(e.render.radius * 0.34, 0, e.render.radius * 0.575, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);

		if (e.lastShocked < 900) {
			ctx.globalAlpha = (1 - e.lastShocked / 900);
			ctx.strokeStyle = "white";
			ctx.lineWidth = 3;
			if (e.team == "flower"){
				ctx.strokeStyle = "yellow";
				ctx.lineWidth = 6;
			}
			ctx.beginPath();
			for (let i = 0; i < e.renderShock.length; i++) {
				ctx.lineTo(e.renderShock[i].x - e.render.x, e.renderShock[i].y - e.render.y);
			}
			ctx.stroke();
			ctx.closePath();
		}

		ctx.globalAlpha = savedAlpha;
	},
	"Fly": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor('#555555', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyOutline = blendColor('#454545', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyOutline = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyOutline;
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}



		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 9 / 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(e.render.angle);


		//Wings
		ctx.globalAlpha *= 0.4;
		ctx.fillStyle = "white";
		let wingAngle = Math.cos(time / 420 + e.render.time / 70) / 7 - 0.5;
		ctx.translate(e.render.radius * -0.2, 0);
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * -0.1, e.render.radius * 0.2);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 0.95, e.render.radius * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), -(e.render.radius * 0.2))
		ctx.rotate(-wingAngle);
		ctx.rotate(-wingAngle);
		ctx.translate(e.render.radius * -0.1, -e.render.radius * 0.2);
		ctx.beginPath();
		ctx.ellipse(-e.render.radius * 0.7, 0, e.render.radius * 0.95, e.render.radius * 0.5, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.translate(-(e.render.radius * -0.1), (e.render.radius * 0.2))
		ctx.rotate(wingAngle);
		ctx.translate(e.render.radius * 0.2, 0);
		ctx.globalAlpha *= (1 / 0.4);


		ctx.rotate(-e.render.angle);
	},
	Missile: (e) => {
		let bodyColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * Math.sqrt(3));
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(0, -e.render.radius * Math.sqrt(3));
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	BeeMissile: (e) => {
		let bodyColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * Math.sqrt(3) * 0.57);
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(0, -e.render.radius * Math.sqrt(3) * 0.57);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	StarfishMissile: (e) => {
		let bodyColor = blendColor("#aa403f", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * Math.sqrt(3));
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(0, -e.render.radius * Math.sqrt(3));
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	GrasshopperMissile: (e) => {
		let bodyColor = blendColor("#174a25", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * Math.sqrt(3));
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(0, -e.render.radius * Math.sqrt(3));
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	FireMissile: (e) => {
		let bodyColor = blendColor("#882200", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * Math.sqrt(3));
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .48, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(0, -e.render.radius * Math.sqrt(3));
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	UrchinMissile: (e) => {
		let bodyColor = blendColor("#521c18", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'butt';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * 1.6);
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .28, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .28, e.render.radius / 2 * Math.sqrt(3));
		ctx.lineTo(0, -e.render.radius * 1.6);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.lineJoin = 'round';
		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	BossDandelionMissile: (e) => {
		enemyRenderMap["DandelionMissile"](e);
	},
	BossUrchinMissile: (e) => {
		enemyRenderMap["UrchinMissile"](e);
	},	
	BigBossUrchinMissile: (e) => {
		let bodyColor = blendColor("#400825", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}
		ctx.fillStyle = bodyColor;

		ctx.beginPath();
		ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	},
	ScorpionMissile: (e) => {
		let bodyColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * Math.sqrt(3) * 0.6);
		ctx.lineTo(e.render.radius * Math.sqrt(3) * .58, 0);
		ctx.lineTo(-e.render.radius * Math.sqrt(3) * .58, 0);
		ctx.lineTo(0, -e.render.radius * Math.sqrt(3) * 0.6);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		/*
		// hitbox
		 ctx.strokeStyle = 'blue';
		 ctx.lineWidth = 1;
		 ctx.beginPath();
		 ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		 ctx.stroke();
		 ctx.closePath();
		 */

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	LocustMissile: (e) => {
		enemyRenderMap["Missile"](e);
	},
	SplitLocustMissile: (e) => {
		enemyRenderMap["Missile"](e);
	},
	Spider: (e) => {
		e.render.time += e.isMenuEnemy === true ? 2 * (1 + Math.sin(performance.now() / 1000) / 2) : Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;

		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let bodyColor = "#4f412d";
		let legColor = "#403425";
		const is_injured = e.ticksSinceLastDamaged < 166.5;

		// 如果受伤，将颜色向白色偏向
		if (is_injured) {
			bodyColor = shiftToWhite(bodyColor);
			legColor = shiftToWhite(legColor);
		}
		ctx.rotate(e.render.angle + Math.PI);

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that legs dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// legs
		ctx.strokeStyle = legColor;
		ctx.lineWidth = e.render.radius / 4;

		ctx.rotate(Math.PI / 2);

		for (let i = 4; i--; i > 0) {
			let rotateAmount = i * 0.52359 - 0.52359 - 0.26179938 + Math.cos(e.render.time / 52 + i) * 0.2; //i * Math.PI/6 - Math.PI/6 + Math.PI/12 + Math.cos(e.time/75 + i/2)*0.4;
			ctx.rotate(rotateAmount);
			ctx.beginPath();
			ctx.moveTo(-e.render.radius * 2.2, 0);
			ctx.quadraticCurveTo(-e.render.radius, e.render.radius * 1 / 6, 0, 0);
			ctx.quadraticCurveTo(e.render.radius, -e.render.radius * 1 / 6, e.render.radius * 2.2, 0);
			ctx.stroke();
			ctx.rotate(-rotateAmount);
			ctx.closePath();
		}

		ctx.rotate(-Math.PI / 2);

		if (isOpaq === true) {
			ctx.restore();
			ctx.lineWidth = e.render.radius / 4;
		}

		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI);
	},
	Tarantula: (e) => {
		e.render.time += e.isMenuEnemy === true ? 
    2 * (1 + Math.sin(performance.now() / 1000) / 2) : 
    Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * 
    (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;

		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		// Poisonous tarantula color theme: deep black with green/purple highlights
		let baseGreen = "#2bba4f";
		let basePurple = "#6c26ad";

		let bodyColor = blendColor("#4f412d", "#FF0000", Math.max(0, blendAmount(e)));
		let legColor = blendColor("#403425", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			legColor = "#FFFFFF";
		}

		ctx.rotate(e.render.angle + Math.PI);

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq) {
				ctx.save();
				let p = new Path2D();
				p.rect(-10000, -10000, 20000, 20000);
				p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
				ctx.clip(p, "evenodd");
		}

		// Legs – more angular, sharp movement
		ctx.lineWidth = e.render.radius / 4;
		ctx.rotate(Math.PI / 2);

		for (let i = 4; i--; i > 0) {
				let rotateAmount = i * 0.6 - 0.6 + Math.sin(e.render.time / 40 + i) * 0.25;
				ctx.rotate(rotateAmount);

				// Outer toxic accent
				ctx.strokeStyle = baseGreen;
				ctx.beginPath();
				ctx.moveTo(-e.render.radius * 2.5, 0);
				ctx.quadraticCurveTo(-e.render.radius * 1.3, e.render.radius * 0.25, 0, 0);
				ctx.quadraticCurveTo(e.render.radius * 1.3, -e.render.radius * 0.25, e.render.radius * 2.5, 0);
				ctx.stroke();
				ctx.closePath();

				// Inner dark leg core
				ctx.strokeStyle = legColor;
				ctx.beginPath();
				ctx.moveTo(-e.render.radius * 2.2, 0);
				ctx.quadraticCurveTo(-e.render.radius, e.render.radius * 0.2, 0, 0);
				ctx.quadraticCurveTo(e.render.radius, -e.render.radius * 0.2, e.render.radius * 2.2, 0);
				ctx.stroke();
				ctx.closePath();

				ctx.rotate(-rotateAmount);
		}

		ctx.rotate(-Math.PI / 2);

		if (isOpaq) {
				ctx.restore();
				ctx.lineWidth = e.render.radius / 4;
		}

		// Main body
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);

		// Toxic accent ring (thin outline in green)
		ctx.strokeStyle = basePurple;
		ctx.lineWidth = e.render.radius / 10;
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(0, 0, Math.max(e.render.radius - e.render.radius / 10, 0), 0, 2 * Math.PI);
		ctx.fillStyle = bodyColor;
		ctx.fill();
		ctx.strokeStyle = legColor;
		ctx.lineWidth = e.render.radius / 10;
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI);

	},
	Centipede: (e) => {
		let bodyColor = blendColor("#8ac255", "#FF0000", Math.max(0, blendAmount(e)));
		let sideColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			legColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle);

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that legs dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// side
		ctx.fillStyle = sideColor;
		ctx.beginPath();
		ctx.arc(0, e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(0, -e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();

		if (isOpaq === true) {
			ctx.restore();
		}

		ctx.lineWidth = e.render.radius * .2;
		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		if (e.isHead === true) {
			ctx.strokeStyle = sideColor;
			ctx.lineWidth = e.render.radius * .075;

			// antennae
			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, -e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, -e.render.radius * .33, e.render.radius * 1.57, -e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, e.render.radius * .33, e.render.radius * 1.57, e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			// little bulbs at the ends
			ctx.fillStyle = ctx.strokeStyle;
			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, -e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}

		ctx.rotate(-e.render.angle);
	},
	"Evil Centipede": (e) => {
		let bodyColor = blendColor("#8f5db0", "#FF0000", Math.max(0, blendAmount(e)));
		let sideColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			legColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle);

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that legs dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// side
		ctx.fillStyle = sideColor;
		ctx.beginPath();
		ctx.arc(0, e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(0, -e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();

		if (isOpaq === true) {
			ctx.restore();
		}

		ctx.lineWidth = e.render.radius * .2;
		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		if (e.isHead === true) {
			ctx.strokeStyle = sideColor;
			ctx.lineWidth = e.render.radius * .075;

			// antennae
			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, -e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, -e.render.radius * .33, e.render.radius * 1.57, -e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, e.render.radius * .33, e.render.radius * 1.57, e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			// little bulbs at the ends
			ctx.fillStyle = ctx.strokeStyle;
			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, -e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}

		ctx.rotate(-e.render.angle);
	},
	"Desert Centipede": (e) => {
		let bodyColor = blendColor("#d3c66d", "#FF0000", Math.max(0, blendAmount(e)));
		let sideColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			legColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle);

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that legs dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// side
		ctx.fillStyle = sideColor;
		ctx.beginPath();
		ctx.arc(0, e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(0, -e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();

		if (isOpaq === true) {
			ctx.restore();
		}

		ctx.lineWidth = e.render.radius * .2;
		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		if (e.isHead === true) {
			ctx.strokeStyle = sideColor;
			ctx.lineWidth = e.render.radius * .075;

			// antennae
			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, -e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, -e.render.radius * .33, e.render.radius * 1.57, -e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, e.render.radius * .33, e.render.radius * 1.57, e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			// little bulbs at the ends
			ctx.fillStyle = ctx.strokeStyle;
			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, -e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}

		ctx.rotate(-e.render.angle);
	},
	
	"Evil Desert Centipede": (e) => {
		let bodyColor = blendColor("#bd6026", "#FF0000", Math.max(0, blendAmount(e)));
		let sideColor = blendColor("#542000", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			legColor = "#FFFFFF";
		}
		ctx.rotate(e.render.angle);

		const isOpaq = ctx.globalAlpha !== 1;

		if (isOpaq === true) {
			// draw head and clip so that legs dont appear insider body
			ctx.save();
			let p = new Path2D();
			p.rect(-10000, -10000, 20000, 20000);
			p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
			ctx.clip(p, "evenodd");
		}

		// side
		ctx.fillStyle = sideColor;
		ctx.beginPath();
		ctx.arc(0, e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(0, -e.render.radius * 0.85, e.render.radius * 0.44, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.stroke();
		ctx.closePath();

		if (isOpaq === true) {
			ctx.restore();
		}

		ctx.lineWidth = e.render.radius * .2;
		// main body
		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		if (e.isHead === true) {
			ctx.strokeStyle = sideColor;
			ctx.lineWidth = e.render.radius * .075;

			// antennae
			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, -e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, -e.render.radius * .33, e.render.radius * 1.57, -e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(e.render.radius * .71, e.render.radius * .29);
			ctx.quadraticCurveTo(e.render.radius * 1.35, e.render.radius * .33, e.render.radius * 1.57, e.render.radius * .87);
			ctx.stroke();
			ctx.closePath();

			// little bulbs at the ends
			ctx.fillStyle = ctx.strokeStyle;
			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, -e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(e.render.radius * 1.57, e.render.radius * .87, e.render.radius * .132, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
		}

		ctx.rotate(-e.render.angle);
	},
	"Beetle": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		ctx.lineWidth = e.render.radius / 3;

		let bodyColor = blendColor(e.team === "flower" ? "#fbea6f" : '#8f5db0', "#FF0000", Math.max(0, blendAmount(e)));
		let sideColor = blendColor(e.team === "flower" ? "#cfbd53" : '#764b90', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#ffffff"; //"#FFFFFF";
			sideColor = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.rotate(e.render.angle);
		//Front things
		ctx.fillStyle = "#333333";

		ctx.translate(e.render.radius * 0.99, -e.render.radius * 0.37); // NICE WTF BRO FINALLY
		let rotateAngle = Math.cos(e.render.time / 12) / 7.5 + 0.1; // hi FINALLY GOT BEETLE RENDERING DONE OMG BRO I SOLD MY SOUL FOR THIS
		ctx.rotate(rotateAngle) // BRO HOW BIG IS THIS FUNCTIOIN WTF idfk bro
		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.66 - 0.99), e.render.radius * (-0.54 + 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.35 - 0.99), e.render.radius * (-0.81 + 0.37), e.render.radius * (1.8 - 0.99), e.render.radius * (-0.47 + 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.92 - 0.99), e.render.radius * (-0.38 + 0.37), e.render.radius * (1.81 - 0.99), e.render.radius * (-0.28 + 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.42 - 0.99), e.render.radius * (-0.37 + 0.37), e.render.radius * (0.74 - 0.99), e.render.radius * (-0.13 + 0.37));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-rotateAngle);
		ctx.translate(-e.render.radius * 0.99, e.render.radius * 0.37);

		ctx.translate(e.render.radius * 0.99, e.render.radius * 0.37);
		ctx.rotate(-rotateAngle)
		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.66 - 0.99), e.render.radius * (0.54 - 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.35 - 0.99), e.render.radius * (0.81 - 0.37), e.render.radius * (1.8 - 0.99), e.render.radius * (0.47 - 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.92 - 0.99), e.render.radius * (0.38 - 0.37), e.render.radius * (1.81 - 0.99), e.render.radius * (0.28 - 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.42 - 0.99), e.render.radius * (0.37 - 0.37), e.render.radius * (0.74 - 0.99), e.render.radius * (0.13 - 0.37));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(rotateAngle);
		ctx.translate(-e.render.radius * 0.99, -e.render.radius * 0.37);

		//Body
		ctx.lineJoin = "round";
		ctx.lineCap = "round"
		ctx.lineWidth = e.render.radius * 0.19310344827586207;
		ctx.strokeStyle = sideColor;
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -1.01, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * -1.1, e.render.radius * -1.01, e.render.radius * 1.1, e.render.radius * -1.01, e.render.radius * 1, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * 1.1, e.render.radius * 1.01, e.render.radius * -1.1, e.render.radius * 1.01, e.render.radius * -1.01, e.render.radius * 0);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Middle Line
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.51, e.render.radius * 0);
		ctx.quadraticCurveTo(e.render.radius * 0.01, e.render.radius * -0.06, e.render.radius * 0.5, e.render.radius * 0);
		ctx.stroke();
		ctx.closePath();

		//Dots
		ctx.fillStyle = sideColor;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.43, e.render.radius * -0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * -0.01, e.render.radius * -0.38, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * 0.43, e.render.radius * -0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2, 18, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = sideColor;
		ctx.arc(e.render.radius * -0.43, e.render.radius * 0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * -0.01, e.render.radius * 0.38, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * 0.43, e.render.radius * 0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2, 18, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-e.render.angle);
	},
	"Dark Beetle": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		ctx.lineWidth = e.render.radius / 3;

		let bodyColor = blendColor(e.team === "flower" ? "#fbea6f" : '#3c1f5c', "#FF0000", Math.max(0, blendAmount(e)));
		let sideColor = blendColor(e.team === "flower" ? "#cfbd53" : '#2b1742', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#ffffff";
			sideColor = "#ffffff";
		}

		ctx.rotate(e.render.angle);
		//Front things
		ctx.fillStyle = "#333333";

		ctx.translate(e.render.radius * 0.99, -e.render.radius * 0.37);
		let rotateAngle = Math.cos(e.render.time / 12) / 7.5 + 0.1;
		ctx.rotate(rotateAngle)
		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.66 - 0.99), e.render.radius * (-0.54 + 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.35 - 0.99), e.render.radius * (-0.81 + 0.37), e.render.radius * (1.8 - 0.99), e.render.radius * (-0.47 + 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.92 - 0.99), e.render.radius * (-0.38 + 0.37), e.render.radius * (1.81 - 0.99), e.render.radius * (-0.28 + 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.42 - 0.99), e.render.radius * (-0.37 + 0.37), e.render.radius * (0.74 - 0.99), e.render.radius * (-0.13 + 0.37));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-rotateAngle);
		ctx.translate(-e.render.radius * 0.99, e.render.radius * 0.37);

		ctx.translate(e.render.radius * 0.99, e.render.radius * 0.37);
		ctx.rotate(-rotateAngle)
		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.66 - 0.99), e.render.radius * (0.54 - 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.35 - 0.99), e.render.radius * (0.81 - 0.37), e.render.radius * (1.8 - 0.99), e.render.radius * (0.47 - 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.92 - 0.99), e.render.radius * (0.38 - 0.37), e.render.radius * (1.81 - 0.99), e.render.radius * (0.28 - 0.37));
		ctx.quadraticCurveTo(e.render.radius * (1.42 - 0.99), e.render.radius * (0.37 - 0.37), e.render.radius * (0.74 - 0.99), e.render.radius * (0.13 - 0.37));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(rotateAngle);
		ctx.translate(-e.render.radius * 0.99, -e.render.radius * 0.37);

		//Body
		ctx.lineJoin = "round";
		ctx.lineCap = "round"
		ctx.lineWidth = e.render.radius * 0.19310344827586207;
		ctx.strokeStyle = sideColor;
		ctx.fillStyle = bodyColor;
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -1.01, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * -1.1, e.render.radius * -1.01, e.render.radius * 1.1, e.render.radius * -1.01, e.render.radius * 1, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * 1.1, e.render.radius * 1.01, e.render.radius * -1.1, e.render.radius * 1.01, e.render.radius * -1.01, e.render.radius * 0);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Middle Line
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.51, e.render.radius * 0);
		ctx.quadraticCurveTo(e.render.radius * 0.01, e.render.radius * -0.06, e.render.radius * 0.5, e.render.radius * 0);
		ctx.stroke();
		ctx.closePath();

		//Dots
		ctx.fillStyle = sideColor;

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.43, e.render.radius * -0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * -0.01, e.render.radius * -0.38, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * 0.43, e.render.radius * -0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2, 18, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = sideColor;
		ctx.arc(e.render.radius * -0.43, e.render.radius * 0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * -0.01, e.render.radius * 0.38, e.render.radius * 0.12413793103448276, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(e.render.radius * 0.43, e.render.radius * 0.3, e.render.radius * 0.12413793103448276, 0, Math.PI * 2, 18, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-e.render.angle);
	},
	"Scorpion": (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;


		let bodyColor = blendColor('#c69a2c', "#FF0000", Math.max(0, blendAmount(e)));
		let edgeColor = blendColor('#9e7d24', "#FF0000", Math.max(0, blendAmount(e)));
		let bodyColor2 = blendColor('#dbab30', "#FF0000", Math.max(0, blendAmount(e)));
		let edgeColor2 = blendColor('#b28b29', "#FF0000", Math.max(0, blendAmount(e)));

		if (checkForFirstFrame(e)) {
			bodyColor = "#ffffff"; //"#FFFFFF";
			edgeColor = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
			bodyColor2 = "#ffffff"; //"#FFFFFF";
			edgeColor2 = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);

		}

		ctx.rotate(e.render.angle);
		//Legs
		ctx.strokeStyle = "#333333";
		ctx.lineWidth = e.render.radius / 7;

		ctx.rotate(Math.PI / 2);

		for (let i = 4; i--; i > 0) {
			let rotateAmount = i * 0.52359 - 0.52359 - 0.26179938 + Math.cos(e.render.time / 17 + i) * 0.2; //i * Math.PI/6 - Math.PI/6 + Math.PI/12 + Math.cos(e.time/75 + i/2)*0.4;
			ctx.rotate(rotateAmount);
			ctx.beginPath();
			ctx.moveTo(-e.render.radius * 1, 0);
			ctx.quadraticCurveTo(-e.render.radius, e.render.radius * 1 / 6, 0, 0);
			ctx.quadraticCurveTo(e.render.radius, -e.render.radius * 1 / 6, e.render.radius * 1, 0);
			ctx.stroke();
			ctx.rotate(-rotateAmount);
			ctx.closePath();
		}

		ctx.rotate(-Math.PI / 2);

		//Pincers
		ctx.fillStyle = "#333333";

		ctx.translate(e.render.radius * 0.79, e.render.radius * -0.48);

		let rotateAngle = Math.cos(e.render.time / 10) / 7 + 0.1;
		ctx.rotate(rotateAngle);
		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.79 - 0.79), e.render.radius * (-0.48 + 0.48));
		ctx.quadraticCurveTo(e.render.radius * (1.49 - 0.79), e.render.radius * (-0.32 + 0.48), e.render.radius * (1.43 - 0.79), e.render.radius * (-0.26 + 0.48));
		ctx.quadraticCurveTo(e.render.radius * (1.43 - 0.79), e.render.radius * (-0.13 + 0.48), e.render.radius * (0.76 - 0.79), e.render.radius * (-0.28 + 0.48));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-rotateAngle);
		ctx.translate(-e.render.radius * 0.79, -e.render.radius * -0.48);


		ctx.translate(e.render.radius * 0.79, -e.render.radius * -0.48);

		ctx.rotate(-rotateAngle);
		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.79 - 0.79), e.render.radius * (0.48 - 0.48));
		ctx.quadraticCurveTo(e.render.radius * (1.49 - 0.79), e.render.radius * (0.32 - 0.48), e.render.radius * (1.43 - 0.79), e.render.radius * (0.26 - 0.48));
		ctx.quadraticCurveTo(e.render.radius * (1.43 - 0.79), e.render.radius * (0.13 - 0.48), e.render.radius * (0.76 - 0.79), e.render.radius * (0.28 - 0.48));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(rotateAngle);
		ctx.translate(-e.render.radius * 0.79, e.render.radius * -0.48);

		//Main Body
		ctx.lineJoin = "round";
		ctx.lineCap = "round"
		ctx.lineWidth = e.render.radius * 0.19310344827586207;
		ctx.strokeStyle = edgeColor;
		ctx.fillStyle = bodyColor;

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.97, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * -1.1, e.render.radius * -1.27, e.render.radius * 1.01, e.render.radius * -0.75, e.render.radius * 1.01, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * 1.01, e.render.radius * 0.75, e.render.radius * -1.1, e.render.radius * 1.27, e.render.radius * -0.97, e.render.radius * 0);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Main Body Patterns
		ctx.lineWidth = e.render.radius * 0.16551724137931034;
		ctx.beginPath();
		ctx.lineTo(e.render.radius * 0.55, e.render.radius * -0.3);
		ctx.quadraticCurveTo(e.render.radius * 0.66, e.render.radius * 0, e.render.radius * 0.55, e.render.radius * 0.3);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.lineTo(e.render.radius * 0.17, e.render.radius * -0.46);
		ctx.quadraticCurveTo(e.render.radius * 0.26, e.render.radius * 0, e.render.radius * 0.17, e.render.radius * 0.46);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.19, e.render.radius * -0.46);
		ctx.quadraticCurveTo(e.render.radius * -0.28, e.render.radius * 0, e.render.radius * -0.19, e.render.radius * 0.46);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.56, e.render.radius * -0.39);
		ctx.quadraticCurveTo(e.render.radius * -0.72, e.render.radius * 0, e.render.radius * -0.56, e.render.radius * 0.39);
		ctx.stroke();
		ctx.closePath();


		//Inner Body
		ctx.fillStyle = bodyColor2;
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -1.23, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * -1.22, e.render.radius * -0.63, e.render.radius * -0.34, e.render.radius * -0.27, e.render.radius * -0.34, e.render.radius * 0);
		ctx.bezierCurveTo(e.render.radius * -0.34, e.render.radius * 0.27, e.render.radius * -1.22, e.render.radius * 0.63, e.render.radius * -1.23, e.render.radius * 0);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		//Inner Body Patterns
		ctx.strokeStyle = edgeColor2;
		ctx.lineWidth = e.render.radius * 0.08275862068965517;
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.92, e.render.radius * -0.13);
		ctx.quadraticCurveTo(e.render.radius * -1, e.render.radius * 0, e.render.radius * -0.92, e.render.radius * 0.13);
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.66, e.render.radius * -0.1);
		ctx.quadraticCurveTo(e.render.radius * -0.7, e.render.radius * 0, e.render.radius * -0.66, e.render.radius * 0.1);
		ctx.stroke();
		ctx.closePath();

		//Stinger thingy
		let stingerColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			stingerColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(+Math.PI / 2);

		ctx.beginPath();
		ctx.fillStyle = stingerColor;
		ctx.strokeStyle = stingerColor;
		ctx.lineWidth = e.render.radius / 6.5;

		ctx.moveTo(0, e.render.radius * 0.9 * 0.2);
		ctx.lineTo(e.render.radius * 0.2 * .9, e.render.radius * 2 * 0.2);
		ctx.lineTo(-e.render.radius * 0.2 * .9, e.render.radius * 2 * 0.2);
		ctx.lineTo(0, e.render.radius * 0.9 * 0.2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-Math.PI / 2);

		ctx.rotate(-e.render.angle);
	},
	"Sandstorm": (e) => {
			let inner = blendColor(e.team === 'flower' ? "#cfbb50" : "#d6ba36", "#FF0000", Math.max(0, blendAmount(e)));
            let middle = blendColor(e.team === 'flower' ? "#e6d059" : "#dfc85c", "#FF0000", Math.max(0, blendAmount(e)));
            let outer = blendColor(e.team === 'flower' ? "#ffe763" : "#ebda8e", "#FF0000", Math.max(0, blendAmount(e)));

            if (checkForFirstFrame(e)) {
                inner = "#ffffff"; //"#FFFFFF";
                outer = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
                middle = "#ffffff";
            }

            if (e.startRotation === undefined) {
                e.startRotation = 2 * Math.PI * Math.random();
            }
            e.renderRotation = performance.now()/200 + e.startRotation;
            
			ctx.rotate(e.renderRotation);

            ctx.fillStyle = outer;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = e.render.radius * 0.2
            ctx.beginPath();
            for (let i = 7; i--; i > 0) {
                ctx.lineTo(e.render.radius * Math.cos(i * Math.PI / 3), e.render.radius * Math.sin(i * Math.PI / 3));
            }
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
			ctx.rotate(-e.renderRotation);
			
			ctx.rotate(-e.renderRotation);
            ctx.fillStyle = middle;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.beginPath();
            for (let i = 7; i--; i > 0) {
                ctx.lineTo(e.render.radius * Math.cos(i * Math.PI / 3) * 2 / 3, e.render.radius * Math.sin(i * Math.PI / 3) * 2 / 3);
            }
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.rotate(e.renderRotation);

            ctx.rotate(e.renderRotation * 0.5);
            ctx.fillStyle = inner;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.beginPath();
            for (let i = 7; i--; i > 0) {
                ctx.lineTo(e.render.radius * Math.cos(i * Math.PI / 3) * 1 / 3.25, e.render.radius * Math.sin(i * Math.PI / 3) * 1 / 3.25);
            }
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.rotate(-e.renderRotation * 0.5);
	},
	Whirlpool: (e) => {
			let inner = blendColor(e.team === 'flower' ? "#cfbb50" : "#23334b", "#FF0000", Math.max(0, blendAmount(e)));
            let middle = blendColor(e.team === 'flower' ? "#e6d059" : "#2b3f5c", "#FF0000", Math.max(0, blendAmount(e)));
            let outer = blendColor(e.team === 'flower' ? "#ffe763" : "#354e71", "#FF0000", Math.max(0, blendAmount(e)));

            if (checkForFirstFrame(e)) {
                inner = "#ffffff"; //"#FFFFFF";
                outer = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
                middle = "#ffffff";
            }

		if (e.startRotation === undefined) {
			e.startRotation = 2 * Math.PI * Math.random();
		}
		e.renderRotation = performance.now() / 175 + e.startRotation;
		ctx.rotate(e.renderRotation);

		ctx.fillStyle = outer;
		ctx.strokeStyle = ctx.fillStyle;
		ctx.lineWidth = e.render.radius * 0.2
		ctx.beginPath();
		for (let i = 10; i--; i > 0) {
			ctx.lineTo(e.render.radius * Math.cos(i * Math.PI / 4.5), e.render.radius * Math.sin(i * Math.PI / 4.5));
		}
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.renderRotation);

		ctx.rotate(e.renderRotation * 1.1);

		ctx.fillStyle = middle;
		ctx.strokeStyle = ctx.fillStyle;
		ctx.beginPath();
		for (let i = 10; i--; i > 0) {
			ctx.lineTo(e.render.radius * Math.cos(i * Math.PI / 4.5) * 2 / 3, e.render.radius * Math.sin(i * Math.PI / 4.5) * 2 / 3);
		}
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.renderRotation * 1.1);

		ctx.rotate(e.renderRotation * 1.2);

		ctx.fillStyle = inner;
		ctx.strokeStyle = ctx.fillStyle;
		ctx.beginPath();
		for (let i = 10; i--; i > 0) {
			ctx.lineTo(e.render.radius * Math.cos(i * Math.PI / 4.5) * 1 / 3.25, e.render.radius * Math.sin(i * Math.PI / 4.5) * 1 / 3.25);
		}
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.renderRotation * 1.2);
	},
	Tree: (e) => {
		// Outer 7-point star (dark green)
		let a = blendColor('#257831', '#FF0000', blendAmount(e));
		let b = blendColor('#1e6228', '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) a = "#FFFFFF";
		if (checkForFirstFrame(e)) b = "#FFFFFF";

		let c = blendColor('#258031', '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) c = "#FFFFFF";

		let sides = 7
		let angle = Math.PI*2/sides

		for (let j = 0; j < e.data.length; j += 2) {
			ctx.translate(Math.cos(e.data[j]) * e.render.radius * 0.8, Math.sin(e.data[j]) * e.render.radius * 0.8)

			ctx.fillStyle = a
			ctx.strokeStyle = b
			ctx.lineWidth = e.render.radius * 0.2;

			ctx.beginPath()
			for (let i = 0; i <= sides; i++) {
				ctx.lineTo(Math.cos(i * angle) * e.render.radius * e.data[j + 1], Math.sin(i * angle) * e.render.radius * e.data[j + 1])
				ctx.lineTo(Math.cos((0.5 + i) * angle) * e.render.radius * 0.72 * e.data[j + 1], Math.sin((0.5 + i) * angle) * e.render.radius * 0.72 * e.data[j + 1])
			}
			ctx.closePath()
			ctx.fill()
			ctx.stroke()

			ctx.fillStyle = c
			ctx.strokeStyle = c
			ctx.lineWidth = e.render.radius * 0.05;

			ctx.beginPath()
			for (let i = 0; i <= sides; i++) {
				ctx.lineTo(Math.cos(i * angle) * e.render.radius * 0.45 * e.data[j + 1], Math.sin(i * angle) * e.render.radius * 0.45 * e.data[j + 1])
				ctx.lineTo(Math.cos((0.5 + i) * angle) * e.render.radius * 0.33 * e.data[j + 1], Math.sin((0.5 + i) * angle) * e.render.radius * 0.33 * e.data[j + 1])
			}
			ctx.closePath()
			ctx.fill()
			ctx.stroke()
			ctx.translate(-Math.cos(e.data[j]) * e.render.radius * 0.8, -Math.sin(e.data[j]) * e.render.radius * 0.8)
		}

		ctx.fillStyle = a
		ctx.strokeStyle = b
		ctx.lineWidth = e.render.radius * 0.2;

		ctx.beginPath()
		for (let i = 0; i <= sides; i++) {
			ctx.lineTo(Math.cos(i * angle) * e.render.radius, Math.sin(i * angle) * e.render.radius)
			ctx.lineTo(Math.cos((0.5 + i) * angle) * e.render.radius * 0.72, Math.sin((0.5 + i) * angle) * e.render.radius * 0.72)
		}
		ctx.closePath()
		ctx.fill()
		ctx.stroke()

		ctx.fillStyle = c
		ctx.strokeStyle = c
		ctx.lineWidth = e.render.radius * 0.05;

		ctx.beginPath()
		for (let i = 0; i <= sides; i++) {
			ctx.lineTo(Math.cos(i * angle) * e.render.radius * 0.45, Math.sin(i * angle) * e.render.radius * 0.45)
			ctx.lineTo(Math.cos((0.5 + i) * angle) * e.render.radius * 0.33, Math.sin((0.5 + i) * angle) * e.render.radius * 0.33)
		}
		ctx.closePath()
		ctx.fill()
		ctx.stroke()
	},
	Root: (e) => {
		ctx.lineWidth = e.radius / 7;
		ctx.fillStyle = blendColor('#8b5529', '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor('#5c3617', '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) {
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "#FFFFFF";
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.radius * 0.25, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		for(let i = 7; i--; i > 0){
			let angle = i * 0.897597901;
			ctx.beginPath();
			ctx.moveTo(Math.cos(angle) * e.radius * 0.25, Math.sin(angle) * e.radius * 0.25);
			ctx.lineTo(Math.cos(angle) * e.radius * 0.6, Math.sin(angle) * e.radius * 0.6);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(Math.cos(angle) * e.radius * 0.6, Math.sin(angle) * e.radius * 0.6);
			ctx.lineTo(Math.cos(angle + 0.3) * e.radius, Math.sin(angle + 0.3) * e.radius);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(Math.cos(angle) * e.radius * 0.6, Math.sin(angle) * e.radius * 0.6);
			ctx.lineTo(Math.cos(angle - 0.3) * e.radius, Math.sin(angle - 0.3) * e.radius);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();


		}

	


	},
	Cactus: (e) => {
		if (e.radius < 66 && e.render.radius < 66) {
			const lastR = e.render.radius;
			const scalar = e.render.radius / 66;
			e.render.radius = 66;
			ctx.scale(scalar, scalar);
			normalEnemyRenderMap.Cactus(e);
			ctx.scale(1 / scalar, 1 / scalar);
			e.render.radius = lastR;
			return;
		}
		if (e.data[2] === true) {
			e.data[1] += 0.03;
		}
		ctx.rotate(e.data[1]);
		if (e.isMenuEnemy === true) {
			ctx.rotate(e.angle);
		}
		ctx.lineWidth = 6.6;

		ctx.strokeStyle = blendColor('#288841', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// ctx.beginPath();
		// ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		// ctx.fill();
		// ctx.stroke();
		// ctx.closePath();
		// const segments = Math.max(10, Math.ceil(e.radius * Math.PI * 2 / 48));
		// const angleIncrement = Math.ceil(Math.PI * 2 / segments * 10000) / 10000;

		// spikes
		ctx.lineJoin = 'bevel';
		for (let i = 0; i < Math.PI * 2; i += e.data[0]) {
			ctx.fillStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));
			if (checkForFirstFrame(e)) {
				ctx.fillStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
			}
			ctx.beginPath();
			ctx.moveTo(Math.cos(i) * (e.render.radius + 12.4), Math.sin(i) * (e.render.radius + 12.4));
			ctx.lineTo(Math.cos(i - .13) * (e.render.radius * 0.8), Math.sin(i - .13) * (e.render.radius * 0.8))
			ctx.lineTo(Math.cos(i + .13) * (e.render.radius * 0.8), Math.sin(i + .13) * (e.render.radius * 0.8))
			ctx.lineTo(Math.cos(i) * (e.render.radius + 12.4), Math.sin(i) * (e.render.radius + 12.4));
			ctx.fill();
			ctx.closePath();
		}
		ctx.lineJoin = 'round';

		ctx.fillStyle = blendColor('#32a953', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
		}

		// green main body
		ctx.beginPath();
		ctx.moveTo(e.render.radius, 0);
		for (let i = 0; i < Math.PI * 2; i += e.data[0]) {
			ctx.quadraticCurveTo(Math.cos(i + e.data[0] / 2) * (e.render.radius * .9 - 7), Math.sin(i + e.data[0] / 2) * (e.render.radius * .9 - 7), Math.cos(i + e.data[0]) * e.render.radius, Math.sin(i + e.data[0]) * e.render.radius);
		}
		// ctx.quadraticCurveTo((e.render.radius - 22), 0, e.render.radius, 0);
		// ctx.lineTo(e.render.radius, 0);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		if (e.isMenuEnemy === true) {
			ctx.rotate(-e.angle);
		}
		ctx.rotate(-e.data[1]);
	},
	Sponge: (e) => {
		if (e.data[0] == 0) {
			ctx.strokeStyle = blendColor('#c1a37d', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.fillStyle = blendColor('#efc99b', "#FF0000", Math.max(0, blendAmount(e)));
		} else if (e.data[0] == 1) {
			ctx.strokeStyle = blendColor('#977d90', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.fillStyle = blendColor('#ad90a3', "#FF0000", Math.max(0, blendAmount(e)));
		} else if (e.data[0] == 2) {
			ctx.strokeStyle = blendColor('#9b81b9', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.fillStyle = blendColor('#b798d1', "#FF0000", Math.max(0, blendAmount(e)));
		} else {
			ctx.strokeStyle = blendColor('#000000', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.fillStyle = `hsl(${Date.now()%360}, 50%, 50%)`
		}
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff";
		}
		ctx.lineWidth = e.render.radius / 6;
		ctx.rotate(e.data[1]);
		ctx.beginPath();
		ctx.moveTo(e.render.radius, 0);
		for (let i = 0; i < Math.PI * 2; i += Math.PI * 2 / 15) {
			ctx.quadraticCurveTo(Math.cos(i) * e.render.radius * 1.2, Math.sin(i) * e.render.radius * 1.2, Math.cos(i + Math.PI * 1 / 15) * e.render.radius * 0.9, Math.sin(i + Math.PI * 1 / 15) * e.render.radius * 0.9);
		}
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = ctx.strokeStyle;
		for (let i = 0; i < Math.PI * 2; i += Math.PI * 2 / 5) {
			ctx.beginPath();
			ctx.arc(Math.cos(i) * e.render.radius * 0.15, Math.sin(i) * e.render.radius * 0.15, e.render.radius * 0.075, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();
			ctx.arc(Math.cos(i) * e.render.radius * 0.35, Math.sin(i) * e.render.radius * 0.35, e.render.radius * 0.115, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();
			ctx.arc(Math.cos(i) * e.render.radius * 0.65, Math.sin(i) * e.render.radius * 0.65, e.render.radius * 0.155, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

		}

		ctx.rotate(-e.data[1]);
	},
	Stinger: (e) => {

		ctx.fillStyle = blendColor('#333333', '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor('#292929', '#FF0000', blendAmount(e));
		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "#FFFFFF";
		}
		ctx.lineWidth = e.radius / 5;
		ctx.lineJoin = 'round';

		// ctx.rotate(p.angle);
		ctx.beginPath();
		ctx.moveTo(e.radius, 0);
		ctx.lineTo(Math.cos(2 / 3 * Math.PI) * e.radius, Math.sin(2 / 3 * Math.PI) * e.radius)// 120 deg
		ctx.lineTo(Math.cos(4 / 3 * Math.PI) * e.radius, Math.sin(4 / 3 * Math.PI) * e.radius)// 240 deg
		ctx.lineTo(e.radius, 0)// back to 0 deg
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	Pearl: (e) => {
		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = blendColor('#fffcd1', '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor('#cfcca9', '#FF0000', blendAmount(e));
		let color3 = blendColor('#ffffff', '#FF0000', blendAmount(e));
		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "#FFFFFF";
				color3 = "#FFFFFF";
		}
		
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI*2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = color3;
		ctx.beginPath();
		ctx.arc(e.render.radius*0.3, -e.render.radius*0.3, e.render.radius*0.3, 0, Math.PI*2);
		ctx.fill();
		ctx.closePath();
	},
	PearlMissile: (e) => {
		ctx.lineWidth = e.render.radius / 5;
		ctx.fillStyle = blendColor('#fffcd1', '#FF0000', blendAmount(e));
		ctx.strokeStyle = blendColor('#cfcca9', '#FF0000', blendAmount(e));
		let color3 = blendColor('#ffffff', '#FF0000', blendAmount(e));
		if(checkForFirstFrame(e)){
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "#FFFFFF";
				color3 = "#FFFFFF";
		}
		
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI*2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = color3;
		ctx.beginPath();
		ctx.arc(e.render.radius*0.3, -e.render.radius*0.3, e.render.radius*0.3, 0, Math.PI*2);
		ctx.fill();
		ctx.closePath();
	},
	
	Shell: (e) => {
		ctx.strokeStyle = blendColor('#ccb26e', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.fillStyle = blendColor('#fcdd85', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff";
		}

		ctx.lineJoin = "round";
		ctx.lineCap = "round"
		ctx.lineWidth = e.radius * 0.1696969696969697;

		ctx.rotate(e.render.angle);

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.52, e.render.radius * -0.34);
		ctx.lineTo(e.render.radius * -0.78, e.render.radius * -0.5);
		ctx.quadraticCurveTo(e.render.radius * -0.61, e.render.radius * 0, e.render.radius * -0.76, e.render.radius * 0.5);
		ctx.lineTo(e.render.radius * -0.52, e.render.radius * 0.34);
		ctx.lineTo(e.render.radius * 0.21, e.render.radius * 0.95);
		ctx.arcTo(e.render.radius * 3.13, e.render.radius * 0, e.render.radius * 0.21, e.render.radius * -0.95, e.radius * 1);
		ctx.lineTo(e.render.radius * -0.52, e.render.radius * -0.34);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.52, e.render.radius * -0.34);
		ctx.arcTo(e.render.radius * -0.87, e.render.radius * 0, e.render.radius * -0.52, e.render.radius * 0.34, e.radius * 0.45454545454545453);
		ctx.stroke();
		ctx.closePath();

		ctx.lineWidth = e.radius * 0.12727272727272726;
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.31, e.render.radius * 0.07);
		ctx.lineTo(e.render.radius * 0.48, e.render.radius * 0.2);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.37, e.render.radius * 0.16);
		ctx.lineTo(e.render.radius * 0.3, e.render.radius * 0.5);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.31, e.render.radius * -0.07);
		ctx.lineTo(e.render.radius * 0.48, e.render.radius * -0.2);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.37, e.render.radius * -0.16);
		ctx.lineTo(e.render.radius * 0.3, e.render.radius * -0.5);
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle);
	},
	Starfish: (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		ctx.rotate(e.render.time / 150);

		ctx.lineWidth = e.render.radius / 6;

		ctx.strokeStyle = blendColor('#aa403f', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.fillStyle = blendColor('#d14f4d', "#FF0000", Math.max(0, blendAmount(e)))
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = "#ffffff";
			ctx.fillStyle = "#ffffff"
		}
		ctx.lineJoin = 'round';

		
		let legs = [0, 1, 2, 3, 4];
		let legNumber = 0;

		if (e.hp < e.maxHp * 0.8) {
			legs = [1, 2, 3, 4];
		}
		if (e.hp < e.maxHp * 0.6) {
			legs = [1, 3, 4];
		}
		if (e.hp < e.maxHp * 0.4) {
			legs = [1, 4];
		}
		if (e.hp < e.maxHp * 0.2) {
			legs = [4];
		}

		for(let i = 0; i < e.data[0].length; i++){
			if (legs.includes(i)){
				e.data[0][i] = interpolate(e.data[0][i], 1, Math.min(0.5 * dt/16.66, 1));
				//e.data[0][i] += (1 - e.data[0][i]) / (400 / dt); 
			}
			else{
				e.data[0][i] = interpolate(e.data[0][i], 0, Math.min(0.5 * dt/16.66, 1));
				//e.data[0][i] += (0 - e.data[0][i]) / (400 / dt);
			}
		}

		let angleDist = Math.PI / 5;

		ctx.beginPath();
		for (let i = 0; i < Math.PI * 2; i += angleDist * 2) {
			let dist = 1 + e.data[0][legNumber] * 0.6;
			if (i == 0) {
				ctx.moveTo(Math.cos(i - angleDist * 1.8) * (e.render.radius * 1.6), Math.sin(i - angleDist * 1.8) * (e.render.radius * 1.6));
			}
			ctx.quadraticCurveTo(Math.cos(i - angleDist) * (e.render.radius * 0.4), Math.sin(i - angleDist) * (e.render.radius * 0.4), Math.cos(i) * (e.render.radius * dist) + Math.cos(i - Math.PI / 2) * (e.render.radius * 0.2), Math.sin(i) * (e.render.radius * dist) + Math.sin(i - Math.PI / 2) * (e.render.radius * 0.2));
			ctx.arc(Math.cos(i) * (e.render.radius * (dist)), Math.sin(i) * (e.render.radius * (dist)), e.render.radius * 0.2, i - Math.PI / 2, i + Math.PI / 2);
			legNumber++;
		}
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = blendColor('#d6766b', "#FF0000", Math.max(0, blendAmount(e)))
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"
		}
		legNumber = 0;
		for (let i = 0; i < Math.PI * 2; i += angleDist * 2) {
			ctx.beginPath();
			ctx.arc(Math.cos(i) * (e.render.radius * 0.5), Math.sin(i) * (e.render.radius * 0.5), e.render.radius * 0.2, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();
			if (e.data[0][legNumber] > 0.4) {
				let amountPast = e.data[0][legNumber] - 0.4;
				let oldAlpha;
				if (amountPast < 0.2){
					oldAlpha = ctx.globalAlpha;
					ctx.globalAlpha *= amountPast*1/0.2;
				}
				ctx.beginPath();
				ctx.arc(Math.cos(i) * (e.render.radius * 0.94), Math.sin(i) * (e.render.radius * 0.94), e.render.radius * 0.16, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();
				if (amountPast < 0.2){
					ctx.globalAlpha = oldAlpha;
				}
			}
			if (e.data[0][legNumber] > 0.7) {
				let amountPast = e.data[0][legNumber] - 0.7;
				let oldAlpha;
				if (amountPast < 0.2){
					oldAlpha = ctx.globalAlpha;
					ctx.globalAlpha *= amountPast*1/0.2;
				}
				ctx.beginPath();
				ctx.arc(Math.cos(i) * (e.render.radius * 1.3), Math.sin(i) * (e.render.radius * 1.3), e.render.radius * 0.12, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();
				if (amountPast < 0.2){
					ctx.globalAlpha = oldAlpha;
				}
			}
			legNumber++;
		}


		ctx.rotate(-e.render.time / 150);
	},
	Crab: (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		if (e.shockwaveTime){
			if (time < e.shockwaveTime + 1000){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = 1-((time - e.shockwaveTime)/1000);
				ctx.fillStyle = "white";
				ctx.beginPath();
				ctx.arc(0, 0, 2200, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();
				ctx.globalAlpha = savedAlpha;
			}
		}

		let outline = blendColor('#b15a3f', "#FF0000", Math.max(0, blendAmount(e)));
		let fill = blendColor('#dc704b', "#FF0000", Math.max(0, blendAmount(e)))
		let legColor = blendColor('#4e2521', '#FF0000', Math.max(0, blendAmount(e)))
		if (checkForFirstFrame(e)) {
			outline = "#ffffff";
			fill = "#ffffff";
			legColor = '#ffffff';
		}

		ctx.rotate(e.render.angle)

		//Claws
		ctx.fillStyle = legColor;
		ctx.strokeStyle = legColor;
		ctx.lineWidth = e.radius * 0.09565217391304348;


		let xTranslate = 0.69;
		let yTranslate = -0.39;
		ctx.translate(e.render.radius * xTranslate, e.render.radius * yTranslate);
		let rotateAngle = Math.cos(e.render.time / 9) / 6;
		ctx.rotate(rotateAngle)

		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.45 - xTranslate), e.render.radius * (-0.88 - yTranslate));
		ctx.quadraticCurveTo(e.render.radius * (1.03 - xTranslate), e.render.radius * (-1.15 - yTranslate), e.render.radius * (1.25 - xTranslate), e.render.radius * (-0.62 - yTranslate))
		ctx.lineTo(e.render.radius * (1.01 - xTranslate), e.render.radius * (-0.77 - yTranslate))
		ctx.lineTo(e.render.radius * (1.11 - xTranslate), e.render.radius * (-0.52 - yTranslate))
		ctx.quadraticCurveTo(e.render.radius * (0.85 - xTranslate), e.render.radius * (-0.72 - yTranslate), e.render.radius * (0.7 - xTranslate), e.render.radius * (-0.73 - yTranslate))
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-rotateAngle)
		ctx.translate(-e.render.radius * xTranslate, -e.render.radius * yTranslate);

		xTranslate = 0.69;
		yTranslate = 0.39;
		ctx.translate(e.render.radius * xTranslate, e.render.radius * yTranslate);
		rotateAngle = -Math.cos(e.render.time / 9) / 6;
		ctx.rotate(rotateAngle)

		ctx.beginPath();
		ctx.lineTo(e.render.radius * (0.45 - xTranslate), e.render.radius * (0.88 - yTranslate));
		ctx.quadraticCurveTo(e.render.radius * (1.03 - xTranslate), e.render.radius * (1.15 - yTranslate), e.render.radius * (1.25 - xTranslate), e.render.radius * (0.62 - yTranslate))
		ctx.lineTo(e.render.radius * (1.01 - xTranslate), e.render.radius * (0.77 - yTranslate))
		ctx.lineTo(e.render.radius * (1.11 - xTranslate), e.render.radius * (0.52 - yTranslate))
		ctx.quadraticCurveTo(e.render.radius * (0.85 - xTranslate), e.render.radius * (0.72 - yTranslate), e.render.radius * (0.7 - xTranslate), e.render.radius * (0.73 - yTranslate))
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-rotateAngle)
		ctx.translate(-e.render.radius * xTranslate, -e.render.radius * yTranslate);

		//Legs
		ctx.lineWidth = e.render.radius / 4;

		ctx.rotate(Math.PI / 2);

		for (let i = 4; i--; i > 0) {
			let rotateAmount = i * 0.34906 - 0.34906 - 0.17453292 + Math.cos(e.render.time / 12 + i) * 0.1; //i * Math.PI/6 - Math.PI/6 + Math.PI/12 + Math.cos(e.time/75 + i/2)*0.4;
			ctx.rotate(rotateAmount);
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(e.render.radius * 1.5, 0);
			ctx.lineTo(e.render.radius * 1.7, e.render.radius * (rotateAmount) / 3);
			ctx.stroke();
			ctx.closePath();
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(-e.render.radius * 1.5, 0);
			ctx.lineTo(-e.render.radius * 1.7, -e.render.radius * (rotateAmount) / 3);
			ctx.stroke();
			ctx.closePath();

			ctx.rotate(-rotateAmount);


		}

		ctx.rotate(-Math.PI / 2);

		//Main body
		ctx.lineJoin = 'round';
		ctx.lineCap = "round"

		ctx.strokeStyle = outline;
		ctx.fillStyle = fill;
		ctx.lineWidth = e.radius * 0.1826086956521739;


		//Body structure
		ctx.beginPath();
		ctx.ellipse(0, 0, e.radius * 0.8695652173913043, e.radius * 1.1130434782608696, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		//Patterns on body
		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.49, e.render.radius * -0.39);
		ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.16, e.render.radius * 0.49, e.render.radius * -0.39)
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.lineTo(e.render.radius * -0.49, e.render.radius * 0.39);
		ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * 0.16, e.render.radius * 0.49, e.render.radius * 0.39)
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle)
	},
	"Fire Ant Burrow": (e) => {
		ctx.fillStyle = "#b52d00"
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = "#942500"
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 2 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.fillStyle = "#6b1b00"
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 1 / 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

	},
	Locust: (e) => {
		if (e.render.legAnimation === undefined) {
			if (e.originalRarity !== undefined) {
				e.render.legAnimation = 1;
			} else {
				e.render.legAnimation = 0;
			}
		}
		if (Math.sqrt(e.xv ** 2 + e.yv ** 2) > 0.1) {
			e.render.legAnimation = interpolate(e.render.legAnimation, 1, 0.023);
		} else if (performance.now() - e.locustLastMoveTime > 200) {
			e.render.legAnimation = interpolate(e.render.legAnimation, 0, 0.023);
		}

		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2);

		let fillColor = blendColor( /*'#ae7a37'*/ /*'#b68859'*/ /*'#916443'*/ blendColor('#fff0b8', /*'#acb05d'*/ '#c95b5b', e.render.legAnimation), "#FF0000", Math.max(0, blendAmount(e)));
		let strokeColor = blendColor( /*'#8c622c'*/ /*'#b08356'*/ /*'#69462d'*/ blendColor('#cfc295', /*'#8c914b'*/ '#a64444', e.render.legAnimation), "#FF0000", Math.max(0, blendAmount(e)));
		let eyeColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e))); //343534
		if (checkForFirstFrame(e)) {
			eyeColor = '#FFFFFF';
			fillColor = '#FFFFFF';
			strokeColor = "#FFFFFF";
		}
		// const angleToPlayer = window.selfId === undefined ? 0 : Math.atan2(e.render.y - room.flowers[selfId].render.y, room.flowers[selfId].render.x-e.render.x);
		// ctx.rotate(angleToPlayer + e.render.angle);
		ctx.rotate(e.render.angle + Math.PI / 2);

		//Legs

		// TODO: this isnt working somehow?
		// if(e.dead === true){
		// 	ctx.save();

		// 	// draw body for clip
		// 	let p = new Path2D();
		// 	p.rect(-10000, -10000, 20000, 20000);
		// 	ctx.ellipse(0, 0, e.render.radius, e.render.radius * 2 / 3, 0, 0, Math.PI * 2);
		// 	ctx.clip(p, "evenodd");
		// }

		// LEGS
		ctx.strokeStyle = eyeColor;
		ctx.lineWidth = e.render.radius / 7;

		if (e.render.legAnimation > 0.01) {
			ctx.scale(e.render.legAnimation, e.render.legAnimation);
			//0.03 cap
			for (let i = 4; i--; i > 0) {
				let rotateAmount = i * 0.52359 - 0.52359 - 0.26179938 + Math.cos(e.render.time / 17 + i) * 0.2; //i * Math.PI/6 - Math.PI/6 + Math.PI/12 + Math.cos(e.time/75 + i/2)*0.4;
				ctx.rotate(rotateAmount);
				ctx.beginPath();
				ctx.moveTo(-e.render.radius * 1, 0);
				ctx.quadraticCurveTo(-e.render.radius, e.render.radius * 1 / 6, 0, 0);
				ctx.quadraticCurveTo(e.render.radius, -e.render.radius * 1 / 6, e.render.radius * 1, 0);
				ctx.stroke();
				ctx.rotate(-rotateAmount);
				ctx.closePath();
			}

			ctx.scale(1 / e.render.legAnimation, 1 / e.render.legAnimation);
		}

		// if(e.dead === true){
		// 	ctx.restore();
		// }

		// EYES AND EYEBROWS
		if (e.render.legAnimation > 0.01) {
			// const lastGlobalAlpha = ctx.globalAlpha;
			// ctx.globalAlpha *= e.render.legAnimation;
			// eyes
			ctx.fillStyle = eyeColor;
			ctx.beginPath();
			ctx.arc(-e.render.radius * .22, -e.render.radius * 0.94 + (1 - e.render.legAnimation) * e.render.radius * 0.42, e.render.radius * .24, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(e.render.radius * .22, -e.render.radius * 0.94 + (1 - e.render.legAnimation) * e.render.radius * 0.42, e.render.radius * .24, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			// brows
			ctx.strokeStyle = strokeColor;
			ctx.beginPath();
			ctx.moveTo(e.render.radius * .12, -e.render.radius * .94);
			ctx.quadraticCurveTo(-e.render.radius * .12, e.render.radius * -1.18 + (1 - e.render.legAnimation) * e.render.radius * 0.21, -e.render.radius * .32, e.render.radius * -1.26 + (1 - e.render.legAnimation) * e.render.radius * 0.42);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(-e.render.radius * .12, -e.render.radius * .94);
			ctx.quadraticCurveTo(e.render.radius * .12, e.render.radius * -1.18 + (1 - e.render.legAnimation) * e.render.radius * 0.21, e.render.radius * .32, e.render.radius * -1.26 + (1 - e.render.legAnimation) * e.render.radius * 0.42);
			ctx.stroke();
			ctx.closePath();
			// ctx.globalAlpha = lastGlobalAlpha;
		}
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		// MAIN BODY
		ctx.lineWidth = e.render.radius * .18;

		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;

		// ctx.save();
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		// ctx.clip();
		ctx.closePath();

		// body curves
		if (e.render.legAnimation > 0.01) {
			let lastGlobalAlpha = ctx.globalAlpha;
			if (e.render.legAnimation < 0.1) {
				ctx.globalAlpha = (e.render.legAnimation - 0.01) * 1 / 0.09;
			}
			// const lastGlobalAlpha = ctx.globalAlpha;
			// ctx.globalAlpha *= e.render.legAnimation;
			// ctx.lineWidth /= 2.2;
			// ctx.beginPath();
			// ctx.moveTo(0, e.render.radius);
			// ctx.quadraticCurveTo(e.render.radius * 2/3, 0, 0, -e.render.radius)
			// ctx.stroke();
			// ctx.closePath();

			// ctx.beginPath();
			// ctx.moveTo(0, e.render.radius);
			// ctx.quadraticCurveTo(-e.render.radius * 2/3, 0, 0, -e.render.radius)
			// ctx.stroke();
			// ctx.closePath();

			// ctx.beginPath();
			// ctx.moveTo(-e.render.radius * 2/3, 0);
			// ctx.quadraticCurveTo(0, e.render.radius * .2, e.render.radius * 2/3, 0)
			// ctx.stroke();
			// ctx.closePath();

			// ctx.beginPath();
			// ctx.moveTo(-e.render.radius * .5, e.render.radius * .6);
			// ctx.quadraticCurveTo(0, e.render.radius * (.2 + .6), e.render.radius * .5, e.render.radius * .6)
			// ctx.stroke();
			// ctx.closePath();

			// ctx.beginPath();
			// ctx.moveTo(-e.render.radius * .5, e.render.radius * -.6);
			// ctx.quadraticCurveTo(0, e.render.radius * (.2 - .6), e.render.radius * .5, e.render.radius * -.6)
			// ctx.stroke();
			// ctx.closePath();
			ctx.lineWidth = e.render.radius * .21;
			// )-( shape kinda

			// ) and (
			ctx.beginPath();
			ctx.moveTo(e.render.radius * -.32, e.render.radius * -.4);
			ctx.quadraticCurveTo(0, e.render.radius * -.18, e.render.radius * .32, e.render.radius * -.4);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.moveTo(e.render.radius * -.32, e.render.radius * .4);
			ctx.quadraticCurveTo(0, e.render.radius * .18, e.render.radius * .32, e.render.radius * .4);
			ctx.stroke();
			ctx.closePath();

			// line
			ctx.beginPath();
			ctx.moveTo(0, e.render.radius * .22);
			ctx.lineTo(0, e.render.radius * -.22);
			ctx.stroke();
			ctx.closePath();

			// ctx.globalAlpha = lastGlobalAlpha;
			ctx.globalAlpha = lastGlobalAlpha;
		}


		// ctx.lineWidth *= 1.1;
		// ctx.beginPath();
		// ctx.moveTo(0, e.render.radius);
		// ctx.lineTo(0, -e.render.radius)
		// ctx.stroke();
		// ctx.closePath();

		// vertabrae on the back
		// for(let i = 0; i < 5; i++){
		// 	const sizeMult = (0.7+0.3*(1-Math.abs(2.5-i)))/5;
		// 	ctx.beginPath();
		// 	ctx.moveTo(0, -e.render.radius * .12 * sizeMult + (i-2) * e.render.radius / 3);
		// 	ctx.lineTo(e.render.radius * 1.4 * 2/3 * sizeMult, e.render.radius * .09 * sizeMult + (i-2) * e.render.radius / 3);
		// 	ctx.lineTo(-e.render.radius * 1.4 * 2/3 * sizeMult, e.render.radius * .09 * sizeMult + (i-2) * e.render.radius / 3);
		// 	ctx.lineTo(0, -e.render.radius * .12 * sizeMult + (i-2) * e.render.radius / 3);
		// 	ctx.fillStyle = ctx.strokeStyle;
		// 	ctx.fill();
		// 	ctx.stroke();
		// 	ctx.closePath();
		// }


		// ctx.fillStyle = blendColor(/*'#ae7a37'*//*'#b68859'*//*'#916443'*/'#fff0b8', "#FF0000", Math.max(0, blendAmount(e)));
		// if (checkForFirstFrame(e)) {
		// 	ctx.fillStyle = "#ffffff"; //"#FFFFFF";
		// }

		// hornet stripes? lets see if its good
		// lol idk what i did looks cursed lmaf
		// ye the entire spawning algo is kinda broken lmao
		// ctx.rotate(Math.PI / 2);// or wait for that
		// i kinda wanna do that because i wrote the whole thing lol
		// hmm maybe make more default behaviors wtf theyre atomic bombs rnbro they look so cursed
		// like now every single mob has the move and turn default
		// ?? atomic bombs? oh i see it lol  maaybe the stripes should be quadratic curves :skull:
		// ctx.fillStyle = ctx.strokeStyle;
		// ctx.fillRect(-e.render.radius * 2/3, -e.render.radius * 2 / 3, e.render.radius * 4/3, e.render.radius / 3);
		// ctx.fillRect(-e.render.radius * 2/3, 0, e.render.radius * 4/3, e.render.radius / 3);// na idk i kinda m thinking that stripes arent really gonna work
		// // new idea
		// ctx.fillRect(-e.render.radius * 2/3, e.render.radius * 2 / 3, e.render.radius * 4/3, e.render.radius / 3);
		// ctx.rotate(-Math.PI / 2);
		// ctx.fillStyle = blendColor(/*'#ae7a37'*//*'#b68859'*/'#916443', "#FF0000", Math.max(0, blendAmount(e)));
		// if(checkForFirstFrame(e)){
		// 	ctx.fillStyle = '#ffffff';
		// }
		// ----
		// ctx.strokeStyle *= .4;
		// ctx.beginPath();
		// ctx.ellipse(0, 0, e.render.radius * .4, e.render.radius * 2 / 3 * .4, 0, 0, Math.PI * 2);
		// ctx.fill();
		// ctx.stroke();
		// ctx.clip();

		// if(e.render.legAnimation > .01){
		// 	ctx.translate(0, -e.render.radius * .85);
		// 	// ctx.translate(-e.render.radius * )
		// 	ctx.scale(e.render.legAnimation, e.render.legAnimation);

		// 	// antennae
		// 	ctx.fillStyle = eyeColor;
		// 	ctx.strokeStyle = eyeColor;
		// 	ctx.lineWidth = e.render.radius / 10;
		// 	ctx.beginPath();
		// 	ctx.moveTo(e.render.radius * .16, 0);
		// 	ctx.quadraticCurveTo(e.render.radius * .18, -e.render.radius * .51, e.render.radius * .49, -e.render.radius * .83);
		// 	ctx.quadraticCurveTo(e.render.radius * .3, -e.render.radius * .41, e.render.radius * .16, 0);
		// 	ctx.fill();
		// 	ctx.stroke();
		// 	ctx.closePath();

		// 	ctx.beginPath();
		// 	ctx.moveTo(-e.render.radius * .16, 0);
		// 	ctx.quadraticCurveTo(-e.render.radius * .18, -e.render.radius * .51, -e.render.radius * .49, -e.render.radius * .83);
		// 	ctx.quadraticCurveTo(-e.render.radius * .3, -e.render.radius * .41, -e.render.radius * .16, 0);
		// 	ctx.fill();
		// 	ctx.stroke();
		// 	ctx.closePath();

		// 	ctx.scale(1/e.render.legAnimation, 1/e.render.legAnimation);
		// 	ctx.translate(0, e.render.radius * .85);
		// }

		// ctx.closePath();
		// ctx.fillStyle = ctx.strokeStyle;
		// ctx.fillStyle = blendColor(/*'#ae7a37'*//*'#b68859'*/'#916443', "#FF0000", Math.max(0, blendAmount(e)));
		// if(checkForFirstFrame(e)){
		// 	ctx.fillStyle = '#ffffff';
		// }

		// ctx.restore();

		ctx.rotate(-e.render.angle - Math.PI / 2);
		// ctx.rotate(-angleToPlayer-e.render.angle);
	},
	"Bubble": (e) => {
		ctx.rotate(e.render.angle);
		ctx.lineWidth = e.render.radius / 10;

		ctx.fillStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}
		let oldGlobalAlpha = ctx.globalAlpha;
		ctx.globalAlpha *= 0.6;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 19 / 20, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();
		ctx.globalAlpha *= 0.6;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 18 / 20, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		ctx.arc(-e.render.radius * 0.45, 0, e.render.radius * 1 / 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();

		ctx.globalAlpha = oldGlobalAlpha;
		ctx.rotate(-e.render.angle);
	},
	"Jellyfish": (e) => {
		let savedAlpha = ctx.globalAlpha;
		if (e.lastShocked == 0) {
			e.renderShock = [];
			for (let i = 0; i < e.shock.length; i++) {
				let value = e.shock[i];
				if (i == 0) {
					e.renderShock.push(value);
				} else {
					let average1 = {};
					average1.x = value.x * 1 / 3 + e.shock[i - 1].x * 2 / 3;
					average1.y = value.y * 1 / 3 + e.shock[i - 1].y * 2 / 3;
					let average2 = {};
					average2.x = value.x * 2 / 3 + e.shock[i - 1].x * 1 / 3;
					average2.y = value.y * 2 / 3 + e.shock[i - 1].y * 1 / 3;
					let diff = Math.sqrt((value.y - e.shock[i - 1].y) ** 2 + (value.x - e.shock[i - 1].x) ** 2)
					average1.x += (Math.random() * diff / 5 - diff / 10)
					average1.y += (Math.random() * diff / 5 - diff / 10)
					e.renderShock.push(average1);
					e.renderShock.push(average2);
					e.renderShock.push(value);
				}
			}
		}
		if (e.shockwaveTime){
			if (time < e.shockwaveTime + 1000){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = 1-((time - e.shockwaveTime)/1000);
				ctx.fillStyle = "white";
				ctx.beginPath();
				ctx.arc(0, 0, 2200, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();
				ctx.globalAlpha = savedAlpha;
			}
		}
		/*
		        room.enemies[msg[1]].splitShockwaveAngle = msg[2];
        room.enemies[msg[1]].splitShockwaveWarningTime = time;
		*/
		if (e.splitShockwaveWarningTime){
			if (time < e.splitShockwaveWarningTime + 4000 && (!e.splitShockwaveTime || time > e.splitShockwaveTime + 4000)){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = ((time - e.splitShockwaveWarningTime)/4000);
				ctx.strokeStyle = "red";

				ctx.lineWidth = 3000;	
				ctx.lineCap = "butt";

				for(let i = 4; i--; i>0){
					ctx.beginPath();
					ctx.arc(0, 0, 1500, e.splitShockwaveAngle - 0.3 + i * Math.PI/2, e.splitShockwaveAngle + 0.3 + i * Math.PI/2);
					ctx.stroke();
					ctx.closePath();
				}

				ctx.globalAlpha = savedAlpha;
				ctx.lineCap = "round"
			}
		}
		if (e.splitShockwaveTime){
			if (time < e.splitShockwaveTime + 1000){
				let savedAlpha = ctx.globalAlpha;
				ctx.globalAlpha = 0.5-((time - e.splitShockwaveTime)/2000);
				ctx.strokeStyle = "white";

				ctx.lineWidth = 3000;	
				ctx.lineCap = "butt";

				for(let i = 4; i--; i>0){
					ctx.beginPath();
					ctx.arc(0, 0, 1500, e.splitShockwaveAngle - 0.3 + i * Math.PI/2, e.splitShockwaveAngle + 0.3 + i * Math.PI/2);
					ctx.stroke();
					ctx.closePath();
				}

				ctx.globalAlpha = savedAlpha;
				ctx.lineCap = "round"
			}
		}
		
		e.lastShocked += dt;

		e.render.time += dt;
		ctx.rotate(e.render.angle);
		ctx.lineWidth = e.render.radius / 6;

		if (e.team == "flower"){
			ctx.fillStyle = blendColor('#fdff8f', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.strokeStyle = blendColor('#fdff8f', "#FF0000", Math.max(0, blendAmount(e)));
			if (checkForFirstFrame(e)) {
				ctx.fillStyle = "#ffffff"; //"#FFFFFF";
				ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
			}
		}
		else{
			ctx.fillStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
			ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
			if (checkForFirstFrame(e)) {
				ctx.fillStyle = "#ffffff"; //"#FFFFFF";
				ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
			}
		}
		ctx.globalAlpha *= 0.5;

		ctx.rotate(e.render.angle);
		for (let i = 8; i > 0; i--) {
			let offset = Math.cos(e.render.time / 500 + i * Math.PI / 4);
			ctx.rotate(Math.PI * 1 / 4 * i)
			ctx.beginPath();
			ctx.moveTo(e.render.radius * 0.8, 0);
			ctx.quadraticCurveTo(e.render.radius * 0.9, 0, e.render.radius * 1.5, e.render.radius * 0.2 * offset)
			ctx.stroke();
			ctx.closePath();
			ctx.rotate(-Math.PI * 1 / 4 * i)
		}
		ctx.rotate(-e.render.angle)

		ctx.globalAlpha *= 1.3;
		ctx.lineWidth = e.render.radius / 12;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 23 / 24, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();
		ctx.globalAlpha *= 0.5;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 22 / 24, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();


		ctx.rotate(-e.render.angle);

		if (e.lastShocked < 900) {
			ctx.globalAlpha = (1 - e.lastShocked / 900);
			ctx.strokeStyle = "white";
			ctx.lineWidth = 3;
			if (e.team == "flower"){
				ctx.strokeStyle = "yellow";
				ctx.lineWidth = 6;
			}
			ctx.beginPath();
			for (let i = 0; i < e.renderShock.length; i++) {
				ctx.lineTo(e.renderShock[i].x - e.render.x, e.renderShock[i].y - e.render.y);
			}
			ctx.stroke();
			ctx.closePath();
		}

		ctx.globalAlpha = savedAlpha;
	},
	"Leech":  (e) => {
    if (e.isInEnemyBox || e.isMenuEnemy) {
        if (e.isMenuEnemy === true) {
            ctx.rotate(e.angle);
        }
        ctx.lineWidth = e.radius * 0.07;
        ctx.strokeStyle = '#292929'
        ctx.rotate(-Math.PI * 3 / 4)
        ctx.beginPath();
        ctx.lineTo(e.render.radius * 0.93, e.render.radius * -0.12);
        ctx.quadraticCurveTo(e.render.radius * 1.1, e.render.radius * -0.12, e.render.radius * 1.25, e.render.radius * 0.16)
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineTo(e.render.radius * 0.91, e.render.radius * 0.18);
        ctx.quadraticCurveTo(e.render.radius * 0.94, e.render.radius * 0.24, e.render.radius * 1.13, e.render.radius * 0.3)
        ctx.stroke();
        ctx.closePath();

        ctx.lineJoin = "round";
        ctx.lineCap = "round"
        ctx.lineWidth = e.radius * 0.455;
        ctx.beginPath();
        ctx.lineTo(e.render.radius * -0.92, e.render.radius * 0);
        ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.55, e.render.radius * 0.92, e.render.radius * 0)
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = e.radius * 0.305;
        ctx.strokeStyle = '#333333';

        ctx.beginPath();
        ctx.lineTo(e.render.radius * -0.92, e.render.radius * 0);
        ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.55, e.render.radius * 0.92, e.render.radius * 0)
        ctx.stroke();
        ctx.closePath();
        ctx.rotate(Math.PI * 3 / 4)
        if (e.isMenuEnemy === true) {
            ctx.rotate(-e.angle);
        }
        return;
    }
    if (!e.childIds) {
        if (!e.isChild) e.isChild = false
        if (!e.parentId && e.isChild !== true) {
            for (let id in room.enemies) {
                let enemy = room.enemies[id]
                if (enemy.type !== e.type) continue
                if (enemy.childIds) {
                    enemy.childIds.includes(e.id) ? e.isChild = true : ''
                }
            }
        }

        if (e.team === 'flower' || !e.isChild) {
            ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));;
            ctx.lineWidth = e.render.radius / 2.36;

            ctx.rotate(e.render.angle);

            // let angle = Math.cos(window.performance.now()/120)*0.12;
            const inwardsOffset = Math.cos(time / 96) * e.render.radius * 0.024;
            // ctx.rotate(angle);
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(e.render.radius * 0.48, e.render.radius * 0.45);
            ctx.quadraticCurveTo(e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, e.render.radius * 1.38 - inwardsOffset, -e.render.radius * .48);
            ctx.stroke();
            ctx.closePath();
            // ctx.rotate(-angle);

            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.moveTo(-e.render.radius * 0.48, e.render.radius * 0.45);
            ctx.quadraticCurveTo(-e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, -e.render.radius * 1.38 + inwardsOffset, -e.render.radius * .48);
            ctx.stroke();
            ctx.closePath();

            ctx.rotate(-Math.PI * 2 / 3 - Math.PI / 6);
            ctx.rotate(-e.render.angle);

            ctx.beginPath()
            ctx.lineWidth = e.render.radius * 2;
            ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));
            ctx.lineTo(0, 0)
            ctx.stroke()

            ctx.lineWidth = e.render.radius * 1.5;
            ctx.strokeStyle = blendColor('#333333', "#FF0000", Math.max(0, blendAmount(e)));
            ctx.lineTo(0, 0)
            ctx.stroke()
            ctx.closePath()
        }
        return
    }
    const isOpaq = ctx.globalAlpha !== 1;

    if (isOpaq === true) {
        // draw head and clip so that legs dont appear insider body
        ctx.save();
        let p = new Path2D();
        p.rect(-10000, -10000, 20000, 20000);
        p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
        ctx.clip(p, "evenodd");
    }

    // legs
    ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));;
    ctx.lineWidth = e.render.radius / 2.36;
    if (checkForFirstFrame(e)) {
        ctx.fillStyle = "#ffffff"; //"#FFFFFF";
        ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
    }

    ctx.rotate(e.render.angle);

    // let angle = Math.cos(window.performance.now()/120)*0.12;
    const inwardsOffset = Math.cos(time / 96) * e.render.radius * 0.024;
    // ctx.rotate(angle);
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(e.render.radius * 0.48, e.render.radius * 0.45);
    ctx.quadraticCurveTo(e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, e.render.radius * 1.38 - inwardsOffset, -e.render.radius * .48);
    ctx.stroke();
    ctx.closePath();
    // ctx.rotate(-angle);

    ctx.rotate(Math.PI * 2 / 3);
    ctx.beginPath();
    ctx.moveTo(-e.render.radius * 0.48, e.render.radius * 0.45);
    ctx.quadraticCurveTo(-e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, -e.render.radius * 1.38 + inwardsOffset, -e.render.radius * .48);
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-Math.PI * 2 / 3 - Math.PI / 6);

    ctx.rotate(-e.render.angle);

    if (isOpaq === true) {
        ctx.restore();
    }
    ctx.lineWidth = e.render.radius * 2;

    ctx.strokeStyle = blendColor('#292929', "#FF0000", Math.max(0, blendAmount(e)));
    if (checkForFirstFrame(e)) {
        ctx.strokeStyle = "#ffffff"
    }

    ctx.beginPath();
    ctx.lineTo(0, 0);
    for (let i of e.childIds) {
        if (room.enemies[i]) {
            ctx.lineTo(room.enemies[i].render.x - e.render.x, room.enemies[i].render.y - e.render.y);
        }
    }
    ctx.stroke();
    ctx.closePath();

    ctx.lineWidth = e.render.radius * 1.5;
    ctx.strokeStyle = blendColor('#333333', "#FF0000", Math.max(0, blendAmount(e)));
    if (checkForFirstFrame(e)) {
        ctx.strokeStyle = "#ffffff";
    }

    ctx.beginPath();
    ctx.lineTo(0, 0);
    for (let i of e.childIds) {
        if (room.enemies[i]) {
            ctx.lineTo(room.enemies[i].render.x - e.render.x, room.enemies[i].render.y - e.render.y);
        }
    }
    ctx.stroke();
    ctx.closePath();


	},
	"BudLeech": (e) => {
		normalEnemyRenderMap.Leech(e);
	},
	"Dark Electric Eel": (e) => {

		let savedAlpha = ctx.globalAlpha;
    if (e.isInEnemyBox || e.isMenuEnemy) {
        if (e.isMenuEnemy === true) {
            ctx.rotate(e.angle);
        }
        ctx.lineWidth = e.radius * 0.07;
				
				ctx.globalAlpha = savedAlpha * 0.4;
        ctx.strokeStyle = '#48258a'
        ctx.rotate(-Math.PI * 3 / 4)
        ctx.beginPath();
        ctx.lineTo(e.render.radius * 0.93, e.render.radius * -0.12);
        ctx.quadraticCurveTo(e.render.radius * 1.1, e.render.radius * -0.12, e.render.radius * 1.25, e.render.radius * 0.16)
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineTo(e.render.radius * 0.91, e.render.radius * 0.18);
        ctx.quadraticCurveTo(e.render.radius * 0.94, e.render.radius * 0.24, e.render.radius * 1.13, e.render.radius * 0.3)
        ctx.stroke();
        ctx.closePath();

        ctx.lineJoin = "round";
        ctx.lineCap = "round"
        ctx.lineWidth = e.radius * 0.455;
        ctx.beginPath();
        ctx.lineTo(e.render.radius * -0.92, e.render.radius * 0);
        ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.55, e.render.radius * 0.92, e.render.radius * 0)
        ctx.stroke();
        ctx.closePath();

				
				ctx.globalAlpha = savedAlpha * 0.4;
        ctx.lineWidth = e.radius * 0.305;
        ctx.strokeStyle = '#48258a';

        ctx.beginPath();
        ctx.lineTo(e.render.radius * -0.92, e.render.radius * 0);
        ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.55, e.render.radius * 0.92, e.render.radius * 0)
        ctx.stroke();
        ctx.closePath();
        ctx.rotate(Math.PI * 3 / 4)
        if (e.isMenuEnemy === true) {
            ctx.rotate(-e.angle);
        }
				
				ctx.globalAlpha = savedAlpha;
        return;
    }
    if (!e.childIds) {
        if (!e.isChild) e.isChild = false
        if (!e.parentId && e.isChild !== true) {
            for (let id in room.enemies) {
                let enemy = room.enemies[id]
                if (enemy.type !== e.type) continue
                if (enemy.childIds) {
                    enemy.childIds.includes(e.id) ? e.isChild = true : ''
                }
            }
        }

        if (e.team === 'flower' || !e.isChild) {
            ctx.strokeStyle = blendColor('#48258a', "#FF0000", Math.max(0, blendAmount(e)));;
            ctx.lineWidth = e.render.radius / 2.36;

            ctx.rotate(e.render.angle);

            // let angle = Math.cos(window.performance.now()/120)*0.12;
            const inwardsOffset = Math.cos(time / 96) * e.render.radius * 0.024;
            // ctx.rotate(angle);
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(e.render.radius * 0.48, e.render.radius * 0.45);
            ctx.quadraticCurveTo(e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, e.render.radius * 1.38 - inwardsOffset, -e.render.radius * .48);
            ctx.stroke();
            ctx.closePath();
            // ctx.rotate(-angle);

            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.moveTo(-e.render.radius * 0.48, e.render.radius * 0.45);
            ctx.quadraticCurveTo(-e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, -e.render.radius * 1.38 + inwardsOffset, -e.render.radius * .48);
            ctx.stroke();
            ctx.closePath();

            ctx.rotate(-Math.PI * 2 / 3 - Math.PI / 6);
            ctx.rotate(-e.render.angle);

							
						ctx.globalAlpha = savedAlpha * 0.4;
            ctx.beginPath()
            ctx.lineWidth = e.render.radius * 2;
            ctx.strokeStyle = blendColor('#48258a', "#FF0000", Math.max(0, blendAmount(e)));
            ctx.lineTo(0, 0)
            ctx.stroke()

						
						ctx.globalAlpha = savedAlpha * 0.4;
            ctx.lineWidth = e.render.radius * 1.5;
            ctx.strokeStyle = blendColor('#48258a', "#FF0000", Math.max(0, blendAmount(e)));
            ctx.lineTo(0, 0)
            ctx.stroke()
            ctx.closePath()
        }
				
				ctx.globalAlpha = savedAlpha;
        return
    }

		// draw head and clip so that legs dont appear insider body
		ctx.save();
		let p = new Path2D();
		p.rect(-10000, -10000, 20000, 20000);
		p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.clip(p, "evenodd");

    // legs
    ctx.strokeStyle = blendColor('#48258a', "#FF0000", Math.max(0, blendAmount(e)));;
    ctx.lineWidth = e.render.radius / 2.36;
		
		ctx.globalAlpha = savedAlpha * 0.2;
    if (checkForFirstFrame(e)) {
        ctx.fillStyle = "#ffffff"; //"#FFFFFF";
        ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#48258a", 0.19);
    }

    ctx.rotate(e.render.angle);

    // let angle = Math.cos(window.performance.now()/120)*0.12;
    const inwardsOffset = Math.cos(time / 96) * e.render.radius * 0.024;
    // ctx.rotate(angle);
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(e.render.radius * 0.48, e.render.radius * 0.45);
    ctx.quadraticCurveTo(e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, e.render.radius * 1.38 - inwardsOffset, -e.render.radius * .48);
    ctx.stroke();
    ctx.closePath();
    // ctx.rotate(-angle);

    ctx.rotate(Math.PI * 2 / 3);
    ctx.beginPath();
    ctx.moveTo(-e.render.radius * 0.48, e.render.radius * 0.45);
    ctx.quadraticCurveTo(-e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, -e.render.radius * 1.38 + inwardsOffset, -e.render.radius * .48);
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-Math.PI * 2 / 3 - Math.PI / 6);

    ctx.rotate(-e.render.angle);

    ctx.restore();
    ctx.lineWidth = e.render.radius * 2;

    ctx.strokeStyle = blendColor('#48258a', "#FF0000", Math.max(0, blendAmount(e)));
    if (checkForFirstFrame(e)) {
        ctx.strokeStyle = "#ffffff"
    }
		
		ctx.globalAlpha = savedAlpha * 0.4;
    ctx.beginPath();
    ctx.lineTo(0, 0);
    for (let i of e.childIds) {
        if (room.enemies[i]) {
            ctx.lineTo(room.enemies[i].render.x - e.render.x, room.enemies[i].render.y - e.render.y);
        }
    }
    ctx.stroke();
    ctx.closePath();

    ctx.lineWidth = e.render.radius * 1.5;
    ctx.strokeStyle = blendColor('#48258a', "#FF0000", Math.max(0, blendAmount(e)));
    if (checkForFirstFrame(e)) {
        ctx.strokeStyle = "#ffffff";
    }
		
		ctx.globalAlpha = savedAlpha * 0.4;
    ctx.beginPath();
    ctx.lineTo(0, 0);
    for (let i of e.childIds) {
        if (room.enemies[i]) {
            ctx.lineTo(room.enemies[i].render.x - e.render.x, room.enemies[i].render.y - e.render.y);
        }
    }
    ctx.stroke();
    ctx.closePath();

		if (e.lastShocked == 0) {
			e.renderShock = [];
			for (let i = 0; i < e.shock.length; i++) {
				let value = e.shock[i];
				if (i == 0) {
					e.renderShock.push(value);
				} else {
					let average1 = {};
					average1.x = value.x * 1 / 3 + e.shock[i - 1].x * 2 / 3;
					average1.y = value.y * 1 / 3 + e.shock[i - 1].y * 2 / 3;
					let average2 = {};
					average2.x = value.x * 2 / 3 + e.shock[i - 1].x * 1 / 3;
					average2.y = value.y * 2 / 3 + e.shock[i - 1].y * 1 / 3;
					let diff = Math.sqrt((value.y - e.shock[i - 1].y) ** 2 + (value.x - e.shock[i - 1].x) ** 2)
					average1.x += (Math.random() * diff / 5 - diff / 10)
					average1.y += (Math.random() * diff / 5 - diff / 10)
					e.renderShock.push(average1);
					e.renderShock.push(average2);
					e.renderShock.push(value);
				}
			}
		}

		
		if (e.lastShocked < 100) {
			ctx.globalAlpha = (1 - e.lastShocked / 100);
			ctx.strokeStyle = "white";
			ctx.lineWidth = 5;
			if (e.team == "flower"){
				ctx.strokeStyle = "yellow";
				ctx.lineWidth = 6;
			}
			ctx.beginPath();
			for (let i = 0; i < e.renderShock.length; i++) {
				ctx.lineTo(e.renderShock[i].x - e.render.x, e.renderShock[i].y - e.render.y);
			}
			ctx.stroke();
			ctx.closePath();
		}

		ctx.globalAlpha = savedAlpha;

	},
	"Electric Eel":  (e) => {
		let savedAlpha = ctx.globalAlpha;
    if (e.isInEnemyBox || e.isMenuEnemy) {
        if (e.isMenuEnemy === true) {
            ctx.rotate(e.angle);
        }
        ctx.lineWidth = e.radius * 0.07;
				
				ctx.globalAlpha = savedAlpha * 0.4;
        ctx.strokeStyle = '#ffffff'
        ctx.rotate(-Math.PI * 3 / 4)
        ctx.beginPath();
        ctx.lineTo(e.render.radius * 0.93, e.render.radius * -0.12);
        ctx.quadraticCurveTo(e.render.radius * 1.1, e.render.radius * -0.12, e.render.radius * 1.25, e.render.radius * 0.16)
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineTo(e.render.radius * 0.91, e.render.radius * 0.18);
        ctx.quadraticCurveTo(e.render.radius * 0.94, e.render.radius * 0.24, e.render.radius * 1.13, e.render.radius * 0.3)
        ctx.stroke();
        ctx.closePath();

        ctx.lineJoin = "round";
        ctx.lineCap = "round"
        ctx.lineWidth = e.radius * 0.455;
        ctx.beginPath();
        ctx.lineTo(e.render.radius * -0.92, e.render.radius * 0);
        ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.55, e.render.radius * 0.92, e.render.radius * 0)
        ctx.stroke();
        ctx.closePath();

				
				ctx.globalAlpha = savedAlpha * 0.4;
        ctx.lineWidth = e.radius * 0.305;
        ctx.strokeStyle = '#ffffff';

        ctx.beginPath();
        ctx.lineTo(e.render.radius * -0.92, e.render.radius * 0);
        ctx.quadraticCurveTo(e.render.radius * 0, e.render.radius * -0.55, e.render.radius * 0.92, e.render.radius * 0)
        ctx.stroke();
        ctx.closePath();
        ctx.rotate(Math.PI * 3 / 4)
        if (e.isMenuEnemy === true) {
            ctx.rotate(-e.angle);
        }
				
				ctx.globalAlpha = savedAlpha;
        return;
    }
    if (!e.childIds) {
        if (!e.isChild) e.isChild = false
        if (!e.parentId && e.isChild !== true) {
            for (let id in room.enemies) {
                let enemy = room.enemies[id]
                if (enemy.type !== e.type) continue
                if (enemy.childIds) {
                    enemy.childIds.includes(e.id) ? e.isChild = true : ''
                }
            }
        }

        if (e.team === 'flower' || !e.isChild) {
            ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));;
            ctx.lineWidth = e.render.radius / 2.36;

            ctx.rotate(e.render.angle);

            // let angle = Math.cos(window.performance.now()/120)*0.12;
            const inwardsOffset = Math.cos(time / 96) * e.render.radius * 0.024;
            // ctx.rotate(angle);
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(e.render.radius * 0.48, e.render.radius * 0.45);
            ctx.quadraticCurveTo(e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, e.render.radius * 1.38 - inwardsOffset, -e.render.radius * .48);
            ctx.stroke();
            ctx.closePath();
            // ctx.rotate(-angle);

            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.moveTo(-e.render.radius * 0.48, e.render.radius * 0.45);
            ctx.quadraticCurveTo(-e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, -e.render.radius * 1.38 + inwardsOffset, -e.render.radius * .48);
            ctx.stroke();
            ctx.closePath();

            ctx.rotate(-Math.PI * 2 / 3 - Math.PI / 6);
            ctx.rotate(-e.render.angle);

							
						ctx.globalAlpha = savedAlpha * 0.4;
            ctx.beginPath()
            ctx.lineWidth = e.render.radius * 2;
            ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
            ctx.lineTo(0, 0)
            ctx.stroke()

						
						ctx.globalAlpha = savedAlpha * 0.4;
            ctx.lineWidth = e.render.radius * 1.5;
            ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
            ctx.lineTo(0, 0)
            ctx.stroke()
            ctx.closePath()
        }
				
				ctx.globalAlpha = savedAlpha;
        return
    }

		// draw head and clip so that legs dont appear insider body
		ctx.save();
		let p = new Path2D();
		p.rect(-10000, -10000, 20000, 20000);
		p.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.clip(p, "evenodd");

    // legs
    ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));;
    ctx.lineWidth = e.render.radius / 2.36;
		
		ctx.globalAlpha = savedAlpha * 0.2;
    if (checkForFirstFrame(e)) {
        ctx.fillStyle = "#ffffff"; //"#FFFFFF";
        ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
    }

    ctx.rotate(e.render.angle);

    // let angle = Math.cos(window.performance.now()/120)*0.12;
    const inwardsOffset = Math.cos(time / 96) * e.render.radius * 0.024;
    // ctx.rotate(angle);
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(e.render.radius * 0.48, e.render.radius * 0.45);
    ctx.quadraticCurveTo(e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, e.render.radius * 1.38 - inwardsOffset, -e.render.radius * .48);
    ctx.stroke();
    ctx.closePath();
    // ctx.rotate(-angle);

    ctx.rotate(Math.PI * 2 / 3);
    ctx.beginPath();
    ctx.moveTo(-e.render.radius * 0.48, e.render.radius * 0.45);
    ctx.quadraticCurveTo(-e.render.radius * 1.03 - inwardsOffset / 2, e.render.radius * .03, -e.render.radius * 1.38 + inwardsOffset, -e.render.radius * .48);
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-Math.PI * 2 / 3 - Math.PI / 6);

    ctx.rotate(-e.render.angle);

    ctx.restore();
    ctx.lineWidth = e.render.radius * 2;

    ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
    if (checkForFirstFrame(e)) {
        ctx.strokeStyle = "#ffffff"
    }
		
		ctx.globalAlpha = savedAlpha * 0.4;
    ctx.beginPath();
    ctx.lineTo(0, 0);
    for (let i of e.childIds) {
        if (room.enemies[i]) {
            ctx.lineTo(room.enemies[i].render.x - e.render.x, room.enemies[i].render.y - e.render.y);
        }
    }
    ctx.stroke();
    ctx.closePath();

    ctx.lineWidth = e.render.radius * 1.5;
    ctx.strokeStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
    if (checkForFirstFrame(e)) {
        ctx.strokeStyle = "#ffffff";
    }
		
		ctx.globalAlpha = savedAlpha * 0.4;
    ctx.beginPath();
    ctx.lineTo(0, 0);
    for (let i of e.childIds) {
        if (room.enemies[i]) {
            ctx.lineTo(room.enemies[i].render.x - e.render.x, room.enemies[i].render.y - e.render.y);
        }
    }
    ctx.stroke();
    ctx.closePath();

		if (e.lastShocked == 0) {
			e.renderShock = [];
			for (let i = 0; i < e.shock.length; i++) {
				let value = e.shock[i];
				if (i == 0) {
					e.renderShock.push(value);
				} else {
					let average1 = {};
					average1.x = value.x * 1 / 3 + e.shock[i - 1].x * 2 / 3;
					average1.y = value.y * 1 / 3 + e.shock[i - 1].y * 2 / 3;
					let average2 = {};
					average2.x = value.x * 2 / 3 + e.shock[i - 1].x * 1 / 3;
					average2.y = value.y * 2 / 3 + e.shock[i - 1].y * 1 / 3;
					let diff = Math.sqrt((value.y - e.shock[i - 1].y) ** 2 + (value.x - e.shock[i - 1].x) ** 2)
					average1.x += (Math.random() * diff / 5 - diff / 10)
					average1.y += (Math.random() * diff / 5 - diff / 10)
					e.renderShock.push(average1);
					e.renderShock.push(average2);
					e.renderShock.push(value);
				}
			}
		}

		
		if (e.lastShocked < 100) {
			ctx.globalAlpha = (1 - e.lastShocked / 100);
			ctx.strokeStyle = "white";
			ctx.lineWidth = 5;
			if (e.team == "flower"){
				ctx.strokeStyle = "yellow";
				ctx.lineWidth = 6;
			}
			ctx.beginPath();
			for (let i = 0; i < e.renderShock.length; i++) {
				ctx.lineTo(e.renderShock[i].x - e.render.x, e.renderShock[i].y - e.render.y);
			}
			ctx.stroke();
			ctx.closePath();
		}

		ctx.globalAlpha = savedAlpha;

	},
	"Plastic": (e) => {
		ctx.lineWidth = e.render.radius / 8;

		ctx.fillStyle = blendColor("#eeeeee", "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor("#cccccc", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		if (!e.data){e.data = []};
		if (!e.data[0]){e.data[0] = 0};
		e.data[0] += Math.sin(time / 2000) / 300
		ctx.rotate(e.data[0])
		ctx.beginPath();
		ctx.lineTo(e.radius * -1, e.radius * -0.75);
		ctx.lineTo(e.radius * -0.75, e.radius * 0.5);
		ctx.lineTo(0, 0);
		ctx.lineTo(e.radius * 0.5, 0);
		ctx.lineTo(0, -e.radius * 0.75);
		ctx.lineTo(e.radius * -1, e.radius * -0.75);
		ctx.fill()
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = blendColor("#097ce6", "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor("#3e47cc", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.beginPath();
		ctx.lineTo(-e.radius * 1, e.radius * 0.5);
		ctx.lineTo(e.radius * -0.5, e.radius * -0.25);
		ctx.lineTo(e.radius * 0.5, e.radius * 0.75);
		ctx.lineTo(e.radius * -0.25, e.radius * 0.75);
		ctx.lineTo(e.radius * -1, e.radius * 0.5);
		ctx.fill()
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = blendColor("#30c006", "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor("#36d349", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.beginPath();
		ctx.lineTo(e.radius * -0.5, e.radius * -1);
		ctx.lineTo(e.radius * -0.75, e.radius * -0.25);
		ctx.lineTo(e.radius * -0.5, e.radius * 0.25);
		ctx.lineTo(0, e.radius * 0.25);
		ctx.lineTo(0, e.radius * -0.75);
		ctx.lineTo(e.radius * -0.5, e.radius * -1);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = blendColor("#9e9e9e", "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor("#c2c2c2", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.beginPath();
		ctx.lineTo(e.radius, e.radius * -1);
		ctx.lineTo(e.radius * -0.25, e.radius * -0.75);
		ctx.lineTo(e.radius * 0.25, e.radius * 0.5);
		ctx.lineTo(e.radius * 0.75, 0);
		ctx.lineTo(e.radius *0.5, e.radius * -0.5);
		ctx.lineTo(e.radius, -e.radius);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.fillStyle = blendColor("#964545", "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor("#833a3a", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.lineTo(e.radius, e.radius * 0.75);
		ctx.lineTo(e.radius * 0.75, e.radius * -0.25);
		ctx.lineTo(-e.radius * 0.5, e.radius * 0.5);
		ctx.lineTo(0, e.radius * 1);
		ctx.lineTo(e.radius * 1, e.radius * 0.75);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.data[0])
	},
	"Shiny Plastic": (e) => {
		ctx.lineWidth = e.render.radius / 8;

		ctx.fillStyle = blendColor('#d4d46a', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#a3a350', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		if (!e.data){e.data = []};
		if (!e.data[0]){e.data[0] = 0};
		e.data[0] += Math.sin(time / 2000) / 300
		ctx.rotate(e.data[0])
		ctx.beginPath();
		ctx.lineTo(e.radius * -1, e.radius * -0.75);
		ctx.lineTo(e.radius * -0.75, e.radius * 0.5);
		ctx.lineTo(0, 0);
		ctx.lineTo(e.radius * 0.5, 0);
		ctx.lineTo(0, -e.radius * 0.75);
		ctx.lineTo(e.radius * -1, e.radius * -0.75);
		ctx.fill()
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = blendColor('#b8533a', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#9e4731', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.beginPath();
		ctx.lineTo(-e.radius * 1, e.radius * 0.5);
		ctx.lineTo(e.radius * -0.5, e.radius * -0.25);
		ctx.lineTo(e.radius * 0.5, e.radius * 0.75);
		ctx.lineTo(e.radius * -0.25, e.radius * 0.75);
		ctx.lineTo(e.radius * -1, e.radius * 0.5);
		ctx.fill()
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = blendColor('#cca104', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#a88503', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.beginPath();
		ctx.lineTo(e.radius * -0.5, e.radius * -1);
		ctx.lineTo(e.radius * -0.75, e.radius * -0.25);
		ctx.lineTo(e.radius * -0.5, e.radius * 0.25);
		ctx.lineTo(0, e.radius * 0.25);
		ctx.lineTo(0, e.radius * -0.75);
		ctx.lineTo(e.radius * -0.5, e.radius * -1);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = blendColor('#ffea00', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#b5a921', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.beginPath();
		ctx.lineTo(e.radius, e.radius * -1);
		ctx.lineTo(e.radius * -0.25, e.radius * -0.75);
		ctx.lineTo(e.radius * 0.25, e.radius * 0.5);
		ctx.lineTo(e.radius * 0.75, 0);
		ctx.lineTo(e.radius *0.5, e.radius * -0.5);
		ctx.lineTo(e.radius, -e.radius);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();
		ctx.fillStyle = blendColor('#ab3737', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#8a2c2c', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; 
			ctx.strokeStyle = "#ffffff" 
		}
		ctx.lineTo(e.radius, e.radius * 0.75);
		ctx.lineTo(e.radius * 0.75, e.radius * -0.25);
		ctx.lineTo(-e.radius * 0.5, e.radius * 0.5);
		ctx.lineTo(0, e.radius * 1);
		ctx.lineTo(e.radius * 1, e.radius * 0.75);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.data[0])
	},
	PeasMissile: (e) => {
		/*
		ctx.lineWidth = p.radius/divCoef/2.5//2.2;
		// ctx.beginPath();
		ctx.fillStyle = blendColor('#8ac255', '#FF0000', blendAmount(p));
		ctx.strokeStyle = blendColor('#709d45', '#FF0000', blendAmount(p));
		if(checkForFirstFrame(p)){
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "#FFFFFF";
		}
		
		ctx.beginPath();
		ctx.arc(0, 0, p.radius, 0, Math.PI*2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		*/
		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = blendColor('#8ac255', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#709d45', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	GrapesMissile: (e) => {
		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = blendColor('#ce76db', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#a760b1', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	BiggestDesertMissile: (e) => {
		ctx.lineWidth = e.render.radius / 6;

		ctx.fillStyle = blendColor('#877c2e', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#59521e', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 11 / 12, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	BigDesertMissile: (e) => {
		ctx.lineWidth = e.render.radius / 6;

		ctx.fillStyle = blendColor('#877c2e', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#59521e', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 11 / 12, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	
	Dummy: (e) => {
		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = blendColor('#696969', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#404040', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	"Sea Urchin": (e) => {
		ctx.lineWidth = e.render.radius / 6;
		e.render.time += dt;

		ctx.fillStyle = blendColor('#452930', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#341f24', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		let oldAlpha = ctx.globalAlpha;

		ctx.globalAlpha = oldAlpha * 0.1;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
		ctx.globalAlpha = oldAlpha;
		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 1 / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(e.render.angle);
		for (let i = 18; i > 0; i--) {
			let offset = Math.cos(e.render.time / 500 + i * Math.PI / 1.45) / 4;
			ctx.rotate(Math.PI * 1 / 9 * i)
			ctx.beginPath();
			ctx.moveTo(e.render.radius * 0.4, 0);
			ctx.lineTo(e.render.radius * (1.2 + offset), 0)
			ctx.stroke();
			ctx.closePath();
			ctx.rotate(-Math.PI * 1 / 9 * i)
		}
		ctx.rotate(-e.render.angle)

	},
	"Invincible Urchin": (e) => {
		enemyRenderMap["Sea Urchin"](e);
	},
	Lilypad: (e) => {
		ctx.lineWidth = e.render.radius * 0.15
		let colorA = blendColor('#39b54a', '#FF0000', blendAmount(e));
		let colorB = blendColor('#2e933c', '#FF0000', blendAmount(e));
		let colorC = blendColor('#33a443', '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) {
			colorA = "#FFFFFF";
			colorB = "#FFFFFF";
			colorC = "#FFFFFF";
			blossomA = "#FFFFFF";
			blossomB = "#FFFFFF";
		}

		ctx.rotate(e.data[1])
		ctx.fillStyle = colorC
		ctx.strokeStyle = colorB
		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * e.data[0]);
		ctx.lineTo(0, 0)
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = colorA
		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius * 0.66, 0, Math.PI * e.data[0]);
		ctx.lineTo(0, 0)
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * e.data[0]);
		ctx.lineTo(0, 0)
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.data[1])
	},
	"Flowering Lilypad": (e) => {
		ctx.lineWidth = e.render.radius * 0.15
		let colorA = blendColor('#39b54a', '#FF0000', blendAmount(e));
		let colorB = blendColor('#2e933c', '#FF0000', blendAmount(e));
		let colorC = blendColor('#33a443', '#FF0000', blendAmount(e));
		let blossomA = blendColor('#ff94c9', '#FF0000', blendAmount(e));
		let blossomB = blendColor('#cf78a3', '#FF0000', blendAmount(e));
		let blossomC = blendColor('#ffe419', '#FF0000', blendAmount(e));
        let blossomD = blendColor('#cfb914', '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) {
			colorA = "#FFFFFF";
			colorB = "#FFFFFF";
			colorC = "#FFFFFF";
			blossomA = "#FFFFFF";
			blossomB = "#FFFFFF";
			blossomC = "#FFFFFF";
			blossomD = "#FFFFFF";
		}

		ctx.rotate(e.data[1])
		ctx.fillStyle = colorC
		ctx.strokeStyle = colorB
		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * e.data[0]);
		ctx.lineTo(0, 0)
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = colorA
		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius * 0.66, 0, Math.PI * e.data[0]);
		ctx.lineTo(0, 0)
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * e.data[0]);
		ctx.lineTo(0, 0)
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = blossomA
		ctx.strokeStyle = blossomB
		for (let i = 0; i < 8; i++) {
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.quadraticCurveTo(e.render.radius * 0.5, e.render.radius * 0.25, e.render.radius * 0.75, 0);
			ctx.quadraticCurveTo(e.render.radius * 0.5, e.render.radius * -0.25, 0, 0);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
			ctx.rotate(Math.PI / 4);
		}
		
		ctx.fillStyle = blossomC
		ctx.strokeStyle = blossomD
		ctx.lineWidth = e.render.radius * 0.075

		ctx.beginPath()
		ctx.arc(0, 0, e.render.radius * 0.1, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		
		ctx.rotate(-e.data[1])
	},
	"Shiny Lilypad": (e) => {
		ctx.lineWidth = e.render.radius * 0.15
		let colorA = blendColor('#ebeb34', '#FF0000', blendAmount(e));
		let colorB = blendColor('#c0c02a', '#FF0000', blendAmount(e));
		let colorC = blendColor('#d5d52f', '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) {
			colorA = "#FFFFFF";
			colorB = "#FFFFFF";
			colorC = "#FFFFFF";
		}

		ctx.fillStyle = colorC
		ctx.strokeStyle = colorB

		let arcA = Math.PI - Math.PI * e.data[0] / 2, arcB = Math.PI + Math.PI * e.data[0] / 2

		ctx.rotate(e.render.angle)
		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius, arcA, arcB);
		ctx.lineTo(0, 0)
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = colorA
		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius * 0.66, arcA, arcB);
		ctx.lineTo(0, 0)
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(0, 0)
		ctx.arc(0, 0, e.render.radius, arcA, arcB);
		ctx.lineTo(0, 0)
		ctx.stroke();
		ctx.closePath();
		ctx.rotate(-e.render.angle)
	},
	Tick: (e) => {
		e.render.time += Math.sqrt((e.render.lastX - e.render.x) ** 2 + (e.render.lastY - e.render.y) ** 2) * (1 - Math.sqrt(e.render.radius / 142.5) + 0.5) * 5;
		e.render.lastX = e.render.x;
		e.render.lastY = e.render.y;

		let body = blendColor("#695118", '#FF0000', blendAmount(e));
		let bodyBorder = blendColor("#554213", '#FF0000', blendAmount(e));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		// legs
		ctx.strokeStyle = "#292929";
		ctx.lineWidth = e.render.radius * 0.41;

		ctx.rotate(e.render.angle);

		ctx.translate(e.render.radius * -0.15, 0)

		let angle = Math.cos(time / 180 + e.render.time / 60) * 0.05;

		ctx.beginPath();

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * -0.45)
		ctx.rotate(angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * -0.59, e.render.radius * 1.53, e.render.radius * -0.31)
		ctx.rotate(-angle)

		ctx.moveTo(e.render.radius * 0.62, e.render.radius * 0.45)
		ctx.rotate(-angle)
		ctx.quadraticCurveTo(e.render.radius * 0.93, e.render.radius * 0.59, e.render.radius * 1.53, e.render.radius * 0.31)
		ctx.rotate(angle)

		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.15, e.render.radius * 0, e.render.radius * 0.89, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.translate(e.render.radius * 0.15, 0)

		ctx.rotate(-e.render.angle);
	},
	Coconut: (e) => {
		let body = blendColor("#4f412d", "#FF0000", Math.max(0, blendAmount(e)));
		let bodyBorder = blendColor("#403425", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			body = "#ffffff"; //"#FFFFFF";
			bodyBorder = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.fillStyle = body;
		ctx.strokeStyle = bodyBorder;
		ctx.lineWidth = e.render.radius * 0.15

		ctx.rotate(e.data);

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius, 0, Math.PI * 2)
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = bodyBorder;

		ctx.beginPath();
		ctx.arc(0, e.render.radius * 0.75, e.render.radius * 0.15, 0, Math.PI * 2)
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * 0.2, e.render.radius * 0.5, e.render.radius * 0.15, 0, Math.PI * 2)
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(e.render.radius * -0.2, e.render.radius * 0.5, e.render.radius * 0.15, 0, Math.PI * 2)
		ctx.fill();
		ctx.closePath();

		for (let i = 0; i < 50; i++) {
			ctx.beginPath();
			ctx.moveTo(0, e.render.radius)
			ctx.lineTo(0, e.render.radius * 1.1)
			ctx.stroke();
			ctx.closePath();
			ctx.rotate(Math.PI * 2 / 50)
		}

		ctx.rotate(-e.data);
	},
	default: (e) => {
		ctx.lineWidth = e.render.radius / 3;

		ctx.fillStyle = blendColor('#ffffff', "#FF0000", Math.max(0, blendAmount(e)));
		ctx.strokeStyle = blendColor('#000000', "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			ctx.fillStyle = "#ffffff"; //"#FFFFFF";
			ctx.strokeStyle = "#ffffff" //'#cecece';//blendColor("#FFFFFF", "#000000", 0.19);
		}

		ctx.beginPath();
		ctx.arc(0, 0, e.render.radius * 5 / 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	},
	Ruby: (e) => {
        let rot = performance.now()/500
		if (!e.baseAngle) e.baseAngle = e.angle

		ctx.rotate(e.baseAngle + rot)
        ctx.beginPath();
        ctx.fillStyle = blendColor("#e03f3f", '#FF0000', blendAmount(e));
        ctx.strokeStyle = blendColor("#a12222", '#FF0000', blendAmount(e));
        ctx.lineWidth = e.render.radius * 0.2;
        if (checkForFirstFrame(e)) {
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF"
        }
        ctx.rotate(Math.PI / 4)
        for (let i = 0; i <= 3; i++) {
            ctx.lineTo(Math.cos(i * Math.PI * 2 / 3) * e.render.radius, Math.sin(i * Math.PI * 2 / 3) * e.render.radius);
        }
        ctx.rotate(-Math.PI / 4)
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle = blendColor(blendColor("#e03f3f", '#ffffff', 0.3), '#FF0000', blendAmount(e));
        if (checkForFirstFrame(e)) {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.rotate(Math.PI / 4)
        for (let i = 0; i <= 3; i++) {
            ctx.lineTo(Math.cos(i * Math.PI * 2 / 3) * e.render.radius * 0.4, Math.sin(i * Math.PI * 2 / 3) * e.render.radius * 0.4);
        }
        ctx.rotate(-Math.PI / 4)
        ctx.fill();
        ctx.closePath();   
		ctx.rotate(-e.baseAngle - rot)   
    },
	Dauber: (e) => {
		let bodyColor = blendColor("#eaa749", "#FF0000", Math.max(0, blendAmount(e)));
		let stripesColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
			stripesColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		ctx.rotate(e.render.angle + Math.PI / 2);

		// stinger/ tail thing
		ctx.strokeStyle = stripesColor;
		ctx.fillStyle = stripesColor;
		ctx.lineWidth = e.render.radius / 6;
		ctx.beginPath();
		ctx.moveTo(0, e.render.radius * 1.4);
		ctx.lineTo(-e.render.radius * 0.16, e.render.radius * 0.94);
		ctx.lineTo(e.render.radius * 0.16, e.render.radius * 0.94);
		ctx.lineTo(0, e.render.radius * 1.4);
		ctx.stroke();
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = bodyColor;
		//ctx.save();

		// body fill
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.fill();

		//ctx.clip();

		// stripes
		/*
		ctx.fillStyle = stripesColor;
		ctx.fillRect(-e.render.radius, -e.render.radius * 2 / 3, e.render.radius * 2, e.render.radius / 3);
		ctx.fillRect(-e.render.radius, 0, e.render.radius * 2, e.render.radius / 3);
		ctx.fillRect(-e.render.radius, e.render.radius * 2 / 3, e.render.radius * 2, e.render.radius / 3);
		*/
		ctx.fillStyle = stripesColor;
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 0.45, -e.render.radius * 2 / 3);
		ctx.lineTo(-e.render.radius * 0.55, -e.render.radius * 1 / 3);
		ctx.lineTo(e.render.radius * 0.55, -e.render.radius * 1 / 3);
		ctx.lineTo(e.render.radius * 0.45, -e.render.radius * 2 / 3);
		ctx.fill();
		ctx.fillRect(-e.render.radius * 0.65, 0, e.render.radius * 2 * 0.65, e.render.radius / 3);
		ctx.beginPath();
		ctx.moveTo(-e.render.radius * 0.45, e.render.radius * 2 / 3);
		ctx.lineTo(-e.render.radius * 0.15, e.render.radius);
		ctx.lineTo(e.render.radius * 0.15, e.render.radius);
		ctx.lineTo(e.render.radius * 0.45, e.render.radius * 2 / 3);
		ctx.fill();


		//ctx.restore();

		ctx.strokeStyle = blendColor(bodyColor, "#000000", 0.19);
		if (checkForFirstFrame(e)) {
			ctx.strokeStyle = '#FFFFFF';
		}
		ctx.lineWidth = e.render.radius * .15;

		// body stroke
		ctx.beginPath();
		ctx.ellipse(0, 0, e.render.radius * 2 / 3, e.render.radius, 0, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();

		// antennae
		ctx.fillStyle = stripesColor;
		ctx.strokeStyle = stripesColor;
		ctx.lineWidth = e.render.radius / 10;
		ctx.beginPath();
		ctx.moveTo(e.render.radius * .16, -e.render.radius * .85);
		ctx.quadraticCurveTo(e.render.radius * .18, -e.render.radius * 1.36, e.render.radius * .49, -e.render.radius * 1.68);
		ctx.quadraticCurveTo(e.render.radius * .3, -e.render.radius * 1.26, e.render.radius * .16, -e.render.radius * .85);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.moveTo(-e.render.radius * .16, -e.render.radius * .85);
		ctx.quadraticCurveTo(-e.render.radius * .18, -e.render.radius * 1.36, -e.render.radius * .49, -e.render.radius * 1.68);
		ctx.quadraticCurveTo(-e.render.radius * .3, -e.render.radius * 1.26, -e.render.radius * .16, -e.render.radius * .85);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	DauberMissile: (e) => {
		let bodyColor = blendColor("#333333", "#FF0000", Math.max(0, blendAmount(e)));
		if (checkForFirstFrame(e)) {
			bodyColor = "#FFFFFF";
		}

		ctx.lineJoin = 'round';

		// body
		ctx.rotate(e.render.angle + Math.PI / 2);

		// TODO: actually finish this render
		ctx.beginPath();
		ctx.fillStyle = bodyColor;
		ctx.strokeStyle = bodyColor;
		ctx.lineWidth = e.render.radius / 1.5;

		ctx.moveTo(0, -e.render.radius * 1.4);
		ctx.lineTo(e.render.radius * 0.68, e.render.radius / 2 * 1.4);
		ctx.lineTo(-e.render.radius * 0.68, e.render.radius / 2 * 1.4);
		ctx.lineTo(0, -e.render.radius * 1.4);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		// hitbox
		// ctx.strokeStyle = 'blue';
		// ctx.lineWidth = 1;
		// ctx.beginPath();
		// ctx.arc(0,0,e.render.radius,0,Math.PI * 2);
		// ctx.stroke();
		// ctx.closePath();

		ctx.rotate(-e.render.angle - Math.PI / 2);
	},
	"Palisade Core": (e) => {
        let rot = performance.now()/500
		if (!e.baseAngle) e.baseAngle = e.angle

		ctx.rotate(e.baseAngle + rot)
        ctx.beginPath();
        ctx.fillStyle = blendColor("#e03f3f", '#FF0000', blendAmount(e));
        ctx.strokeStyle = blendColor("#a12222", '#FF0000', blendAmount(e));
        ctx.lineWidth = e.render.radius * 0.2;
        if (checkForFirstFrame(e)) {
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#FFFFFF"
        }
        ctx.rotate(Math.PI / 4)
        for (let i = 0; i <= 3; i++) {
            ctx.lineTo(Math.cos(i * Math.PI * 2 / 3) * e.render.radius, Math.sin(i * Math.PI * 2 / 3) * e.render.radius);
        }
        ctx.rotate(-Math.PI / 4)
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle = blendColor(blendColor("#e03f3f", '#ffffff', 0.3), '#FF0000', blendAmount(e));
        if (checkForFirstFrame(e)) {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.rotate(Math.PI / 4)
        for (let i = 0; i <= 3; i++) {
            ctx.lineTo(Math.cos(i * Math.PI * 2 / 3) * e.render.radius * 0.4, Math.sin(i * Math.PI * 2 / 3) * e.render.radius * 0.4);
        }
        ctx.rotate(-Math.PI / 4)
        ctx.fill();
        ctx.closePath();   
		ctx.rotate(-e.baseAngle - rot)   
    },
	// for drawing stuff made in editor.
	Custom: (p) => {
		const shapes = editorEnemyShapesMap[p.customType];
		if (shapes === undefined && Math.random() > 0.05) {
			console.warn('path undefined for enemy type ' + p.customType);
			return;
		}
		const lastGA = p.dead === true ? 1 : Math.min(1, ctx.globalAlpha);
		ctx.fillOpacity = 1;
		ctx.strokeOpacity = 1;
		ctx.lineWidth = .3;
		ctx.save();
		ctx.rotate(p.render.angle, p.render.angle);
		ctx.scale(p.render.radius, p.render.radius);
		let blendAmt = blendAmount(p);
		if (checkForFirstFrame(p)) {
			window.overrideBlendColor = [1, "#FFFFFF"];
		} else if (blendAmt > 0) {
			if (p.isCustomSummon === true) {
				window.overrideBlendColor = [1, blendColor("#fee864", "#FF0000", blendAmt)];
			} else {
				window.overrideBlendColor = [blendAmt, "#FF0000"];
			}
		} else if (p.isCustomSummon === true) {
			window.overrideBlendColor = [0.8, "#fee864"];
		} else {
			window.overrideBlendColor = undefined;
		}
		ctx.setGlobalAlpha(1);
		ctx.setFillStyle('#FFFFFF');
		ctx.setStrokeStyle('#cfcfcf');
		for (let i = 0; i < shapes.length; i++) {
			ctx.beginPath();
			for (let j = 0; j < shapes[i].length; j++) {
				ctx[shapes[i][j][0]](...shapes[i][j].slice(1));
			}
			ctx.setGlobalAlpha(ctx.fillOpacity * lastGA);
			ctx.fill();
			ctx.setGlobalAlpha(ctx.strokeOpacity * lastGA);
			ctx.stroke();
			ctx.closePath();
			ctx.setGlobalAlpha(1, true);
		}
		ctx.restore();

		// if there's nothing rendering
		if (shapes.length === 1 && shapes[0].length === 0) {
			if (p.data === undefined) {
				p.data = enemyDataMap["Ladybug"](this);
			}
			normalEnemyRenderMap.Ladybug(p);
		}
	}
}

let enemyRenderMap;
enemyRenderMap = normalEnemyRenderMap;


function renderDamageCounter({
	radius,
	timeAlive,
	totalDamage
}) {
	let fallTime = 500;
	if (timeAlive < 500 && totalDamage !== 0) {
		ctx.fillStyle = "orange";
		ctx.strokeStyle = "#de5b00";
		ctx.lineWidth = 7;
		if (radius * 0.4 < 25) {
			ctx.font = `600 ${25}px 'Ubuntu'`;
		} else if (radius * 0.4 > 100) {
			ctx.font = `600 ${100}px 'Ubuntu'`;
		} else {
			ctx.font = `600 ${radius * 0.4}px 'Ubuntu'`;
		}
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.globalAlpha = 0.7 * (1 - timeAlive / fallTime);
		ctx.strokeText(formatAmountHighPrecision(Math.round(totalDamage)), 0, radius * 0.2 - (radius / 3 * (Math.cos(timeAlive / (75 * (fallTime / 275))))));
		ctx.fillText(formatAmountHighPrecision(Math.round(totalDamage)), 0, radius * 0.2 - (radius / 3 * (Math.cos(timeAlive / (75 * (fallTime / 275))))));
		ctx.globalAlpha = 1
		ctx.letterSpacing = "0px";
	}
};

function enemyRenderMapText(e) {
	renderHpBar({ // we've already translated to enemy renderX and renderY
		x: 0,
		y: 0,
		radius: e.render.radius * 0.8,
		hp: e.render.hp,
		maxHp: e.maxHp,
		beforeStreakHp: e.render.beforeStreakHp,
		team: e.team
	}, e);
	if (!window.isEditor === true && window.damageCounter) {
		renderDamageCounter({
			radius: e.render.radius,
			timeAlive: e.ticksSinceLastDamaged,
			totalDamage: e.damageCount,
		})
	}

	// const barDimensions = {
	// 	w: (e.render.radius * 0.8/25)**1.2*25*3.2+.33,
	// 	h: (e.render.radius * 0.8/25)**1.2*25*0.39+.33,
	// 	borderRadius: (e.render.radius * 0.8/25)**1.2*25*0.25,
	// 	innerPadding: (e.render.radius * 0.8/25)**0.8*1.8-.1
	// }

	// ctx.fillStyle = "white";
	// ctx.lineWidth = 2 + (e.render.radius ** 1.5) / 1500;

	// ctx.strokeStyle = "black";
	// ctx.font = `600 ${e.render.radius * 0.8*.32+.33}px 'Ubuntu'`;
	// ctx.textAlign = "left";
	// ctx.textBaseline = "bottom";
	// ctx.strokeText(e.type, -barDimensions.w/2 + 3, e.render.radius * 0.8 * 1.775 - 2);
	// ctx.fillText(e.type, -barDimensions.w/2 + 3, e.render.radius * 0.8 * 1.775 - 2);

	// ctx.fillStyle = Colors.rarities[e.rarity].color;
	// ctx.font = `600 ${e.render.radius * 0.8*.32+.33}px 'Ubuntu'`;
	// ctx.textAlign = "right";
	// ctx.textBaseline = "top";
	// ctx.strokeText(Colors.rarities[e.rarity].name, barDimensions.w/2, e.render.radius * 0.8 * 1.775 + barDimensions.h + 2);
	// ctx.fillText(Colors.rarities[e.rarity].name, barDimensions.w/2, e.render.radius * 0.8 * 1.775 + barDimensions.h + 2);

	// -----

	// const barDimensions = {
	// 	w: (radius/25)**1.2*25*3.2+.33,
	// 	h: (radius/25)**1.2*25*0.39+.33,
	// 	borderRadius: (radius/25)**1.2*25*0.25,
	// 	innerPadding: (radius/25)**0.8*1.8-.1
	// }
	// hp = Math.max(hp, 0);
	// beforeStreakHp = Math.max(beforeStreakHp, 0);
	// ctx.fillStyle = /*isEnemy ? '#131315' : */'#333333';
	// ctx.beginPath();
	// ctx.roundRect(x - barDimensions.w/2, y + radius*1.775, barDimensions.w, barDimensions.h, barDimensions.borderRadius);
	// ctx.fill();
	// ctx.closePath();

	// ----

	// ctx.fillStyle = '#333333';
	// ctx.beginPath();
	// ctx.roundRect(- e.radius, e.radius + 19, (e.radius * 2), 10, 10);
	// ctx.fill();

	// ctx.fillStyle = '#73de36';
	// ctx.beginPath();
	// ctx.roundRect(- e.radius + 1, e.radius + 20, (e.radius * 2) * (e.hp / e.maxHp) - 2, 10 - 2, 10);
	// ctx.fill();
}

const memoizedColors = {};

function blendColor(color1, color2, t) {
	const memoizedIndex = color1 + '_' + color2 + '_' + t
	if (memoizedColors[memoizedIndex] !== undefined) {
		return memoizedColors[memoizedIndex];
	}
	const rgb1 = {
		r: parseInt(color1.slice(1, 3), 16),
		g: parseInt(color1.slice(3, 5), 16),
		b: parseInt(color1.slice(5, 7), 16)
	}
	const rgb2 = {
		r: parseInt(color2.slice(1, 3), 16),
		g: parseInt(color2.slice(3, 5), 16),
		b: parseInt(color2.slice(5, 7), 16)
	}

	const result = rgbToHex(Math.floor(rgb1.r * (1 - t) + rgb2.r * t), Math.floor(rgb1.g * (1 - t) + rgb2.g * t), Math.floor(rgb1.b * (1 - t) + rgb2.b * t))
	memoizedColors[memoizedIndex] = result;
	return result;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}