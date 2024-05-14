class FlyFeeder extends Phaser.Scene {
    constructor() {
        super("flyFeeder");

        this.my = {sprite: {}, text: {}};
        this.my.sprite.bullet = [];   
        this.maxBullets = 7;           
        this.myScore = 0;
        this.gameOver = false; // Flag to track game over state
        this.win = false;
        this.flyInitialY = 80; // Initial Y position of flys
        this.highScore = localStorage.getItem('highScore') || 0; // Retrieve high score from local storage

    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("frog", "frog.png");
        this.load.image("leap", "frog_leap.png");
        this.load.image("fly", "fly.png");
        this.load.image("fly_dead", "fly_dead.png");
        this.load.image("fly_hit", "fly_hit.png");
        this.load.image("spinner", "spinner.png");


        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");

        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        this.load.audio("dadada", "jingles_NES13.ogg");
        this.load.audio("shoot", "friendly_shoot.wav");
        this.load.audio("lose", "lose.wav");
        this.load.audio("victory", "victory.wav");
    }

    create() {
        let my = this.my;

        my.sprite.frog = this.add.sprite(game.config.width / 2, game.config.height - 40, "frog");
        my.sprite.frog.setScale(1.7);

        my.sprite.leap = this.add.sprite(my.sprite.frog.x, my.sprite.frog.y, "leap");
        my.sprite.leap.setScale(1.7);
        my.sprite.leap.setVisible(false);

        my.sprite.right_leap = this.add.sprite(my.sprite.frog.x, my.sprite.frog.y, "leap");
        my.sprite.right_leap.setScale(1.7);
        my.sprite.right_leap.flipX = true;
        my.sprite.right_leap.visible = false;

        my.sprite.flys = [];
        let numflys = 7; 
        let flySpacing = game.config.width / (numflys + 1);

        for (let i = 0; i < numflys; i++) {
            let fly = this.add.sprite((i + 1) * flySpacing, this.flyInitialY, "fly"); // Adjusted initial Y position
            fly.setScale(.728);
            fly.scorePoints = 25;
            this.physics.add.existing(fly);
            my.sprite.flys.push(fly);
        }

        my.flyDirection = 1; 

        this.anims.create({
            key: "puff",
            frames: [
                { key: "fly_hit" },
                { key: "fly_dead" },
                { key: "fly_hit" },
                { key: "fly_dead" },
            ],
            frameRate: 20,   
            repeat: 5,
            hideOnComplete: true
        });

        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.nextScene = this.input.keyboard.addKey("S");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.playerSpeed = 15;
        this.bulletSpeed = 5;

        document.getElementById('description').innerHTML = '<h2>Fly Feeder.js</h2><br>A: left // D: right // Space: fire/emit // S: Next Scene'

        my.text.score = this.add.bitmapText(150, 0, "rocketSquare", "Score " + this.myScore);

        this.add.text(10, 5, "Fly Feeder", {
            fontFamily: 'Times, serif',
            fontSize: 24,
            wordWrap: {
                width: 60
            }
        });

        // Set up restart option
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.restartKey.on('down', this.restartGame, this);
    }

    update() {
        let my = this.my;
        my.sprite.frog.visible = true;
        my.sprite.leap.visible = false;
        my.sprite.right_leap.visible = false;

        if (this.gameOver) return; // If the game is over, stop updating
        if (this.win) return;

        // Player movement
        if (this.left.isDown) {
            if (my.sprite.frog.x > (my.sprite.frog.displayWidth / 2)) {
                my.sprite.frog.x -= this.playerSpeed;
                my.sprite.frog.visible = false;
                my.sprite.leap = my.sprite.leap;
                my.sprite.leap.x = my.sprite.frog.x;
                my.sprite.leap.y = my.sprite.frog.y;
                my.sprite.leap.visible = true;

            }
        } else if (this.right.isDown) {
            if (my.sprite.frog.x < (game.config.width - (my.sprite.frog.displayWidth / 2))) {
                my.sprite.frog.x += this.playerSpeed;
                my.sprite.frog.visible = false;
                my.sprite.right_leap.x = my.sprite.frog.x;
                my.sprite.right_leap.y = my.sprite.frog.y;
                my.sprite.right_leap.visible = true;
            }
        }

        // Update the position of the leap sprite to follow the frog
        my.sprite.leap.setPosition(my.sprite.frog.x, my.sprite.frog.y);

        // fly movement
        for (let fly of my.sprite.flys) {
            if (!fly.visible) continue; // Skip if the fly is not visible
            // Move towards the bottom of the screen in random patterns
            fly.x += (Math.round(Math.random()) * 2 - 1) * 10; // Random horizontal movement
            fly.y += 2; // Move downwards

            if (fly.x <= 0) {
                fly.x = 0;
                my.flyDirection = 1;
            } else if (fly.x >= game.config.width - fly.displayWidth) {
                fly.x = game.config.width - fly.displayWidth;
                my.flyDirection = -1;
            }

            if (fly.y > game.config.height || this.collides(fly, my.sprite.frog)) {
                // Game over if the fly reaches the bottom or collides with the player
                this.gameOver = true;
                this.showGameOver();
            }
        }

        // Bullet firing
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            if (my.sprite.bullet.length < this.maxBullets) {
                my.sprite.bullet.push(this.add.sprite(
                    my.sprite.frog.x, my.sprite.frog.y - (my.sprite.frog.displayHeight / 2), "spinner").setScale(0.5)
                );
                this.sound.play("shoot", {
                    volume: 1
                });
            }
        }

        // Remove off-screen bullets
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight / 2));

        // Move bullets
        for (let bullet of my.sprite.bullet) {
            bullet.y -= this.bulletSpeed;
        }

        // Bullet and fly collision detection
        for (let bullet of my.sprite.bullet) {
            for (let fly of my.sprite.flys) {
                if (!fly.visible) continue; // Skip if the fly is not visible
                if (this.collides(fly, bullet)) {
                    this.puff = this.add.sprite(fly.x, fly.y, "whitePuff03").setScale(0.728).play("puff");
                    bullet.y = -100;
                    fly.visible = false;
                    fly.x = -100;
                    this.myScore += fly.scorePoints;
                    this.updateScore();
                    this.sound.play("dadada", {
                        volume: 1
                    });
                    this.puff.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        fly.visible = true;
                        fly.x = Math.random() * config.width;
                        fly.y = 200;
                    }, this);

                }
            }
        }
    }

    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth / 2 + b.displayWidth / 2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight / 2 + b.displayHeight / 2)) return false;
        return true;
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score: " + this.myScore + "   High Score: " + this.highScore);

        if (this.myScore > this.highScore) { // Check if new score is higher than current high score
            this.highScore = this.myScore; // Update high score
            localStorage.setItem('highScore', this.highScore); // Store new high score in local storage
        }

        if (this.myScore >= 1000) {
            this.win = true;
            this.winState();
        }
    }

    winState() {
        this.add.text(200, 250, "Congrats! You win!", { fontSize: '32px', fill: '#fff'});
        this.add.text(200, 300, "Press R to Restart", { fontSize: '24px', fill: '#fff'});
        this.sound.play("victory", {
            volume: 1
        });

        this.input.keyboard.on('keydown-R', () => {
            this.initGame();
            this.scene.restart();
        });
    }

    initGame() {
        this.myScore = 0;
        this.gameOver = false;
        this.win = false;
    }

    showGameOver() {
        // Display game over text or graphics
        this.add.text(200, 250, "Awww You Lost:(", { fontSize: '32px', fill: '#fff'});
        this.add.text(200, 300, "Press R to Restart", { fontSize: '24px', fill: '#fff'});
        this.sound.play("lose", {
            volume: 1
        });
        this.input.keyboard.on('keydown-R', () => {
            this.initGame();
            this.scene.restart();
        });
    }

    restartGame() {
        // Reset all game variables to their initial conditions
        this.myScore = 0;
        this.my.text.score.setText("Score " + this.myScore);
        this.gameOver = false;
        this.win = false;
        // Remove game over text
        this.children.each((child) => {
            if (child.text === "Game Over" || child.text === "Press 'R' to restart") {
                child.destroy();
            }
        });
        // Reset player position
        this.my.sprite.frog.x = game.config.width / 2;
        this.my.sprite.frog.y = game.config.height - 40;
        // Reset fly positions and decrease their initial Y position
        let numflys = 7;
        let flySpacing = game.config.width / (numflys + 1);
        for (let i = 0; i < numflys; i++) {
            let fly = this.my.sprite.flys[i];
            fly.visible = true;
            fly.x = (i + 1) * flySpacing;
            fly.y = this.flyInitialY - i * 20; // Decrease Y position
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [FlyFeeder],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
