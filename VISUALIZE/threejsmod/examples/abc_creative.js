function creative(str){
    let selection = match_karg(str, 'selection', 'str', null)
    if(selection=='v1'){
        creative_v1()
    }
}
var radius = 5;
var radius2 = 5;
var v1_dis_threshold = 2;

function smart_child_update(parent, child_name, pt1, pt2, dis, dis_th, allow_create){
    let create = false;
    let child = parent.getObjectByName( child_name );
    if (child==null && !allow_create){
        return false;
    }
    if (child==null && allow_create){
        const geometry = new window.glb.import_LineGeometry();
        const LineMaterial = new window.glb.import_LineMaterial( {
            color:    'White',
            linewidth: 0.03,
            opacity: 1,
            side: THREE.DoubleSide,
            worldUnits: true,
            transparent: true
        } );
        child = new window.glb.import_Line2( geometry, LineMaterial);
        // child = generate_line(pt1, pt2)
        child.pt1_index = pt1.id_index;
        child.pt2_index = pt2.id_index;
        child.name = child_name;
        parent.add(child);
        create = true;
    }


    const positions_catmull = [];
    let seg = 4
    for (let i=0;i<=seg;i++){
        const a = new THREE.Vector3(             
            (pt1.x-pt2.x)*i/seg + pt2.x, 
            (pt1.y-pt2.y)*i/seg + pt2.y, 
            (pt1.z-pt2.z)*i/seg + pt2.z, );
        a.normalize()

        positions_catmull.push( 
            a.x*radius2, 
            a.y*radius2, 
            a.z*radius2, 
        );
    }


    if (dis<=dis_th/2){
        child.material.opacity = 1;
    }else{//    [2/dis_th*(dis_th-x)]  (x=d/2, y=1) (x=d,y=0)
        child.material.opacity = 1 - 2/dis_th*(dis_th-(3*dis_th/2-dis))
    }
    child.geometry.setPositions(positions_catmull);
    child.geometry.needsUpdate=true
    return create;
}


// smart_child_partical_update(v1_group, 'particles', v1_pt)
function smart_child_partical_update(parent, child_name, pts){
    let child = parent.getObjectByName( child_name );
    if (child==null){
        // exec the first time
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for(let i=0; i<pts.length; i++){vertices.push(0,0,0)}
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        child = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 'Blue', size:0.1 } ) );
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

function generate_random_point_walk() {
    let theta = THREE.MathUtils.randFloatSpread(2 * Math.PI); // 经度
    let phi = Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    let phi2 = Math.PI / 2 - phi; // 纬度
    let z = radius * Math.sin(phi2);
    let x = radius * Math.cos(phi2) * Math.cos(theta);
    let y = radius * Math.cos(phi2) * Math.sin(theta);

    let beta = THREE.MathUtils.randFloatSpread(2 * Math.PI);

    let profile = {theta_init:theta, phi_init:phi, beta:beta}
    return { x, y, z, theta, phi2, profile };
}

function update_point_location(pt, T) {
    // let profile = {theta:theta_init, phi:phi_init, beta:beta}

    let speed = 0.15;
    let profile = pt.profile
    let theta = profile.theta_init + T*speed*Math.sin(profile.beta) // THREE.MathUtils.randFloatSpread(2 * Math.PI); // 经度
    let phi = profile.phi_init + T*speed*Math.cos(profile.beta)  // Math.acos(THREE.MathUtils.randFloatSpread(2)); // the angle from z axis 
    let phi2 = Math.PI / 2 - phi; // 纬度
    vec = new THREE.Vector3(
        radius * Math.sin(phi2),
        radius * Math.cos(phi2) * Math.cos(theta),
        radius * Math.cos(phi2) * Math.sin(theta),
    )
    roAxis = new THREE.Vector3(0,1,0)

    vec.applyAxisAngle(roAxis, T*speed*2)

    pt.z = vec.z
    pt.x = vec.x
    pt.y = vec.y

    pt.theta = theta
    pt.phi2 = phi2
    return pt;
}


function distanceSmallerThanTh(v1_pt, i, j, th){
    pt1profile = v1_pt[i]
    pt2profile = v1_pt[j]
    if (
        Math.abs(pt1profile.x-pt2profile.x)>th || 
        Math.abs(pt1profile.y-pt2profile.y)>th || 
        Math.abs(pt1profile.z-pt2profile.z)>th)
    {
        return [false, -1]
    }

    distance =  (pt1profile.x-pt2profile.x)**2 + (pt1profile.y-pt2profile.y)**2 + (pt1profile.z-pt2profile.z)**2
    if (distance>th**2){
        return [false, -1]
    }
    else{
        return [true, Math.sqrt(distance)]
    }
}

