import * as THREE from 'three';
import { Vector3 } from '../utils/Vector3';

/**
 * 敌机基类
 */
export class Enemy {
  public position: Vector3;
  public velocity: Vector3;
  public health: number;
  public maxHealth: number;
  public damage: number = 5;
  public moveSpeed: number = 0.1;
  public shootCooldown: number = 0;
  public type: string = 'scout';
  public reward: number = 50;

  protected model: THREE.Group;
  protected maxShootCooldown: number = 1;

  constructor(position: Vector3, health: number = 20) {
    this.position = position.clone();
    this.velocity = new Vector3(0, 0, 0);
    this.health = health;
    this.maxHealth = health;
    this.model = this.createModel();
  }

  protected createModel(): THREE.Group {
    const group = new THREE.Group();
    
    // 简单的锥形敌机
    const geometry = new THREE.ConeGeometry(0.8, 1.5, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.z = Math.PI;
    group.add(body);

    return group;
  }

  update(playerPosition: Vector3, deltaTime: number): void {
    // 追踪玩家
    const direction = playerPosition.clone().subtract(this.position);
    const distance = direction.length();

    if (distance > 0) {
      direction.normalize();
      this.velocity = direction.clone().multiplyScalar(this.moveSpeed);
    }

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    this.model.position.copy(this.position.toThreeVector3());

    // 更新射击冷却
    this.shootCooldown = Math.max(0, this.shootCooldown - deltaTime);
  }

  canShoot(): boolean {
    return this.shootCooldown <= 0;
  }

  onShoot(): void {
    this.shootCooldown = this.maxShootCooldown;
  }

  takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  getModel(): THREE.Group {
    return this.model;
  }

  getReward(): number {
    return this.reward;
  }
}

/**
 * 敌机类型 I - 斥候机
 */
export class ScoutEnemy extends Enemy {
  constructor(position: Vector3) {
    super(position, 20);
    this.type = 'scout';
    this.damage = 5;
    this.moveSpeed = 0.15;
    this.maxShootCooldown = 1;
    this.reward = 50;
  }

  protected createModel(): THREE.Group {
    const group = new THREE.Group();
    
    const geometry = new THREE.ConeGeometry(0.6, 1.2, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = true;
    body.rotation.z = Math.PI;
    group.add(body);

    return group;
  }
}

/**
 * 敌机类型 II - 战斗机
 */
export class FighterEnemy extends Enemy {
  constructor(position: Vector3) {
    super(position, 40);
    this.type = 'fighter';
    this.damage = 10;
    this.moveSpeed = 0.12;
    this.maxShootCooldown = 1.5;
    this.reward = 100;
  }

  protected createModel(): THREE.Group {
    const group = new THREE.Group();
    
    const geometry = new THREE.ConeGeometry(0.8, 1.5, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = true;
    body.rotation.z = Math.PI;
    group.add(body);

    // 添加翼
    const wingGeo = new THREE.BoxGeometry(1.5, 0.2, 0.5);
    const wing = new THREE.Mesh(wingGeo, material);
    wing.position.y = -0.2;
    group.add(wing);

    return group;
  }
}

/**
 * 敌机类型 III - 轰炸机
 */
export class BomberEnemy extends Enemy {
  constructor(position: Vector3) {
    super(position, 60);
    this.type = 'bomber';
    this.damage = 15;
    this.moveSpeed = 0.1;
    this.maxShootCooldown = 2;
    this.reward = 200;
  }

  protected createModel(): THREE.Group {
    const group = new THREE.Group();
    
    const geometry = new THREE.ConeGeometry(1, 2, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = true;
    body.rotation.z = Math.PI;
    group.add(body);

    // 大翼
    const wingGeo = new THREE.BoxGeometry(2.5, 0.3, 0.8);
    const wing = new THREE.Mesh(wingGeo, material);
    wing.position.y = -0.3;
    group.add(wing);

    return group;
  }
}

/**
 * Boss 类
 */
export class Boss extends Enemy {
  public bossId: number;
  public phase: number = 1;
  public maxPhase: number = 3;
  private attackPattern: string = 'spiral';

  constructor(bossId: number) {
    const bossHealth = 300 + (bossId - 1) * 100;
    super(new Vector3(0, 3, -50), bossHealth);
    this.bossId = bossId;
    this.type = 'boss';
    this.damage = 20 + bossId * 5;
    this.moveSpeed = 0.08;
    this.reward = 500 + bossId * 100;
    this.maxShootCooldown = 0.5;
  }

  protected createModel(): THREE.Group {
    const group = new THREE.Group();
    
    // Boss主体 - 更大更复杂
    const geometry = new THREE.OctahedronGeometry(1.5, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.1
    });
    const body = new THREE.Mesh(geometry, material);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 添加光源
    const light = new THREE.PointLight(0xff00ff, 1, 30);
    light.position.set(0, 0, 0);
    group.add(light);

    return group;
  }

  update(playerPosition: Vector3, deltaTime: number): void {
    // Boss更复杂的移动模式
    const time = Date.now() * 0.001;
    const angle = time * 2;

    this.position.x = Math.sin(angle) * 10;
    this.position.z = -50 + Math.cos(angle * 0.5) * 10;

    this.model.position.copy(this.position.toThreeVector3());

    // 旋转
    this.model.rotation.x += 0.01;
    this.model.rotation.y += 0.02;

    this.shootCooldown = Math.max(0, this.shootCooldown - deltaTime);

    // 更新阶段
    this.updatePhase();
  }

  private updatePhase(): void {
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent > 0.66) {
      this.phase = 1;
    } else if (healthPercent > 0.33) {
      this.phase = 2;
    } else {
      this.phase = 3;
    }
  }
}