/**
 * 碰撞检测系统
 */
export class CollisionSystem {
  /**
   * 球体碰撞检测
   */
  static checkSphereSphere(
    pos1: any,
    radius1: number,
    pos2: any,
    radius2: number
  ): boolean {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < (radius1 + radius2);
  }

  /**
   * 点到边界的碰撞检测
   */
  static checkBoundary(
    position: any,
    radius: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): boolean {
    return position.x - radius < minX ||
           position.x + radius > maxX ||
           position.z - radius < minZ ||
           position.z + radius > maxZ;
  }

  /**
   * 约束位置在边界内
   */
  static constrainToBoundary(
    position: any,
    radius: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): void {
    position.x = Math.max(minX + radius, Math.min(maxX - radius, position.x));
    position.z = Math.max(minZ + radius, Math.min(maxZ - radius, position.z));
  }
}