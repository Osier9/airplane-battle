import * as THREE from 'three';
import { Vector3 } from '../utils/Vector3';

/**
 * 道具类型
 */
export enum PickupType {
  HEALTH = 'health',
  SHIELD = 'shield',
  BOMB = 'bomb'
}

/**
 * 道具基类
 */
export class Pickup {
  public position: Vector3;
  public type: PickupType;
  public lifetime: number = 10;
  public collected: boolean = false;

  private model: THREE.Mesh;
  private maxLifetime: number = 10;
  private rotationSpeed: number = 3;

  constructor(position: Vector3, type: PickupType) {
    this.position = position.clone();
    this.type = type;
    this.lifetime = this.maxLifetime;
    this.model = this.createModel(type);
  }

  private createModel(type: PickupType): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    let color: number;
    let emissive: number;

    switch (type) {
      case PickupType.HEALTH:
        color = 0x00ff00;
        emissive = 0x00ff00;
        break;
      case PickupType.SHIELD:
        color = 0x0099ff;
        emissive = 0x0099ff;
        break;
      case PickupType.BOMB:
        color = 0xffff00;
        emissive = 0xffff00;
        break;
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      emissive,
      emissiveIntensity: 0.8,
      wireframe: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position.toThreeVector3());
    mesh.castShadow = true;

    return mesh;
  }

  update(deltaTime: number): void {
    this.lifetime -= deltaTime;
    
    // 旋转效果
    this.model.rotation.x += this.rotationSpeed * deltaTime;
    this.model.rotation.y += this.rotationSpeed * deltaTime;

    // 浮动效果
    const floatOffset = Math.sin(Date.now() * 0.003) * 0.3;
    this.position.y += floatOffset * deltaTime;
    this.model.position.y = this.position.y;

    // 淡出效果
    const progress = 1 - (this.lifetime / this.maxLifetime);
    if (progress > 0.8) {
      (this.model.material as THREE.MeshBasicMaterial).opacity = 1 - (progress - 0.8) * 5;
    }
  }

  isAlive(): boolean {
    return this.lifetime > 0 && !this.collected;
  }

  collect(): void {
    this.collected = true;
  }

  getModel(): THREE.Mesh {
    return this.model;
  }

  apply(player: any): void {
    switch (this.type) {
      case PickupType.HEALTH:
        player.heal(25);
        break;
      case PickupType.SHIELD:
        player.addShield(50);
        break;
      case PickupType.BOMB:
        player.addBomb(1);
        break;
    }
  }

  static create(position: Vector3, type?: PickupType): Pickup {
    const randomType = type || 
      [PickupType.HEALTH, PickupType.SHIELD, PickupType.BOMB][
        Math.floor(Math.random() * 3)
      ];
    return new Pickup(position, randomType);
  }
}