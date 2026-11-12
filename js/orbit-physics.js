// Soft angular repulsion preserves spacing on the shared floating orbit.
export function stepOrbits(bodies, dt) {
  const forces = bodies.map(b => (0.14 - b.velocity) * 1.8);
  for (let i=0; i<bodies.length; i++) for (let j=i+1; j<bodies.length; j++) {
    const a=bodies[i], b=bodies[j];
    const delta=Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle));
    const gap=0.85;
    if (Math.abs(delta)<gap) {
      const direction=delta<0?-1:1;
      const force=(gap-Math.abs(delta))*5;
      forces[i]-=direction*force;
      forces[j]+=direction*force;
    }
  }
  bodies.forEach((b,i)=>{b.velocity+=forces[i]*dt;b.angle+=b.velocity*dt;});
}
