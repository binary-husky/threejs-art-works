import {
	Vector3
} from '../../../build/three.module.js';

class Creative {

	constructor() {

        var v4Setting = Object();
        v4Setting.radius = 100;
        v4Setting.radius2 = 100;
        v4Setting.disThreshold = 40;
        v4Setting.n_points = 100;
        v4Setting.allowConnects = 4;
        v4Setting.NNearest = 3;
        v4Setting.dotColor = 'White';
        v4Setting.lineColor = 'LemonChiffon';
        v4Setting.callbackName = 'creative_v1';
        v4Setting.roMainDir = new Vector3(0,1,0);
        // The size of the dot
        v4Setting.dotSize = 5


        this.start = function creative(str){
            let selection = match_karg(str, 'selection', 'str', null);
            creative_v4(v4Setting);
        }

	}

}

export { Creative };


class FlowingLightGenerator {

	constructor(args) {
        var settings = Object();
        settings.dotColor = 'Green';
        settings.dotSize = 10;
        settings.ndot = 15;
        settings.speed = 0.1;

        this.group = new THREE.Group();

        this.start_loc = args.start_loc
        this.end_loc = args.end_loc
        let v3_start_loc = new Vector3(this.start_loc.x, this.start_loc.y, this.start_loc.z)
        let v3_s2e = new Vector3(this.end_loc.x-this.start_loc.x, this.end_loc.y-this.start_loc.y, this.end_loc.z-this.start_loc.z)
        let v3_n = new Vector3(0, 1, 0)
        let rad_angle = v3_n.angleTo(v3_s2e);
        let v3_ro_axis = new Vector3(0, 1, 0);
        v3_ro_axis = v3_ro_axis.cross(v3_s2e)
        v3_ro_axis.normalize()

        this.pts = []

        for(let i=0; i<settings.ndot; i++){
            this.pts.push({ 
                x:this.start_loc.x,
                y:this.start_loc.y,
                z:this.start_loc.z,
                t:THREE.MathUtils.randFloatSpread(1) + 0.5 // range (0,1)
            })//Random float in the interval [- range / 2, range / 2].
        }

        this.update = function update(dT, T){
            let d = getPtDistance(this.start_loc, this.end_loc)
            for(let i=0; i<settings.ndot; i++){
                this.pts[i].t += dT*settings.speed;
                console.log(this.pts[i].t)
                if (this.pts[i].t>1){
                    this.pts[i].t -= 1;
                }
                let regulater = 1;
                if (this.pts[i].t>0.8){
                    regulater = 1 - (this.pts[i].t-0.8)/(1-0.8);
                }
                if (this.pts[i].t<0.2){
                    regulater = 1 - (this.pts[i].t-0.2)/(0.0-0.2);
                }
                let v3 = new Vector3(
                    regulater*Math.sin(this.pts[i].t*Math.PI*4)*10,
                    this.pts[i].t * d, 
                    regulater*Math.cos(this.pts[i].t*Math.PI*4)*10);
                v3 = v3.applyAxisAngle(v3_ro_axis, rad_angle)
                v3 = v3.add(v3_start_loc)
                this.pts[i].x = v3.x;
                this.pts[i].y = v3.y;
                this.pts[i].z = v3.z;
            }

            smart_child_partical_update(settings, this.group, 'child_name', this.pts)
        }


	}

}


function creative_v4(settings){
    // 第一部分初始化

    // creative_group 里面装了所有场景中需要显示的物体
    let creative_group = new THREE.Group() 

    let components = []
    components.push(
        new FlowingLightGenerator({
            start_loc: {x:0,y:0,z:0},
            end_loc:  {x:0,y:100,z:0},
        })
    )
    components.push(
        new FlowingLightGenerator({
            start_loc: {x:0,y:0,z:0},
            end_loc:  {x:0,y:0,z:100},
        })
    )
    components.push(
        new FlowingLightGenerator({
            start_loc: {x:0,y:0,z:0},
            end_loc:  {x:100,y:0,z:0},
        })
    )
    components.push(
        new FlowingLightGenerator({
            start_loc: {x:0,y:0,z:0},
            end_loc:  {x:100,y:100,z:100},
        })
    )
    // put components group into creative group
    for(let i=0; i<components.length; i++){
        creative_group.add(components[i].group)
    }

    // 点集, { x, y, z, theta, phi2, profile }
    let pts = []
    // 创建一个矩阵
    let distance_mat = createArray(settings.n_points, settings.n_points);

    for(let i=0; i<settings.n_points; i++){
        //THREE.Math.randFloatSpread 在区间内随机浮动* - 范围 / 2 到 范围 / 2 *内随机取值。
        let pt = generate_random_point_walk(settings);
        pt.id_index = i;
        pt.connected_by = 0;
        pts.push(pt);
    }

    window.glb.scene.add(creative_group)

    window.glb.render_callback[settings.callbackName] = function _callback({dT, T}){
        // return;
        for(let i=0; i<settings.n_points; i++){
            // pt_profile = pts[i]
            pts[i] = update_point_location(settings, pts[i], T, settings.radius)
        }
        // update particals
        smart_child_partical_update(settings, creative_group, 'particles', pts);

        // update components
        for(let i=0; i<components.length; i++){
            components[i].update(dT, T);
        }
    
    }
}

// pt.x, pt.y, pt.z, setting.dotColor, setting.dotSize
// 说明： 在parent下增加一个THREE.Points对象，填入pts点对应的坐标
function smart_child_partical_update(setting, parent, child_name, pts){
    let child = parent.getObjectByName( child_name );
    if (child==null){
        // exec the first time
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for(let i=0; i<pts.length; i++){vertices.push(0,0,0)}
        let map = '/wget/sp.png';

        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        // materials[ i ] = 
        // new THREE.PointsMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, opacity:.35} );

        child = new THREE.Points( geometry, new THREE.PointsMaterial( { 
            color: setting.dotColor, 
            blending: THREE.AdditiveBlending,
            depthTest: false,
            opacity:0.5,
            transparent: true,
            size:setting.dotSize,
            map:THREE.ImageUtils.loadTexture(map)
         } ) );
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
    PosVec.applyAxisAngle(roAxis2, T*speed*2)
    


    pt.x = PosVec.x
    pt.y = PosVec.y
    pt.z = PosVec.z

    return pt;
}

function distanceSmallerThanTh(pts, i, j, th){
    let pt1profile = pts[i]
    let pt2profile = pts[j]
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

function getDistance(pts, i, j){

    let pt1profile = pts[i]
    let pt2profile = pts[j]
    let distance = Math.sqrt(
        (pt1profile.x-pt2profile.x)**2 +
        (pt1profile.y-pt2profile.y)**2 +
        (pt1profile.z-pt2profile.z)**2
    )
    return distance
}

function getPtDistance(pt1, pt2){
    let distance = Math.sqrt(
        (pt1.x-pt2.x)**2 +
        (pt1.y-pt2.y)**2 +
        (pt1.z-pt2.z)**2
    )
    return distance
}

// 创建一个矩阵
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}










