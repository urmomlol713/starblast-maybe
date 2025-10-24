const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false
};
let player, enemies = [],
    drones = [],
    gems = [],
    powerUps = [];
let tier = 1,
    gemsCollected = 0,
    bossCount = 0;
let storeOpen = false;

class Entity {
    constructor(x, y, r, color) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Player extends Entity {
    constructor() {
        super(canvas.width / 2, canvas.height / 2, 20, "#0ff");
        this.angle = 0;
        this.energy = 100;
        this.health = 100;
    }
    update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        this.angle = Math.atan2(dy, dx);
        if (mouse.right) {
            this.vx += Math.cos(this.angle) * 0.2;
            this.vy += Math.sin(this.angle) * 0.2;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.energy = Math.min(100, this.energy + 0.2 * tier);
    }
    shoot() {
        if (this.energy > 5) {
            bullets.push(new Bullet(this.x, this.y, this.angle, 10 * tier));
            this.energy -= 5;
        }
    }
}

class Bullet extends Entity {
    constructor(x, y, angle, speed) {
        super(x, y, 4, "#fff");
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Enemy extends Entity {
    constructor() {
        super(Math.random() * canvas.width, Math.random() * canvas.height, 15, "#f00");
        this.health = 20 * tier;
    }
    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        this.vx = (dx / dist) * 1.5;
        this.vy = (dy / dist) * 1.5;
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Boss extends Entity {
    constructor() {
        super(canvas.width / 2, -100, 80, "#ff00ff");
        this.health = 1000 * tier;
        this.phase = 1;
    }
    update() {
        if (this.y < canvas.height / 3) this.y += 1;
        if (Math.random() < 0.02) this.fire();
    }
    fire() {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            bulletsEnemy.push(new Bullet(this.x, this.y, angle, 5));
        }
    }
}

let bullets = [];
let bulletsEnemy = [];

function spawnEnemies() {
    while (enemies.length < 6) enemies.push(new Enemy());
}

function spawnBoss() {
    bossCount++;
    enemies = [];
    currentBoss = new Boss();
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    player.draw();

    bullets.forEach((b, i) => {
        b.update();
        b.draw();
        enemies.forEach((e, j) => {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < e.r + b.r) {
                e.health -= 20 * tier;
                bullets.splice(i, 1);
                if (e.health <= 0) {
                    enemies.splice(j, 1);
                    gemsCollected += 5;
                    if (gemsCollected % 100 === 0) spawnBoss();
                }
            }
        });
    });

    enemies.forEach(e => {
        e.update();
        e.draw();
    });

    if (currentBoss) {
        currentBoss.update();
        currentBoss.draw();
        if (currentBoss.health <= 0) {
            currentBoss = null;
            tier++;
        }
    }

    document.getElementById("energyFill").style.width = player.energy + "%";
    document.getElementById("healthFill").style.width = player.health + "%";
    document.getElementById("gemCount").textContent = "💎 " + gemsCollected;

    requestAnimationFrame(update);
}

player = new Player();
spawnEnemies();
update();

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener("mousedown", e => {
    if (e.button === 0) mouse.left = true;
    if (e.button === 2) mouse.right = true;
});
window.addEventListener("mouseup", e => {
    if (e.button === 0) mouse.left = false;
    if (e.button === 2) mouse.right = false;
});
window.addEventListener("contextmenu", e => e.preventDefault());
window.addEventListener("keydown", e => {
    if (e.key === "b") {
        storeOpen = !storeOpen;
        document.getElementById("store").classList.toggle("hidden", !storeOpen);
    }
    if (e.key === "r") location.reload();
});
document.getElementById("buyDrone").onclick = () => {
    if (gemsCollected >= 50) {
        gemsCollected -= 50;
        drones.push({});
    }
};
document.getElementById("upgradeTier").onclick = () => {
    if (gemsCollected >= 200) {
        gemsCollected -= 200;
        tier++;
    }
};
document.getElementById("closeStore").onclick = () => {
    storeOpen = false;
    document.getElementById("store").classList.add("hidden");
};
