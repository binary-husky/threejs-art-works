

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
    return create
}

