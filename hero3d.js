// ========================================================
// HERO 3D — Interactive Particle Network + Floating Shapes
// ========================================================
(function () {
    const container = document.getElementById('hero-3d-canvas');
    if (!container) return;

    // --- Three.js imports (loaded via importmap / CDN script tag) ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ---- COLORS (matching portfolio palette) ----
    const COL_PRIMARY   = new THREE.Color(0x8ff5ff); // cyan
    const COL_SECONDARY = new THREE.Color(0xac8aff); // purple
    const COL_TERTIARY  = new THREE.Color(0x65afff); // blue
    const COL_HOT       = new THREE.Color(0x00eefc); // bright cyan

    // ---- MOUSE TRACKING ----
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ===========================
    // 1. PARTICLE NETWORK SYSTEM
    // ===========================
    const PARTICLE_COUNT = 250;
    const SPREAD = 50;
    const CONNECTION_DIST = 8;

    // Particle positions & velocities
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
        positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
        positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 0.5;

        velocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.01
        });

        // Random color blend between primary/secondary/tertiary
        const t = Math.random();
        const col = t < 0.33 ? COL_PRIMARY : t < 0.66 ? COL_SECONDARY : COL_TERTIARY;
        colors[i * 3]     = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;

        sizes[i] = Math.random() * 2.5 + 0.8;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader for glowing dots
    const particleMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (200.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                float glow = exp(-dist * 6.0) * 0.6;
                gl_FragColor = vec4(vColor, alpha * 0.8 + glow);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // ---- CONNECTION LINES ----
    const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6); // max
    const lineColors = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // ===========================
    // 2. FLOATING GEOMETRIC SHAPES
    // ===========================
    const shapes = [];

    // Helper: create a glowing wireframe shape
    function createShape(geometry, color, position, scale, rotSpeed) {
        // Wireframe
        const wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending
            })
        );
        wireframe.position.copy(position);
        wireframe.scale.setScalar(scale);

        // Subtle solid inner glow
        const solidMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending,
            wireframe: false
        });
        const solid = new THREE.Mesh(geometry, solidMaterial);
        solid.position.copy(position);
        solid.scale.setScalar(scale);

        scene.add(wireframe);
        scene.add(solid);

        shapes.push({
            wireframe,
            solid,
            rotSpeed: rotSpeed || { x: 0.003, y: 0.005, z: 0.002 },
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.3 + Math.random() * 0.4,
            floatAmplitude: 0.8 + Math.random() * 1.2,
            baseY: position.y
        });
    }

    // Icosahedron (main centerpiece — larger)
    createShape(
        new THREE.IcosahedronGeometry(3, 1),
        COL_PRIMARY,
        new THREE.Vector3(-12, 5, -8),
        1.3,
        { x: 0.002, y: 0.004, z: 0.001 }
    );

    // Octahedron
    createShape(
        new THREE.OctahedronGeometry(2, 0),
        COL_SECONDARY,
        new THREE.Vector3(14, -4, -10),
        1.0,
        { x: 0.003, y: 0.002, z: 0.004 }
    );

    // Torus
    createShape(
        new THREE.TorusGeometry(2, 0.5, 8, 20),
        COL_TERTIARY,
        new THREE.Vector3(-16, -6, -5),
        0.9,
        { x: 0.005, y: 0.003, z: 0.002 }
    );

    // Dodecahedron
    createShape(
        new THREE.DodecahedronGeometry(1.5, 0),
        COL_HOT,
        new THREE.Vector3(18, 7, -12),
        1.1,
        { x: 0.001, y: 0.006, z: 0.003 }
    );

    // Small Tetrahedron cluster
    createShape(
        new THREE.TetrahedronGeometry(1.2, 0),
        COL_PRIMARY,
        new THREE.Vector3(8, 10, -6),
        0.8,
        { x: 0.004, y: 0.003, z: 0.005 }
    );

    createShape(
        new THREE.TorusKnotGeometry(1.5, 0.4, 50, 8),
        COL_SECONDARY,
        new THREE.Vector3(-8, -10, -15),
        0.7,
        { x: 0.003, y: 0.002, z: 0.001 }
    );

    // ===========================
    // 3. CENTRAL ENERGY ORB
    // ===========================
    const orbGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const orbMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;
            void main() {
                vNormal = normal;
                vPosition = position;
                vec3 pos = position;
                pos += normal * sin(uTime * 2.0 + position.y * 3.0) * 0.1;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                vec3 color1 = vec3(0.56, 0.96, 1.0); // primary cyan
                vec3 color2 = vec3(0.67, 0.54, 1.0); // secondary purple
                float mixer = sin(uTime * 0.5 + vPosition.y * 2.0) * 0.5 + 0.5;
                vec3 color = mix(color1, color2, mixer);
                gl_FragColor = vec4(color * intensity * 1.5, intensity * 0.6);
            }
        `,
        uniforms: {
            uTime: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0, 0, -5);
    scene.add(orb);

    // Outer halo ring
    const ringGeometry = new THREE.TorusGeometry(3, 0.03, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: COL_PRIMARY,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0, -5);
    scene.add(ring);

    const ring2 = ring.clone();
    ring2.rotation.x = Math.PI / 2;
    scene.add(ring2);

    // ===========================
    // 4. ANIMATION LOOP
    // ===========================
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Smooth mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // --- Update particles ---
        const pos = particleGeometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3]     += velocities[i].x;
            pos[i * 3 + 1] += velocities[i].y;
            pos[i * 3 + 2] += velocities[i].z;

            // Wrap around boundaries
            const halfSpread = SPREAD / 2;
            if (pos[i * 3] > halfSpread)      pos[i * 3] = -halfSpread;
            if (pos[i * 3] < -halfSpread)     pos[i * 3] = halfSpread;
            if (pos[i * 3 + 1] > halfSpread)  pos[i * 3 + 1] = -halfSpread;
            if (pos[i * 3 + 1] < -halfSpread) pos[i * 3 + 1] = halfSpread;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // --- Update connection lines ---
        let lineIdx = 0;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = pos[i * 3]     - pos[j * 3];
                const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONNECTION_DIST) {
                    const alpha = 1 - dist / CONNECTION_DIST;
                    linePositions[lineIdx * 6]     = pos[i * 3];
                    linePositions[lineIdx * 6 + 1] = pos[i * 3 + 1];
                    linePositions[lineIdx * 6 + 2] = pos[i * 3 + 2];
                    linePositions[lineIdx * 6 + 3] = pos[j * 3];
                    linePositions[lineIdx * 6 + 4] = pos[j * 3 + 1];
                    linePositions[lineIdx * 6 + 5] = pos[j * 3 + 2];

                    // Gradient color on lines
                    const r = 0.56 * alpha, g = 0.96 * alpha, b = 1.0 * alpha;
                    lineColors[lineIdx * 6]     = r;
                    lineColors[lineIdx * 6 + 1] = g;
                    lineColors[lineIdx * 6 + 2] = b;
                    lineColors[lineIdx * 6 + 3] = r;
                    lineColors[lineIdx * 6 + 4] = g;
                    lineColors[lineIdx * 6 + 5] = b;
                    lineIdx++;
                }
            }
        }
        // Zero-out remaining lines
        for (let k = lineIdx * 6; k < linePositions.length; k++) {
            linePositions[k] = 0;
            lineColors[k] = 0;
        }
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIdx * 2);

        // --- Animate floating shapes ---
        shapes.forEach(s => {
            s.wireframe.rotation.x += s.rotSpeed.x;
            s.wireframe.rotation.y += s.rotSpeed.y;
            s.wireframe.rotation.z += s.rotSpeed.z;
            s.solid.rotation.copy(s.wireframe.rotation);

            const floatY = Math.sin(elapsed * s.floatSpeed + s.floatOffset) * s.floatAmplitude;
            s.wireframe.position.y = s.baseY + floatY;
            s.solid.position.y = s.baseY + floatY;
        });

        // --- Animate orb ---
        orbMaterial.uniforms.uTime.value = elapsed;
        orb.rotation.y = elapsed * 0.3;
        orb.rotation.z = elapsed * 0.1;
        orb.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.08);

        ring.rotation.z = elapsed * 0.2;
        ring.rotation.x = Math.sin(elapsed * 0.3) * 0.3;
        ring2.rotation.y = elapsed * 0.15;
        ring2.rotation.x = Math.PI / 2 + Math.cos(elapsed * 0.25) * 0.2;

        // --- Mouse parallax on entire scene ---
        scene.rotation.y += (mouse.x * 0.15 - scene.rotation.y) * 0.03;
        scene.rotation.x += (mouse.y * 0.08 - scene.rotation.x) * 0.03;

        renderer.render(scene, camera);
    }

    animate();

    // ---- RESIZE ----
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