function getDistance(v1_pt, i, j){

    pt1profile = v1_pt[i]
    pt2profile = v1_pt[j]
    distance = Math.sqrt(
        (pt1profile.x-pt2profile.x)**2 +
        (pt1profile.y-pt2profile.y)**2 +
        (pt1profile.z-pt2profile.z)**2
    )
    return distance
}
function creative_v1(){
    // alert('call creative success')
    let tic = (new Date()).getTime()
    let n_points = 150;

    var v1_group = new THREE.Group()
    var v1_pt = []
    const star_geometry = new THREE.BufferGeometry();

    for(let i=0; i<n_points; i++){
        //THREE.Math.randFloatSpread 在区间内随机浮动* - 范围 / 2 到 范围 / 2 *内随机取值。
        let pt1 = generate_random_point_walk();
        pt1.id_index = i;
        pt1.connected_by = 0;
        v1_pt.push(pt1);
    }

    window.glb.scene.add(v1_group)
    window.glb.render_callback['creative_v1'] = function creative_v1_callback({dT, T}){
        // console.log(dT)
        // return;
        for(let i=0; i<n_points; i++){
            // pt_profile = v1_pt[i]
            v1_pt[i] = update_point_location(v1_pt[i], T)
        }

        // update particals
        smart_child_partical_update(v1_group, 'particles', v1_pt);


        for(let k=v1_group.children.length-1; k>=0; k--){
            if(v1_group.children[k].name.search("-Line-") != -1){
                let i = v1_group.children[k].pt1_index;
                let j = v1_group.children[k].pt2_index;
                let disSmallerThanThRes = distanceSmallerThanTh(v1_pt, i, j, v1_dis_threshold)
                let boolDisSmallerThanTh = disSmallerThanThRes[0]

                let delete_condition = !boolDisSmallerThanTh // && (v1_pt[i].connected_by<=3) && (v1_pt[j].connected_by<=3)

                if (delete_condition){
                    v1_group.remove(v1_group.children[k])
                    v1_pt[i].connected_by -= 1;v1_pt[j].connected_by -= 1;
                }
            }
        }



        for(let i=0; i<n_points; i++){
            for(let j=0; j<i; j++){
                let name = i.toString()+'-Line-'+ j.toString();
                let disSmallerThanThRes = distanceSmallerThanTh(v1_pt, i, j, v1_dis_threshold)
                let boolDisSmallerThanTh = disSmallerThanThRes[0]
                let dis = disSmallerThanThRes[1]

                let create_condition = boolDisSmallerThanTh && (v1_pt[i].connected_by<=1) && (v1_pt[j].connected_by<=1);
                // let create_condition = boolDisSmallerThanTh;
                let update_condition = boolDisSmallerThanTh;
                if(update_condition || create_condition){
                    create = smart_child_update(v1_group, name, v1_pt[i], v1_pt[j], dis, v1_dis_threshold, allow_create=create_condition)
                    if (create){
                        v1_pt[i].connected_by += 1;v1_pt[j].connected_by += 1;
                    }
                }
            }
        }

        // for(let i=0; i<n_points; i++){
        //     for(let j=0; j<i; j++){
        //         let name = i.toString()+'-Line-'+ j.toString();
        //         let line_obj = v1_group.getObjectByName( name );
        //         if (line_obj){
        //             pt1 = v1_pt[i]
        //             pt2 = v1_pt[j]
        //             update_line(line_obj, pt1,pt2)
        //         }else{
        //             let dis = getDistance(v1_pt, i, j);
        //             if(dis<=v1_dis_threshold){
        //                 pt1 = v1_pt[i]
        //                 pt2 = v1_pt[j]
        //                 let line = generate_line(pt1, pt2)
        //                 line.name = name
        //                 line.pt1_index = i
        //                 line.pt2_index = j
        //                 v1_group.add(line)
        //             }
        //         }
        //     }

        // }


        // let toc = (new Date()).getTime();
        // console.log(toc-tic)
    }


}



