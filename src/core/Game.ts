import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { Scene3D } from './Scene3D';
import { Player } from '../entities/Player';
import { Enemy, ScoutEnemy, FighterEnemy, BomberEnemy, Boss } from '../entities/Enemy';
import { Bullet, LaserBullet } from '../entities/Bullet';
import { Pickup, PickupType } from '../entities/Pickup';
import { Vector3 } from '../utils/Vector3';
import { CollisionSystem } from '../systems/CollisionSystem';

/**
 * 主游戏类
 */
export class Game {
  private scene3D: Scene3D;
  private inputSystem: InputSystem;
  private audioSystem: AudioSystem;
  private particleSystem: ParticleSystem;
  private canvas: HTMLCanvasElement;

  // 游戏状态
  private player: Player;
  private enemies: Enemy[] = [];
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private pickups: Pickup[] = [];
  private currentLevel: number = 1;
  private score: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;

  // 关卡配置
  private levelConfig: any = {};
  private levelTimer: number = 0;
  private killedEnemies: number = 0;

  // 帧率控制
  private animationFrameId: number = 0;
  private lastTime: number = 0;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.scene3D = new Scene3D(canvasElement);
    this.inputSystem = new InputSystem();
    this.audioSystem = new AudioSystem();
    this.particleSystem = new ParticleSystem(this.scene3D.getScene());
    this.player = new Player(new Vector3(0, 2, 0));
  }

  init(): void {
    // 添加玩家到场景
    this.scene3D.addObject(this.player.getModel());
    
    // 加载第一关
    this.loadLevel(1);
    
    // 启动游戏循环
    this.startGameLoop();
  }

  private loadLevel(levelNumber: number): void {
    this.currentLevel = levelNumber;
    this.killedEnemies = 0;
    this.levelTimer = 0;

    // 清理旧的敌人
    this.enemies.forEach(enemy => {
      this.scene3D.removeObject(enemy.getModel());
    });
    this.enemies = [];

    // 配置关卡
    this.levelConfig = this.getLevelConfig(levelNumber);

    // 生成敌人
    if (this.levelConfig.isBoss) {
      this.enemies.push(new Boss(this.levelConfig.bossId));
    } else {
      const enemyTypes = this.levelConfig.enemies || [1, 1, 1];
      enemyTypes.forEach((type: number, index: number) => {
        let enemy: Enemy;
        const xPos = -30 + index * 15 + Math.random() * 10;
        const position = new Vector3(xPos, 2, -50);

        switch (type) {
          case 1:
            enemy = new ScoutEnemy(position);
            break;
          case 2:
            enemy = new FighterEnemy(position);
            break;
          case 3:
            enemy = new BomberEnemy(position);
            break;
          default:
            enemy = new ScoutEnemy(position);
        }
        
        this.enemies.push(enemy);
        this.scene3D.addObject(enemy.getModel());
      });
    }

    // 将 Boss 添加到场景
    if (this.levelConfig.isBoss && this.enemies.length > 0) {
      this.scene3D.addObject(this.enemies[0].getModel());
    }
  }

  private getLevelConfig(levelNumber: number): any {
    const configs: any[] = [
      { level: 1, targetKills: 10, timeLimit: 120, enemies: [1, 1, 1], isBoss: false },
      { level: 2, targetKills: 10, timeLimit: 120, enemies: [1, 1, 1, 1], isBoss: false },
      { level: 3, targetKills: 20, timeLimit: 120, enemies: [1, 2, 1], isBoss: false },
      { level: 4, targetKills: 20, timeLimit: 120, enemies: [1, 2, 2], isBoss: false },
      { level: 5, targetKills: 30, timeLimit: 150, enemies: [1, 2, 3], isBoss: false },
      { level: 6, targetKills: 30, timeLimit: 150, enemies: [2, 2, 3], isBoss: false },
      { level: 7, targetKills: 40, timeLimit: 150, enemies: [2, 3, 3], isBoss: false },
      { level: 8, targetKills: 40, timeLimit: 150, enemies: [3, 3, 3], isBoss: false },
      { level: 9, targetKills: 50, timeLimit: 180, enemies: [3, 3, 3, 3], isBoss: false },
      { level: 10, targetKills: 50, timeLimit: 180, enemies: [3, 3, 3, 3, 3], isBoss: false },
      // Boss 关卡
      { level: 11, isBoss: true, bossId: 1, timeLimit: 180 },
      { level: 12, isBoss: true, bossId: 2, timeLimit: 180 },
      { level: 13, isBoss: true, bossId: 3, timeLimit: 180 },
      { level: 14, isBoss: true, bossId: 4, timeLimit: 180 },
      { level: 15, isBoss: true, bossId: 5, timeLimit: 180 },
      { level: 16, isBoss: true, bossId: 6, timeLimit: 180 },
      { level: 17, isBoss: true, bossId: 7, timeLimit: 180 },
      { level: 18, isBoss: true, bossId: 8, timeLimit: 180 },
      { level: 19, isBoss: true, bossId: 9, timeLimit: 180 },
      { level: 20, isBoss: true, bossId: 10, timeLimit: 180 },
    ];
    return configs[levelNumber - 1] || configs[0];
  }

  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      if (this.lastTime === 0) this.lastTime = currentTime;
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.update(Math.min(deltaTime, 0.016));
      this.render();

      this.animationFrameId = requestAnimationFrame(gameLoop);
    };

    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  private update(deltaTime: number): void {
    if (this.isGameOver) return;

    const input = this.inputSystem.getInput();

    if (this.isPaused) return;

    // 更新玩家
    this.player.update(input, deltaTime);

    // 更新关卡时间
    this.levelTimer += deltaTime;

    // 玩家射击
    if (input.shoot && this.player.canAutoShoot()) {
      const bullet = new Bullet(
        this.player.position.clone().add(new Vector3(0, 0, -1)),
        new Vector3(0, 0, -1),
        10,
        0.5
      );
      this.playerBullets.push(bullet);
      this.scene3D.addObject(bullet.getModel());
      this.player.onAutoShoot();
      this.audioSystem.playShootSFX();
    }

    // 更新玩家子弹
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.update(deltaTime);
      if (!bullet.isAlive()) {
        this.scene3D.removeObject(bullet.getModel());
        this.playerBullets.splice(i, 1);
      }
    }

    // 更新敌人
    this.enemies.forEach(enemy => {
      enemy.update(this.player.position, deltaTime);
    });

    // 更新敌人子弹
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.update(deltaTime);
      if (!bullet.isAlive()) {
        this.scene3D.removeObject(bullet.getModel());
        this.enemyBullets.splice(i, 1);
      }
    }

    // 更新道具
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      pickup.update(deltaTime);
      if (!pickup.isAlive()) {
        this.scene3D.removeObject(pickup.getModel());
        this.pickups.splice(i, 1);
      }
    }

    // 更新粒子系统
    this.particleSystem.update(deltaTime);

    // 碰撞检测
    this.checkCollisions();

    // 更新相机
    this.scene3D.updateCamera(this.player.position);

    // 检查关卡完成
    this.checkLevelCompletion();
  }

  private checkCollisions(): void {
    // 玩家与敌人子弹
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      if (CollisionSystem.checkSphereSphere(this.player.position, 1, bullet.position, 0.3)) {
        this.player.takeDamage(bullet.damage);
        this.scene3D.removeObject(bullet.getModel());
        this.enemyBullets.splice(i, 1);
        this.particleSystem.createExplosion(bullet.position, 0xff6b00);
      }
    }

    // 玩家子弹与敌人
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (CollisionSystem.checkSphereSphere(bullet.position, 0.3, enemy.position, 1)) {
          enemy.takeDamage(bullet.damage);
          this.scene3D.removeObject(bullet.getModel());
          this.playerBullets.splice(i, 1);
          this.particleSystem.createExplosion(bullet.position, 0x00ff88);

          if (!enemy.isAlive()) {
            this.score += enemy.getReward();
            this.player.addScore(enemy.getReward());
            this.killedEnemies++;
            this.scene3D.removeObject(enemy.getModel());
            this.enemies.splice(j, 1);
            this.audioSystem.playExplosionSFX();
            this.particleSystem.createExplosion(enemy.position, 0xff6b00);

            if (Math.random() < 0.3) {
              const pickup = Pickup.create(enemy.position.clone());
              this.pickups.push(pickup);
              this.scene3D.addObject(pickup.getModel());
            }
          }
          break;
        }
      }
    }

    // 玩家与道具
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      if (CollisionSystem.checkSphereSphere(this.player.position, 1, pickup.position, 0.5)) {
        pickup.apply(this.player);
        this.scene3D.removeObject(pickup.getModel());
        this.pickups.splice(i, 1);
        this.audioSystem.playPickupSFX();
        this.particleSystem.createShieldEffect(pickup.position);
      }
    }
  }

  private checkLevelCompletion(): void {
    const timeRemaining = this.levelConfig.timeLimit - this.levelTimer;

    if (!this.player.isAlive() || timeRemaining <= 0) {
      this.isGameOver = true;
      console.log('游戏结束！');
      return;
    }

    if (this.levelConfig.isBoss) {
      if (this.enemies.length === 0) {
        this.onLevelComplete();
      }
    } else {
      if (this.killedEnemies >= this.levelConfig.targetKills) {
        this.onLevelComplete();
      }
    }
  }

  private onLevelComplete(): void {
    console.log(`第 ${this.currentLevel} 关完成！`);
    
    if (this.currentLevel < 20) {
      this.loadLevel(this.currentLevel + 1);
    } else {
      console.log('游戏通关！');
      this.isGameOver = true;
    }
  }

  private render(): void {
    this.scene3D.render();
  }

  getGameState() {
    return {
      currentLevel: this.currentLevel,
      score: this.score,
      player: this.player.getStats(),
      enemies: this.enemies.length,
      killedEnemies: this.killedEnemies,
      timeLimit: this.levelConfig.timeLimit,
      timeRemaining: Math.max(0, this.levelConfig.timeLimit - this.levelTimer),
      isPaused: this.isPaused,
      isGameOver: this.isGameOver
    };
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.scene3D.dispose();
  }
}
