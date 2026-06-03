import * as THREE from 'three';
import { Vector3 } from '../utils/Vector3';

/**
 * 子弹基类
 */
export class Bullet {
  public position: Vector3;
  public velocity: Vector3;
  public damage: number;
  public lifetime: number;

  private model: THREE.Mesh;
  private maxLifetime: number = 10;
  private speed: number = 0.5;

  constructor(
    position: Vector3,
    direction: Vector3,
    damage: number = 10,
    speed: number = 0.5
  ) {
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.damage = damage;
    this.speed = speed;
    this.lifetime = this.maxLifetime;
    this.model = this.createModel();
  }

  protected createModel(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  update(deltaTime: number): void {
    this.lifetime -= deltaTime;
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    this.model.position.copy(this.position.toThreeVector3());
  }

  isAlive(): boolean {
    return this.lifetime > 0 && 
           Math.abs(this.position.x) < 50 && 
           Math.abs(this.position.z) < 50;
  }

  getModel(): THREE.Mesh {
    return this.model;
  }

  getPosition(): Vector3 {
    return this.position;
  }
}

/**
 * 特殊子弹（激光束）
 */
export class LaserBullet extends Bullet {
  constructor(position: Vector3, direction: Vector3) {
    super(position, direction, 50, 0.8);
  }

  protected createModel(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0099ff,
      emissive: 0x0099ff,
      emissiveIntensity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }
}