function creative_v1_old(){
    // alert('call creative success')
    let n_line = 10;

    LineMaterial = new window.glb.import_LineMaterial( {
        color:    'White',
        linewidth: 0.03, // in world units with size attenuation, pixels otherwise
        worldUnits: true,
        // dashed:     false,
    } );
    var v1_group = new THREE.Group()
    var v1_theta_radius = []
    for(let i=0; i<n_line; i++){
        //THREE.Math.randFloatSpread 在区间内随机浮动* - 范围 / 2 到 范围 / 2 *内随机取值。
        let pt1 = generate_random_point_walk();
        let pt2 = generate_random_point_walk();

        const positions_catmull = [];
        positions_catmull.push( pt1.x, pt1.y, pt1.z )
        positions_catmull.push( pt2.x, pt2.y, pt2.z )

        const geometry = new window.glb.import_LineGeometry();
        geometry.setPositions( positions_catmull );

        let line = new window.glb.import_Line2( geometry, LineMaterial );
        v1_group.add(line)
        v1_theta_radius.push([pt1.profile,pt2.profile])
    }

    window.glb.scene.add(v1_group)

    window.glb.render_callback['creative_v1'] = function({dT, T}){
        for(let i=0; i<n_line; i++){
            pt1profile = v1_theta_radius[i][0]
            pt2profile = v1_theta_radius[i][1]
            let pt1 = update_point_location(pt1profile, T)
            let pt2 = update_point_location(pt2profile, T)
            
            const positions_catmull = [];
            positions_catmull.push( pt1.x, pt1.y, pt1.z )
            positions_catmull.push( pt2.x, pt2.y, pt2.z )
            v1_group.children[i].geometry.setPositions( positions_catmull );
            v1_group.children[i].geometry.computeBoundingSphere();
            v1_group.children[i].computeLineDistances();

        }
    }


}// function update_line(line_obj, pt1,pt2){
//     const positions_catmull = [];
//     positions_catmull.push( pt1.x, pt1.y, pt1.z )
//     positions_catmull.push( pt2.x, pt2.y, pt2.z )
//     line_obj.geometry.setPositions(positions_catmull)
//     line_obj.geometry.computeBoundingSphere();
//     line_obj.computeLineDistances();
// }

// function generate_line(pt1,pt2){
//     const positions_catmull = [];
//     positions_catmull.push( pt1.x, pt1.y, pt1.z )
//     positions_catmull.push( pt2.x, pt2.y, pt2.z )

//     const geometry = new window.glb.import_LineGeometry();
//     geometry.setPositions( positions_catmull );

//     const LineMaterial = new window.glb.import_LineMaterial( {
//         color:    'White',
//         linewidth: 0.03, // in world units with size attenuation, pixels otherwise
//         worldUnits: true,
//         // dashed:     false,
//     } );
//     let line = new window.glb.import_Line2( geometry, LineMaterial)


function smart_child_update_old(parent, child_name, pt1, pt2, dis, dis_th, allow_create){
    let create = false;
    let child = parent.getObjectByName( child_name );
    if (child==null && !allow_create){
        return false;
    }
    if (child==null && allow_create){
        const geometry = new window.glb.import_LineGeometry();
        const LineMaterial = new window.glb.import_LineMaterial( {
            color:    'White',
            linewidth: 0.03,
            opacity: 1,
            side: THREE.DoubleSide,
            worldUnits: true,
            transparent: true
        } );
        child = new window.glb.import_Line2( geometry, LineMaterial);
        // child = generate_line(pt1, pt2)
        child.pt1_index = pt1.id_index;
        child.pt2_index = pt2.id_index;
        child.name = child_name;
        parent.add(child);
        create = true;
    }


    const positions_catmull = [];
    let seg = 4
    for (let i=0;i<=seg;i++){
        const a = new THREE.Vector3(             
            (pt1.x-pt2.x)*i/seg + pt2.x, 
            (pt1.y-pt2.y)*i/seg + pt2.y, 
            (pt1.z-pt2.z)*i/seg + pt2.z, );
        a.normalize()

        positions_catmull.push( 
            a.x*radius2, 
            a.y*radius2, 
            a.z*radius2, 
        );
    }


    if (dis<=dis_th/2){
        child.material.opacity = 1;
    }else{//    [2/dis_th*(dis_th-x)]  (x=d/2, y=1) (x=d,y=0)
        child.material.opacity = 1 - 2/dis_th*(dis_th-(3*dis_th/2-dis))
    }
    child.geometry.setPositions(positions_catmull);
    child.geometry.needsUpdate=true
    return create;
}