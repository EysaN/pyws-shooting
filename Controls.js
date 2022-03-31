export const WIDTH = 550;

export const HEIGHT = 600;

export class Controls {
  constructor(x, y, color, health, bulletController) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.health = health;
    this.bulletController = bulletController;
    this.width = 50;
    this.height = 50;
    this.speed = 5;
    this.offset = this.color === 'lightgreen'? 6.3 : 1.3;
  }

  draw(ctx) {
    if (this.health > 1) {
      ctx.strokeStyle = "white";
    } else {
      ctx.strokeStyle = "red";
    }
    this.move();
    ctx.strokeStyle = "blue";
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    this.shoot();
  }

  takeDamage(damage) {
    this.health -= damage;
  }

  shoot() {
    if (this.shootPressed) {
      const speed = 2;
      const delay = 7;
      const damage = 1;
      const bulletX = this.x + this.width / 2;
      const bulletY = this.y + (this.color === 'lightgreen'? this.height : 0);
      this.bulletController.shoot(bulletX, bulletY, speed, damage, delay);
    }
  }

  move() {
    if (this.x > 0 && this.y > 0 &&
        this.x + this.width < WIDTH &&  this.y + this.height < HEIGHT) {
      if (this.downPressed) {
        this.y += this.speed;
        // console.log(this.x, this.y);
      }
      if (this.upPressed) {
        this.y -= this.speed;
        // console.log(this.x, this.y);
      }
      if (this.leftPressed) {
        this.x -= this.speed;
        // console.log(this.x, this.y);
      }
      if (this.rightPressed) {
        this.x += this.speed;
        // console.log(this.x, this.y);
      }
    }
    else {
      this.x = WIDTH / 2.2;
      this.y = HEIGHT / this.offset;
    }
  }

  keydown = (e) => {
    if (e.code === "ArrowUp") {
      this.upPressed = true;
    }
    if (e.code === "ArrowDown") {
      this.downPressed = true;
    }
    if (e.code === "ArrowLeft") {
      this.leftPressed = true;
    }
    if (e.code === "ArrowRight") {
      this.rightPressed = true;
    }
    if (e.code === "Space") {
      this.shootPressed = true;
    }
  };

  keyup = (e) => {
    if (e.code === "ArrowUp") {
      this.upPressed = false;
    }
    if (e.code === "ArrowDown") {
      this.downPressed = false;
    }
    if (e.code === "ArrowLeft") {
      this.leftPressed = false;
    }
    if (e.code === "ArrowRight") {
      this.rightPressed = false;
    }
    if (e.code === "Space") {
      this.shootPressed = false;
    }
  };
}
