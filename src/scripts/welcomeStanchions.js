import * as THREE from 'three';

// Keep a clear four-metre aisle in front of the entrance. Coordinates are local
// to the entrance group so the posts follow its existing return-loop movement.
export function createWelcomeStanchions(gold) {
  const group=new THREE.Group();group.name='EntranceWelcomeStanchions';
  const profile=[[0,0],[.28,0],[.30,.025],[.30,.07],[.27,.085],[.23,.085],[.23,.13],[.18,.14],[.14,.17],[.09,.23],[.075,.26],[.078,.29],[.065,.31],[.065,1.18],[.10,1.19],[.10,1.22],[.075,1.23],[.06,1.28],[.06,1.31]];
  const bodyGeometry=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),32);
  const ballGeometry=new THREE.SphereGeometry(.14,24,16);
  const collarGeometry=new THREE.TorusGeometry(.082,.018,8,24);
  const ropeMaterial=new THREE.MeshStandardMaterial({color:0x780a14,roughness:.92,metalness:0,envMapIntensity:.25});
  const attachmentGeometry=new THREE.TorusGeometry(.043,.012,8,20);
  const capGeometry=new THREE.CylinderGeometry(.058,.058,.15,16);
  const positions=[3,6.6,10.2];
  const ropeGeometries=positions.slice(0,-1).map((z,index)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,1.20,z+.15),new THREE.Vector3(0,.73,(z+positions[index+1])/2),new THREE.Vector3(0,1.20,positions[index+1]-.15),
  ]),32,.048,10,false));
  for(const side of [-1,1]){
    for(const z of positions){
      const post=new THREE.Group();post.name=`WelcomePost_${side<0?'left':'right'}_${z}`;post.position.set(side*2.8,0,z);
      post.add(new THREE.Mesh(bodyGeometry,gold));
      const ball=new THREE.Mesh(ballGeometry,gold);ball.position.y=1.43;post.add(ball);
      const collar=new THREE.Mesh(collarGeometry,gold);collar.rotation.x=Math.PI/2;collar.position.y=1.24;post.add(collar);
      for(const direction of [-1,1]){
        const hook=new THREE.Mesh(attachmentGeometry,gold);hook.position.set(0,1.23,direction*.11);post.add(hook);
      }
      group.add(post);
    }
    for(let index=0;index<positions.length-1;index++)for(const end of [0,1]){
      const cap=new THREE.Mesh(capGeometry,gold);cap.position.set(side*2.8,1.17,positions[index+end]+(end?-.17:.17));cap.rotation.x=end?-.5:.5;group.add(cap);
    }
    for(const geometry of ropeGeometries){const rope=new THREE.Mesh(geometry,ropeMaterial);rope.position.x=side*2.8;rope.name='RedVelvetWelcomeRope';group.add(rope);}
  }
  return group;
}
