const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

camera.position.z = 5;

const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

const gridHelper = new THREE.GridHelper(window.innerWidth, 50, 0x000000, 0x000000);
scene.add(gridHelper);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.left = window.innerWidth / -2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / -2;
    camera.updateProjectionMatrix();
});

class Polygon {
    constructor() {
        this.vertices = [];
        this.polygonMesh = null;
        this.lineMesh = null;
        this.points = [];
    }

    addVertex(x, y) {
        const vertex = new THREE.Vector3(x, y, 0);
        this.vertices.push(vertex);
        this.drawPoint(vertex);

        if (this.vertices.length > 1) {
            this.drawEdges();
        }
    }

    drawPoint(vertex) {
        const pointGeometry = new THREE.BufferGeometry().setFromPoints([vertex]);
        const pointMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 5 });
        const point = new THREE.Points(pointGeometry, pointMaterial);
        this.points.push(point);
        scene.add(point);
    }

    complete() {
        if (this.vertices.length > 2) {
            const shape = new THREE.Shape(this.vertices);
            const geometry = new THREE.ShapeGeometry(shape);
            const material = new THREE.MeshBasicMaterial({ color: 0XFFA500 });
            this.polygonMesh = new THREE.Mesh(geometry, material);
            scene.add(this.polygonMesh);
        }
        this.clearLines();
        this.clearPoints();
    }

    drawEdges() {
        if (this.lineMesh) {
            scene.remove(this.lineMesh);
        }

        const points = this.vertices.map(v => new THREE.Vector3(v.x, v.y, v.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        this.lineMesh = new THREE.Line(geometry, material);
        scene.add(this.lineMesh);
    }

    clearLines() {
        if (this.lineMesh) {
            scene.remove(this.lineMesh);
            this.lineMesh = null;
        }
    }

    clearPoints() {
        this.points.forEach(point => scene.remove(point));
        this.points = [];
    }
}

let currentPolygon = new Polygon();

document.addEventListener('mousedown', (event) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        currentPolygon.addVertex(point.x, point.y);
    }
});

document.getElementById('complete-btn').addEventListener('click', () => {
    currentPolygon.complete();
    currentPolygon = new Polygon(); 
});

let copiedPolygon = null;

document.getElementById('copy-btn').addEventListener('click', () => {
    if (currentPolygon.vertices.length > 2 && currentPolygon.polygonMesh) {
        copiedPolygon = new Polygon();
        copiedPolygon.vertices = currentPolygon.vertices.map(vertex => vertex.clone());

        const shape = new THREE.Shape(copiedPolygon.vertices);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        copiedPolygon.polygonMesh = new THREE.Mesh(geometry, material);
        scene.add(copiedPolygon.polygonMesh);

        document.addEventListener('mousemove', moveCopiedPolygon);
        document.addEventListener('mousedown', placeCopiedPolygon);
    }
});

function moveCopiedPolygon(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0 && copiedPolygon.polygonMesh) {
        const point = intersects[0].point;
        copiedPolygon.polygonMesh.position.set(point.x, point.y, 0);
    }
}

function placeCopiedPolygon() {
    document.removeEventListener('mousemove', moveCopiedPolygon);
    document.removeEventListener('mousedown', placeCopiedPolygon);
    copiedPolygon = null;
}

document.getElementById('reset-btn').addEventListener('click', () => {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    scene.add(plane);
    scene.add(gridHelper);
    currentPolygon = new Polygon();
    copiedPolygon = null;
});
