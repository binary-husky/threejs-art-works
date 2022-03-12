import {
	Vector3
} from '../../../build/three.module.js';

class Creative {

	constructor() {

        var v1Setting = Object();
        v1Setting.radius = 5;
        v1Setting.radius2 = 5;
        v1Setting.disThreshold = 2;
        v1Setting.n_points = 5000;
        v1Setting.allowConnects = 3;
        v1Setting.NNearest = 2;
        v1Setting.dotColor = 'Lime';
        v1Setting.lineColor = 'LemonChiffon';
        v1Setting.callbackName = 'creative_vx2';
        v1Setting.roMainDir = new Vector3(0,1,0);


        this.start = function creative(str){
            let selection = match_karg(str, 'selection', 'str', null);
            creative_vx2(v1Setting);

        }

	}

}

export { Creative };






function smart_child_update(setting, parent, child_name, pt1, pt2, dis, dis_th, allow_create){
    let create = false;
    let child = parent.getObjectByName( child_name );
    let ARC_SEGMENTS = 5

    if (child==null && !allow_create){
        return false;
    }
    if (child==null && allow_create){
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ARC_SEGMENTS * 3 ), 3 ) );
        const material = new THREE.LineBasicMaterial( {
            color: setting.lineColor,
            opacity: 1,
            side: THREE.DoubleSide,
            transparent: true
        })
        const position = geometry.attributes.position;
        for ( let i = 0; i < ARC_SEGMENTS; i ++ ) {
            const t = i / ( ARC_SEGMENTS - 1 );
            position.setXYZ( i, 0, 0, 0 );
        }
        child = new THREE.Line( geometry, material);
        child.pt1_index = pt1.id_index;
        child.pt2_index = pt2.id_index;
        child.name = child_name;
        parent.add(child);
        create = true;
    }

    let seg = ARC_SEGMENTS-1;
    let position = child.geometry.attributes.position;
    // const point = new Vector3();
    for (let i=0;i<=seg;i++){
        const a = new Vector3(             
            (pt1.x-pt2.x)*i/seg + pt2.x, 
            (pt1.y-pt2.y)*i/seg + pt2.y, 
            (pt1.z-pt2.z)*i/seg + pt2.z, );
        a.normalize()
        position.setXYZ( i, a.x*setting.radius2, a.y*setting.radius2, a.z*setting.radius2 );
    }


    if (dis<=dis_th/2){
        child.material.opacity = 1;
    }else{//    [2/dis_th*(dis_th-x)]  (x=d/2, y=1) (x=d,y=0)
        child.material.opacity = 1 - 2/dis_th*(dis_th-(3*dis_th/2-dis))
    }
    child.geometry.attributes.position.needsUpdate=true
    return create;
}


function smart_child_partical_update(setting, parent, child_name, pts){
    let child = parent.getObjectByName( child_name );
    if (child==null){
        // exec the first time
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for(let i=0; i<pts.length; i++){vertices.push(0,0,0)}
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        child = new THREE.Points( geometry, new THREE.PointsMaterial( { color: setting.dotColor, size:0.05 } ) );
        // fix 
        child.name = child_name
        parent.add(child)
    }
    // executed all the time 
    for(let i=0; i<pts.length; i++){
        child.geometry.attributes.position.setXYZ( i, pts[i].x, pts[i].y, pts[i].z);
    }
    child.geometry.computeBoundingSphere();
    // fix
    // child.geometry.needsUpdate=true
    // child.geometry.verticesNeedUpdate = true;
    child.geometry.attributes.position.needsUpdate = true;

}

function generate_random_point_walk_old(setting) {
    let theta = THREE.MathUtils.randFloatSpread(2 * Math.PI); // 经度
    let phi = Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    let phi2 = Math.PI / 2 - phi; // 纬度
    let x = setting.radius * Math.cos(phi2) * Math.cos(theta);
    let y = setting.radius * Math.sin(phi2); 
    let z = setting.radius * Math.cos(phi2) * Math.sin(theta);

    // 再随机产生一个点，确定旋转方向

    // let beta = THREE.MathUtils.randFloatSpread(2 * Math.PI);//
    let beta = THREE.MathUtils.randFloatSpread(Math.PI/4);

    let profile = {theta_init:theta, phi_init:phi, beta:beta}
    return { x, y, z, theta, phi2, profile };
}


function generate_random_point_walk(setting) {
    let theta = THREE.MathUtils.randFloatSpread(2 * Math.PI); // 经度
    let phi = Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    let phi2 = Math.PI / 2 - phi; // 纬度
    let x = setting.radius * Math.cos(phi2) * Math.cos(theta);
    let y = setting.radius * Math.sin(phi2); 
    let z = setting.radius * Math.cos(phi2) * Math.sin(theta);
    let pt = new Vector3(x,y,z)

    // 再随机产生一个点，确定旋转方向
    let R2_theta = THREE.MathUtils.randFloatSpread(2 * Math.PI); // 经度
    let R2_phi = Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    let R2_phi2 = Math.PI / 2 - R2_phi; // 纬度
    let R2_x = setting.radius * Math.cos(R2_phi2) * Math.cos(R2_theta);
    let R2_y = setting.radius * Math.sin(R2_phi2); 
    let R2_z = setting.radius * Math.cos(R2_phi2) * Math.sin(R2_theta);
    let ro_vec = new Vector3(R2_x,R2_y,R2_z)
    ro_vec.cross(pt)
    ro_vec.normalize()



    let profile = {theta_init:theta, phi_init:phi, ro_vec:ro_vec}
    return { x, y, z, theta, phi2, profile };
}

