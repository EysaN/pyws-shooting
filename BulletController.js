import Bullet from "./Bullet.js";

export default class BulletController {

  constructor(playerColor, bullets, timerTillNextBullet) {
    this.playerColor = playerColor;
    this.bullets = [];
    this.timerTillNextBullet = timerTillNextBullet;
    console.log('bullets in',bullets);
    if(bullets){
      for(let bullet of bullets){
        this.bullets.push(new Bullet(bullet.x, bullet.y, bullet.speed, bullet.damage));
      }
    }
  }

  shoot(x, y, speed, damage, delay) {
    if (this.timerTillNextBullet <= 0) {
      this.bullets.push(new Bullet(x, y, speed, damage));

      this.timerTillNextBullet = delay;
    }

    this.timerTillNextBullet--;
  }

  draw(ctx) {
    console.log('bullets out', this.bullets);
    if(this.bullets) {
      this.bullets.forEach((bullet) => {
        if (this.isBulletOffScreen(bullet)) {
          const index = this.bullets.indexOf(bullet);
          this.bullets.splice(index, 1);
        }
        bullet.draw(ctx, this.playerColor);
      });
    }
  }

  collideWith(sprite) {
    return this.bullets.some((bullet) => {
      if (bullet.collideWith(sprite)) {
        this.bullets.splice(this.bullets.indexOf(bullet), 1);
        return true;
      }
      return false;
    });
  }

  isBulletOffScreen(bullet) {
    return bullet.y <= -bullet.height;
  }
}
