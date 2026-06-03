import * as THREE from 'three';
import { Vector3 } from '../utils/Vector3';

/**
 * 玩家飞机类
 */
export class Player {
  public position: Vector3;
  public velocity: Vector3;
  public health: number = 100;
  public shield: number = 0;
  public bombs: number = 3;
  public score: number = 0;

  private model: THREE.Group;
  private moveSpeed: number = 0.25;
  private autoShootCooldown: number = 0;
  private specialShootCooldown: number = 0;
  private maxHealth: number = 100;
  private maxShield: number = 100;
  private maxBombs: number = 5;

  constructor(position: Vector3 = new Vector3(0, 2, 0)) {
    this.position = position.clone();
    this.velocity = new Vector3(0, 0, 0);
    this.model = this.createModel();
  }

  private createModel(): THREE.Group {
    const group = new THREE.Group();

    // 主体 - 圆锥形
    const bodyGeometry = new THREE.ConeGeometry(1, 2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 机翼
    const wingGeometry = new THREE.BoxGeometry(3, 0.3, 0.8);
    const wing = new THREE.Mesh(wingGeometry, bodyMaterial);
    wing.position.y = -0.3;
    wing.castShadow = true;
    wing.receiveShadow = true;
    group.add(wing);

    // 尾焰效果光源
    const tailLight = new THREE.PointLight(0x00ff88, 1, 10);
    tailLight.position.y = -1.5;
    group.add(tailLight);

    return group;
  }

  update(input: any, deltaTime: number): void {
    // 处理移动
    const moveVector = new Vector3(0, 0, 0);

    if (input.moveUp) moveVector.z -= 1;
    if (input.moveDown) moveVector.z += 1;
    if (input.moveLeft) moveVector.x -= 1;
    if (input.moveRight) moveVector.x += 1;

    if (moveVector.length() > 0) {
      moveVector.normalize();
      this.velocity = moveVector.clone().multiplyScalar(this.moveSpeed);
    } else {
      this.velocity.multiplyScalar(0.9);
    }

    // 应用位置更新
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));

    // 边界限制
    this.position.x = Math.max(-40, Math.min(40, this.position.x));
    this.position.z = Math.max(-40, Math.min(40, this.position.z));

    // 更新模型位置
    this.model.position.copy(this.position.toThreeVector3());

    // 更新冷却时间
    this.autoShootCooldown = Math.max(0, this.autoShootCooldown - deltaTime);
    this.specialShootCooldown = Math.max(0, this.specialShootCooldown - deltaTime);
  }

  canAutoShoot(): boolean {
    return this.autoShootCooldown <= 0;
  }

  onAutoShoot(): void {
    this.autoShootCooldown = 0.2; // 200ms
  }

  canSpecialShoot(): boolean {
    return this.specialShootCooldown <= 0;
  }

  onSpecialShoot(): void {
    this.specialShootCooldown = 1.0; // 1秒
  }

  canUseBomb(): boolean {
    return this.bombs > 0;
  }

  onUseBomb(): void {
    if (this.bombs > 0) {
      this.bombs--;
    }
  }

  takeDamage(damage: number): void {
    if (this.shield > 0) {
      const remaining = damage - this.shield;
      this.shield = 0;
      if (remaining > 0) {
        this.health = Math.max(0, this.health - remaining);
      }
    } else {
      this.health = Math.max(0, this.health - damage);
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addShield(amount: number): void {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }

  addBomb(amount: number = 1): void {
    this.bombs = Math.min(this.maxBombs, this.bombs + amount);
  }

  addScore(amount: number): void {
    this.score += amount;
  }

  getModel(): THREE.Group {
    return this.model;
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  getStats() {
    return {
      health: this.health,
      shield: this.shield,
      bombs: this.bombs,
      score: this.score,
      position: this.position
    };
  }
}