function update_point_location(settings, pt, T, radius) {
    // let profile = {theta:theta_init, phi:phi_init, beta:beta}

    let speed = 0.15;
    let profile = pt.profile
    let theta = profile.theta_init      
    let phi = profile.phi_init          
    let phi2 = Math.PI / 2 - phi; // 纬度
    let PosVec = new Vector3(
        radius * Math.cos(phi2) * Math.cos(theta),
        radius * Math.sin(phi2),
        radius * Math.cos(phi2) * Math.sin(theta),
    )

    let roAxis1 = profile.ro_vec; 
    PosVec.applyAxisAngle(roAxis1, T*speed)
    let roAxis2 = settings.roMainDir; 
    PosVec.applyAxisAngle(roAxis2, T*speed*5)
    
    let hyper = Math.cos(T*0.01)*5+5

    let omega1 = (2*Math.PI/settings.radius) * hyper
    let omega2 = 4
    let radius_plus = Math.cos(PosVec.y*omega1 + T*omega2)*0.5+1

    pt.x = PosVec.x * radius_plus
    pt.y = PosVec.y
    pt.z = PosVec.z * radius_plus

    return pt;
}


function update_point_location_old(settings, pt, T, radius) {
    // let profile = {theta:theta_init, phi:phi_init, beta:beta}

    let speed = 0.15;
    let profile = pt.profile
    let theta = profile.theta_init + T*speed*Math.sin(profile.beta) // THREE.MathUtils.randFloatSpread(2 * Math.PI); // 经度
    let phi = profile.phi_init + T*speed*Math.cos(profile.beta)  // Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    // let phi = profile.phi_init + 0*speed*Math.cos(profile.beta)  // Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    let phi2 = Math.PI / 2 - phi; // 纬度
    // let phi2 = 0; // 纬度
    let vec = new Vector3(
        radius * Math.cos(phi2) * Math.cos(theta),
        radius * Math.sin(phi2),
        radius * Math.cos(phi2) * Math.sin(theta),
    )
    let roAxis = settings.roMainDir; 

    vec.applyAxisAngle(roAxis, T*speed*0)

    pt.x = vec.x
    pt.y = vec.y
    pt.z = vec.z

    pt.theta = theta
    pt.phi2 = phi2
    return pt;
}


function distanceSmallerThanTh(v1_pt, i, j, th){
    let pt1profile = v1_pt[i]
    let pt2profile = v1_pt[j]
    if (
        Math.abs(pt1profile.x-pt2profile.x)>th || 
        Math.abs(pt1profile.y-pt2profile.y)>th || 
        Math.abs(pt1profile.z-pt2profile.z)>th)
    {
        return [false, -1]
    }

    let distance =  (pt1profile.x-pt2profile.x)**2 + (pt1profile.y-pt2profile.y)**2 + (pt1profile.z-pt2profile.z)**2
    if (distance>th**2){
        return [false, -1]
    }
    else{
        return [true, Math.sqrt(distance)]
    }
}

function getDistance(v1_pt, i, j){

    let pt1profile = v1_pt[i]
    let pt2profile = v1_pt[j]
    let distance = Math.sqrt(
        (pt1profile.x-pt2profile.x)**2 +
        (pt1profile.y-pt2profile.y)**2 +
        (pt1profile.z-pt2profile.z)**2
    )
    return distance
}


function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

const dsu = (arr1, arr2) => arr1
  .map((item, index) => [arr2[index], item]) // add the args to sort by
  .sort(([arg1], [arg2]) => -arg2 + arg1) // sort by the args
  .map(([, item]) => item); // extract the sorted items





function creative_vx2(settings){
    let v1_group = new THREE.Group()
    let v1_pt = []
    let distance_mat = createArray(settings.n_points, settings.n_points);

    for(let i=0; i<settings.n_points; i++){
        //THREE.Math.randFloatSpread 在区间内随机浮动* - 范围 / 2 到 范围 / 2 *内随机取值。
        let pt1 = generate_random_point_walk(settings);
        pt1.id_index = i;
        pt1.connected_by = 0;
        v1_pt.push(pt1);
    }

    window.glb.scene.add(v1_group)
    window.glb.render_callback[settings.callbackName] = function creative_v1_callback({dT, T}){
        // console.log(dT)
        // return;
        for(let i=0; i<settings.n_points; i++){
            // pt_profile = v1_pt[i]
            v1_pt[i] = update_point_location(settings, v1_pt[i], T, settings.radius)
        }

        // update particals
        smart_child_partical_update(settings, v1_group, 'particles', v1_pt);


    }
}










